from math import radians, sin, cos, sqrt, atan2

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.depot import Depot
from app.models.zone import Zone
from app.models.road import Road


def calculate_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
):
    """
    Calculate approximate distance between
    two latitude/longitude points in kilometers.
    """

    earth_radius = 6371.0

    lat1 = radians(lat1)
    lon1 = radians(lon1)

    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )

    return earth_radius * c


def find_nearest_depot(
    db: Session,
    zone_id: int
):
    """
    Find the nearest available valid depot.

    This is kept for backward compatibility with
    the original routing endpoint.
    """

    zone = (
        db.query(Zone)
        .filter(
            Zone.id == zone_id
        )
        .first()
    )

    if not zone:
        return None

    coordinates = db.execute(
        text("""
            SELECT
                ST_Y(ST_Centroid(geometry)),
                ST_X(ST_Centroid(geometry))
            FROM zones
            WHERE id = :zone_id
        """),
        {
            "zone_id": zone_id
        }
    ).fetchone()

    if not coordinates:
        return None

    zone_lat = coordinates[0]
    zone_lon = coordinates[1]

    # Only valid supply-related depots
    depots = (
        db.query(Depot)
        .filter(
            Depot.status == "Available",
            Depot.depot_type.in_([
                "Supply",
                "Medical",
                "Water",
                "Shelter"
            ])
        )
        .all()
    )

    if not depots:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "message": "No available depots found",
            "route": None
        }

    nearest_depot = None
    shortest_distance = None

    for depot in depots:

        if (
            depot.latitude is None
            or depot.longitude is None
        ):
            continue

        distance = calculate_distance(
            depot.latitude,
            depot.longitude,
            zone_lat,
            zone_lon
        )

        if (
            shortest_distance is None
            or distance < shortest_distance
        ):
            shortest_distance = distance
            nearest_depot = depot

    if not nearest_depot:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "message": "No depot with valid coordinates",
            "route": None
        }

    return {
        "zone_id": zone.id,
        "zone_name": zone.zone_name,

        "destination": {
            "latitude": zone_lat,
            "longitude": zone_lon
        },

        "route": {
            "depot_id": nearest_depot.id,
            "depot_name": nearest_depot.depot_name,
            "depot_type": nearest_depot.depot_type,

            "depot_latitude": nearest_depot.latitude,
            "depot_longitude": nearest_depot.longitude,

            "distance_km": round(
                shortest_distance,
                2
            )
        }
    }


def get_road_status(
    db: Session
):
    """
    Return currently open roads.
    Blocked roads are intentionally excluded.
    """

    roads = (
        db.query(Road)
        .filter(
            Road.status == "Open"
        )
        .all()
    )

    return [
        {
            "id": road.id,
            "name": road.road_name,

            "start": (
                road.start_latitude,
                road.start_longitude
            ),

            "end": (
                road.end_latitude,
                road.end_longitude
            ),

            "distance_km": road.distance_km,

            "travel_time_minutes":
                road.travel_time_minutes
        }

        for road in roads
    ]


def optimize_route(
    db: Session,
    zone_id: int,
    resource_type: str = "all"
):
    """
    Find the best available road route
    for a specific resource type.

    Only available and compatible depots are considered.
    Only open roads are considered.
    """

    # --------------------------------------------------
    # 1. Find zone
    # --------------------------------------------------

    zone = (
        db.query(Zone)
        .filter(
            Zone.id == zone_id
        )
        .first()
    )

    if not zone:
        return None

    # --------------------------------------------------
    # 2. Get zone coordinates
    # --------------------------------------------------

    coordinates = db.execute(
        text("""
            SELECT
                ST_Y(ST_Centroid(geometry)),
                ST_X(ST_Centroid(geometry))
            FROM zones
            WHERE id = :zone_id
        """),
        {
            "zone_id": zone_id
        }
    ).fetchone()

    if not coordinates:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "message": "Zone has no valid geometry",
            "route": None
        }

    zone_lat = coordinates[0]
    zone_lon = coordinates[1]

    # --------------------------------------------------
    # 3. Resource → Depot type mapping
    # --------------------------------------------------

    allowed_types = {

        "food": [
            "Supply"
        ],

        "food_packets": [
            "Supply"
        ],

        "water": [
            "Water"
        ],

        "water_liters": [
            "Water"
        ],

        "medical": [
            "Medical"
        ],

        "medical_kits": [
            "Medical"
        ],

        "shelter": [
            "Shelter"
        ],

        "shelter_capacity": [
            "Shelter"
        ],

        "all": [
            "Supply",
            "Medical",
            "Water",
            "Shelter"
        ]
    }

    resource_key = resource_type.lower().strip()

    selected_types = allowed_types.get(
        resource_key
    )

    if not selected_types:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "resource_type": resource_type,
            "message": (
                f"Unsupported resource type: "
                f"{resource_type}"
            ),
            "route": None
        }

    # --------------------------------------------------
    # 4. Find compatible available depots
    # --------------------------------------------------

    depots = (
        db.query(Depot)
        .filter(
            Depot.status == "Available",
            Depot.depot_type.in_(
                selected_types
            )
        )
        .all()
    )

    if not depots:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "resource_type": resource_type,
            "message": (
                "No available depot found "
                "for this resource type"
            ),
            "route": None
        }

    # --------------------------------------------------
    # 5. Get open roads
    # --------------------------------------------------

    roads = (
        db.query(Road)
        .filter(
            Road.status == "Open"
        )
        .all()
    )

    if not roads:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "resource_type": resource_type,
            "message": "No open roads available",
            "route": None
        }

    # --------------------------------------------------
    # 6. Find roads reaching the zone
    # --------------------------------------------------

    destination_roads = []

    for road in roads:

        end_distance = calculate_distance(
            road.end_latitude,
            road.end_longitude,
            zone_lat,
            zone_lon
        )

        # Road endpoint must be reasonably close
        # to the affected zone.
        if end_distance <= 1.0:

            destination_roads.append(
                (
                    road,
                    end_distance
                )
            )

    if not destination_roads:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "resource_type": resource_type,
            "message": (
                "No open road reaches this zone"
            ),
            "route": None
        }

    # --------------------------------------------------
    # 7. Find best depot + road combination
    # --------------------------------------------------

    best_route = None
    best_distance = None

    for depot in depots:

        if (
            depot.latitude is None
            or depot.longitude is None
        ):
            continue

        for road, end_distance in destination_roads:

            start_distance = calculate_distance(
                depot.latitude,
                depot.longitude,
                road.start_latitude,
                road.start_longitude
            )

            total_distance = (
                start_distance
                + road.distance_km
                + end_distance
            )

            if (
                best_distance is None
                or total_distance < best_distance
            ):

                best_distance = total_distance

                best_route = {
                    "depot": depot,
                    "road": road,
                    "start_distance": start_distance,
                    "end_distance": end_distance
                }

    # --------------------------------------------------
    # 8. No feasible route
    # --------------------------------------------------

    if not best_route:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "resource_type": resource_type,
            "message": "No feasible route found",
            "route": None
        }

    # --------------------------------------------------
    # 9. Build response
    # --------------------------------------------------

    depot = best_route["depot"]
    road = best_route["road"]

    return {
        "zone_id": zone.id,
        "zone_name": zone.zone_name,

        "resource_type": resource_type,

        "destination": {
            "latitude": zone_lat,
            "longitude": zone_lon
        },

        "route": {
            "depot_id": depot.id,
            "depot_name": depot.depot_name,
            "depot_type": depot.depot_type,

            "depot_latitude": depot.latitude,
            "depot_longitude": depot.longitude,

            "road_id": road.id,
            "road_name": road.road_name,
            "road_status": road.status,

            "distance_km": round(
                best_distance,
                2
            ),

            "travel_time_minutes":
                road.travel_time_minutes
        }
    }