from sqlalchemy.orm import Session
from sqlalchemy import func, text
from ortools.linear_solver import pywraplp

from app.models.zone import Zone
from app.models.resource import Resource

from app.services.demand_prediction_service import (
    predict_zone_demand
)

from app.services.routing_service import (
    detect_city
)


# ============================================================
# RESOURCE NORMALIZATION
# ============================================================

RESOURCE_MAP = {
    # Food
    "food_packets": "food_packets",
    "food": "food_packets",
    "supply": "food_packets",
    "relief": "food_packets",
    "relief supply": "food_packets",

    # Water
    "water_liters": "water_liters",
    "water": "water_liters",

    # Medical
    "medical_kits": "medical_kits",
    "medical": "medical_kits",
    "medical supply": "medical_kits",

    # Shelter
    "shelter_capacity": "shelter_capacity",
    "shelter": "shelter_capacity",
}


def normalize_resource_type(resource_type):
    """
    Convert database resource types into the
    standard resource names used by AI demand.
    """

    if not resource_type:
        return None

    normalized = str(
        resource_type
    ).strip().lower()

    return RESOURCE_MAP.get(
        normalized
    )


# ============================================================
# PRIORITY
# ============================================================

def get_priority_details(
    severity_score: float
):
    """
    Project severity is on a 0-100 scale.
    """

    severity = float(
        severity_score or 0
    )

    if severity >= 80:
        return {
            "label": "Critical",
            "weight": 4.0
        }

    if severity >= 60:
        return {
            "label": "High",
            "weight": 3.0
        }

    if severity >= 40:
        return {
            "label": "Medium",
            "weight": 2.0
        }

    return {
        "label": "Low",
        "weight": 1.0
    }


# ============================================================
# MAIN OPTIMIZATION
# ============================================================

def optimize_resource_allocation(
    db: Session
):

    # ========================================================
    # STEP 1
    # GET ALL ZONES
    # ========================================================

    zones = (
        db.query(Zone)
        .order_by(
            Zone.severity_score.desc()
        )
        .all()
    )

    if not zones:

        return {
            "status": "no_zones",
            "message": "No zones found",
            "allocation": []
        }

    # ========================================================
    # STEP 2
    # GET AI DEMAND + CITY FOR EVERY ZONE
    # ========================================================

    zone_demands = []

    for zone in zones:

        prediction = predict_zone_demand(
            db,
            zone.id
        )

        if not prediction:
            continue

        predicted_demand = prediction.get(
            "predicted_demand",
            {}
        )

        demand_values = {}

        for resource_key, data in (
            predicted_demand.items()
        ):

            standard_resource = normalize_resource_type(
                resource_key
            )

            if not standard_resource:
                continue

            # --------------------------------------------
            # Extract predicted value
            # --------------------------------------------

            if isinstance(data, dict):

                value = data.get(
                    "predicted",
                    0
                )

            else:

                value = data

            try:

                value = float(
                    value
                )

            except (
                TypeError,
                ValueError
            ):

                value = 0

            value = max(
                value,
                0
            )

            demand_values[
                standard_resource
            ] = value

        # --------------------------------------------
        # GET ZONE COORDINATES
        # --------------------------------------------

        zone_lat_lon = db.execute(
            text("""
                SELECT
                    ST_Y(ST_Centroid(geometry)),
                    ST_X(ST_Centroid(geometry))
                FROM zones
                WHERE id = :zone_id
            """),
            {
                "zone_id": zone.id
            }
        ).fetchone()

        if not zone_lat_lon:
            continue

        zone_latitude = zone_lat_lon[0]
        zone_longitude = zone_lat_lon[1]

        # --------------------------------------------
        # DETECT CITY
        # --------------------------------------------

        zone_city = detect_city(
            zone_latitude,
            zone_longitude
        )

        if not zone_city:
            continue

        # --------------------------------------------
        # PRIORITY
        # --------------------------------------------

        priority = get_priority_details(
            zone.severity_score
        )

        zone_demands.append({

            "zone_id": zone.id,

            "zone_name": zone.zone_name,

            "city": zone_city,

            "severity": float(
                zone.severity_score or 0
            ),

            "priority": priority["label"],

            "priority_weight": priority["weight"],

            "demand": demand_values

        })

    # ========================================================
    # STEP 3
    # GET AVAILABLE INVENTORY
    # ========================================================

    resources = (
        db.query(Resource)
        .filter(
            func.lower(
                Resource.status
            ) == "available"
        )
        .all()
    )

    # ========================================================
    # GLOBAL INVENTORY SUMMARY
    # ========================================================

    available_resources = {

        "food_packets": 0.0,

        "water_liters": 0.0,

        "medical_kits": 0.0,

        "shelter_capacity": 0.0

    }

    # ========================================================
    # CITY-WISE INVENTORY
    # ========================================================

    available_resources_by_city = {}

    for resource in resources:

        standard_type = normalize_resource_type(
            resource.resource_type
        )

        if not standard_type:
            continue

        # Resource must have coordinates
        # so that its city can be determined.

        if (
            resource.latitude is None
            or resource.longitude is None
        ):
            continue

        resource_city = detect_city(
            resource.latitude,
            resource.longitude
        )

        if not resource_city:
            continue

        capacity = float(
            resource.capacity or 0
        )

        capacity = max(
            capacity,
            0
        )

        # --------------------------------------------
        # GLOBAL TOTAL
        # --------------------------------------------

        available_resources[
            standard_type
        ] += capacity

        # --------------------------------------------
        # CITY TOTAL
        # --------------------------------------------

        if resource_city not in available_resources_by_city:

            available_resources_by_city[
                resource_city
            ] = {

                "food_packets": 0.0,

                "water_liters": 0.0,

                "medical_kits": 0.0,

                "shelter_capacity": 0.0

            }

        available_resources_by_city[
            resource_city
        ][
            standard_type
        ] += capacity

    # ========================================================
    # STEP 4
    # CREATE OR-TOOLS SOLVER
    # ========================================================

    solver = pywraplp.Solver.CreateSolver(
        "GLOP"
    )

    if not solver:

        raise RuntimeError(
            "Unable to create OR-Tools GLOP solver"
        )

    # ========================================================
    # STEP 5
    # CREATE VARIABLES
    # ========================================================
    #
    # x(zone, resource)
    #
    # represents how much of a resource
    # is allocated to a zone.
    #
    # IMPORTANT:
    #
    # The upper bound uses inventory from
    # the SAME CITY as the zone.
    #
    # ========================================================

    allocation_variables = {}

    for zone_data in zone_demands:

        zone_id = zone_data[
            "zone_id"
        ]

        zone_city = zone_data[
            "city"
        ]

        allocation_variables[
            zone_id
        ] = {}

        city_inventory = (
            available_resources_by_city.get(
                zone_city,
                {}
            )
        )

        for resource_type, demand in (
            zone_data["demand"].items()
        ):

            available = city_inventory.get(
                resource_type,
                0
            )

            upper_bound = min(
                demand,
                available
            )

            variable = solver.NumVar(
                0,
                upper_bound,
                f"x_{zone_id}_{resource_type}"
            )

            allocation_variables[
                zone_id
            ][resource_type] = variable

    # ========================================================
    # STEP 6
    # CITY-WISE RESOURCE CAPACITY CONSTRAINTS
    # ========================================================
    #
    # Example:
    #
    # Hyderabad Zone A Food
    # + Hyderabad Zone B Food
    #
    # <= Hyderabad Food Inventory
    #
    # Mumbai inventory is NOT included.
    #
    # ========================================================

    for city, city_inventory in (
        available_resources_by_city.items()
    ):

        for resource_type, total_available in (
            city_inventory.items()
        ):

            variables = []

            for zone_data in zone_demands:

                if zone_data["city"] != city:
                    continue

                zone_id = zone_data[
                    "zone_id"
                ]

                variable = (
                    allocation_variables
                    .get(zone_id, {})
                    .get(resource_type)
                )

                if variable is not None:

                    variables.append(
                        variable
                    )

            if variables:

                solver.Add(
                    solver.Sum(
                        variables
                    )
                    <= total_available
                )

    # ========================================================
    # STEP 7
    # OBJECTIVE FUNCTION
    # ========================================================
    #
    # Maximize weighted demand coverage.
    #
    # Critical = 4
    # High     = 3
    # Medium   = 2
    # Low      = 1
    #
    # ========================================================

    objective_terms = []

    for zone_data in zone_demands:

        zone_id = zone_data[
            "zone_id"
        ]

        priority_weight = zone_data[
            "priority_weight"
        ]

        for resource_type, demand in (
            zone_data["demand"].items()
        ):

            variable = (
                allocation_variables
                .get(zone_id, {})
                .get(resource_type)
            )

            if variable is None:
                continue

            if demand <= 0:
                continue

            coverage_coefficient = (
                priority_weight
                / demand
            )

            objective_terms.append(
                coverage_coefficient
                * variable
            )

    if objective_terms:

        solver.Maximize(
            solver.Sum(
                objective_terms
            )
        )

    # ========================================================
    # STEP 8
    # SOLVE
    # ========================================================

    status = solver.Solve()

    if status not in (
        pywraplp.Solver.OPTIMAL,
        pywraplp.Solver.FEASIBLE
    ):

        return {
            "status": "failed",
            "message": "No feasible allocation found",
            "allocation": []
        }

    # ========================================================
    # STEP 9
    # BUILD RESULT
    # ========================================================

    allocation_result = []

    total_required = 0.0
    total_allocated = 0.0

    resource_summary = {

        "food_packets": {
            "required": 0.0,
            "allocated": 0.0,
            "available": available_resources[
                "food_packets"
            ]
        },

        "water_liters": {
            "required": 0.0,
            "allocated": 0.0,
            "available": available_resources[
                "water_liters"
            ]
        },

        "medical_kits": {
            "required": 0.0,
            "allocated": 0.0,
            "available": available_resources[
                "medical_kits"
            ]
        },

        "shelter_capacity": {
            "required": 0.0,
            "allocated": 0.0,
            "available": available_resources[
                "shelter_capacity"
            ]
        }

    }

    # ========================================================
    # CITY-WISE SUMMARY
    # ========================================================

    city_resource_summary = {}

    for city, inventory in (
        available_resources_by_city.items()
    ):

        city_resource_summary[city] = {

            resource_type: {
                "available": round(
                    value,
                    2
                ),
                "required": 0.0,
                "allocated": 0.0
            }

            for resource_type, value
            in inventory.items()

        }

    # ========================================================
    # BUILD ZONE ALLOCATION
    # ========================================================

    for zone_data in zone_demands:

        zone_id = zone_data[
            "zone_id"
        ]

        zone_city = zone_data[
            "city"
        ]

        zone_result = {

            "zone_id": zone_id,

            "zone_name": zone_data[
                "zone_name"
            ],

            "city": zone_city,

            "severity": zone_data[
                "severity"
            ],

            "priority": zone_data[
                "priority"
            ],

            "priority_weight": zone_data[
                "priority_weight"
            ],

            "resources": {}

        }

        for resource_type, required in (
            zone_data["demand"].items()
        ):

            variable = (
                allocation_variables
                .get(zone_id, {})
                .get(resource_type)
            )

            if variable is not None:

                allocated = (
                    variable.solution_value()
                )

            else:

                allocated = 0.0

            shortage = max(
                required - allocated,
                0
            )

            total_required += required

            total_allocated += allocated

            # --------------------------------------------
            # GLOBAL SUMMARY
            # --------------------------------------------

            resource_summary[
                resource_type
            ][
                "required"
            ] += required

            resource_summary[
                resource_type
            ][
                "allocated"
            ] += allocated

            # --------------------------------------------
            # CITY SUMMARY
            # --------------------------------------------

            if zone_city not in city_resource_summary:

                city_resource_summary[
                    zone_city
                ] = {}

            if resource_type not in (
                city_resource_summary[
                    zone_city
                ]
            ):

                city_resource_summary[
                    zone_city
                ][resource_type] = {

                    "available": 0.0,

                    "required": 0.0,

                    "allocated": 0.0

                }

            city_resource_summary[
                zone_city
            ][
                resource_type
            ][
                "required"
            ] += required

            city_resource_summary[
                zone_city
            ][
                resource_type
            ][
                "allocated"
            ] += allocated

            # --------------------------------------------
            # ZONE RESULT
            # --------------------------------------------

            zone_result[
                "resources"
            ][resource_type] = {

                "required": round(
                    required,
                    2
                ),

                "allocated": round(
                    allocated,
                    2
                ),

                "shortage": round(
                    shortage,
                    2
                )

            }

        allocation_result.append(
            zone_result
        )

    # ========================================================
    # STEP 10
    # COVERAGE
    # ========================================================

    if total_required > 0:

        overall_coverage = (
            total_allocated
            / total_required
        ) * 100

    else:

        overall_coverage = 0

    # ========================================================
    # STEP 11
    # ROUND GLOBAL RESOURCE SUMMARY
    # ========================================================

    for resource_type in resource_summary:

        resource_summary[
            resource_type
        ][
            "required"
        ] = round(
            resource_summary[
                resource_type
            ][
                "required"
            ],
            2
        )

        resource_summary[
            resource_type
        ][
            "allocated"
        ] = round(
            resource_summary[
                resource_type
            ][
                "allocated"
            ],
            2
        )

        resource_summary[
            resource_type
        ][
            "available"
        ] = round(
            resource_summary[
                resource_type
            ][
                "available"
            ],
            2
        )

    # ========================================================
    # STEP 12
    # ROUND CITY SUMMARY
    # ========================================================

    for city in city_resource_summary:

        for resource_type in city_resource_summary[
            city
        ]:

            city_resource_summary[
                city
            ][
                resource_type
            ][
                "available"
            ] = round(
                city_resource_summary[
                    city
                ][
                    resource_type
                ][
                    "available"
                ],
                2
            )

            city_resource_summary[
                city
            ][
                resource_type
            ][
                "required"
            ] = round(
                city_resource_summary[
                    city
                ][
                    resource_type
                ][
                    "required"
                ],
                2
            )

            city_resource_summary[
                city
            ][
                resource_type
            ][
                "allocated"
            ] = round(
                city_resource_summary[
                    city
                ][
                    resource_type
                ][
                    "allocated"
                ],
                2
            )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "status": "optimized",

        "solver": "OR-Tools GLOP",

        "objective":
            "Maximize weighted demand coverage",

        "total_required": round(
            total_required,
            2
        ),

        "total_allocated": round(
            total_allocated,
            2
        ),

        "overall_coverage_percent": round(
            overall_coverage,
            2
        ),

        # Global inventory
        "available_resources": {
            key: round(
                value,
                2
            )
            for key, value
            in available_resources.items()
        },

        # Global summary
        "resource_summary":
            resource_summary,

        # New city-wise summary
        "city_resource_summary":
            city_resource_summary,

        # Zone allocations
        "allocation":
            allocation_result

    }