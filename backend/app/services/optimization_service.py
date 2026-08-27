from sqlalchemy.orm import Session
from sqlalchemy import func
from ortools.linear_solver import pywraplp

from app.models.zone import Zone
from app.models.resource import Resource
from app.services.demand_prediction_service import (
    predict_zone_demand
)


# ============================================================
# RESOURCE NORMALIZATION
# ============================================================

RESOURCE_MAP = {
    "food_packets": "food_packets",
    "food": "food_packets",

    "water_liters": "water_liters",
    "water": "water_liters",

    "medical_kits": "medical_kits",
    "medical": "medical_kits",

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
    # GET AI DEMAND FOR EVERY ZONE
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

        priority = get_priority_details(
            zone.severity_score
        )

        zone_demands.append({

            "zone_id": zone.id,

            "zone_name": zone.zone_name,

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
    #
    # IMPORTANT:
    # Status can be:
    #
    # Available
    # available
    #
    # So we normalize it using LOWER().
    #
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

    available_resources = {

        "food_packets": 0.0,

        "water_liters": 0.0,

        "medical_kits": 0.0,

        "shelter_capacity": 0.0

    }

    # ========================================================
    # STEP 4
    # SUM INVENTORY BY RESOURCE TYPE
    # ========================================================

    for resource in resources:

        standard_type = normalize_resource_type(
            resource.resource_type
        )

        # Ignore:
        #
        # Hospital
        # Ambulance
        # Relief Center
        # etc.
        #
        if not standard_type:
            continue

        capacity = float(
            resource.capacity or 0
        )

        capacity = max(
            capacity,
            0
        )

        available_resources[
            standard_type
        ] += capacity

    # ========================================================
    # STEP 5
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
    # STEP 6
    # CREATE VARIABLES
    # ========================================================
    #
    # x(zone, resource)
    #
    # represents how much of a resource
    # is allocated to a zone.
    #
    # ========================================================

    allocation_variables = {}

    for zone_data in zone_demands:

        zone_id = zone_data[
            "zone_id"
        ]

        allocation_variables[
            zone_id
        ] = {}

        for resource_type, demand in (
            zone_data["demand"].items()
        ):

            available = available_resources.get(
                resource_type,
                0
            )

            # If no inventory exists,
            # allocation is forced to zero.
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
    # STEP 7
    # RESOURCE CAPACITY CONSTRAINTS
    # ========================================================
    #
    # Example:
    #
    # Zone A Water
    # + Zone B Water
    # + Zone C Water
    #
    # <= 4300 liters
    #
    # ========================================================

    for resource_type, total_available in (
        available_resources.items()
    ):

        variables = []

        for zone_data in zone_demands:

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
    # STEP 8
    # OBJECTIVE FUNCTION
    # ========================================================
    #
    # We maximize weighted percentage coverage.
    #
    # This is better than simply maximizing raw quantities
    # because Food, Water and Medical have different units.
    #
    # Example:
    #
    # Critical zone:
    #     weight = 4
    #
    # High:
    #     weight = 3
    #
    # Medium:
    #     weight = 2
    #
    # Low:
    #     weight = 1
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
    # STEP 9
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
    # STEP 10
    # BUILD RESULT
    # ========================================================

    allocation_result = []

    total_required = 0.0
    total_allocated = 0.0

    # Resource-level totals

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

    for zone_data in zone_demands:

        zone_id = zone_data[
            "zone_id"
        ]

        zone_result = {

            "zone_id": zone_id,

            "zone_name": zone_data[
                "zone_name"
            ],

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
    # STEP 11
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
    # STEP 12
    # ROUND RESOURCE SUMMARY
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

        "available_resources": {
            key: round(
                value,
                2
            )
            for key, value
            in available_resources.items()
        },

        "resource_summary":
            resource_summary,

        "allocation":
            allocation_result

    }