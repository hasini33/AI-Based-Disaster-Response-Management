from math import radians, sin, cos, sqrt, atan2

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.depot import Depot
from app.models.zone import Zone
from app.models.road import Road


# ==========================================================
# CITY DEFINITIONS
# ==========================================================

CITY_REGIONS = {
    "Hyderabad": {
        "latitude": 17.385,
        "longitude": 78.486,
        "radius_km": 80,
    },
    "Mumbai": {
        "latitude": 19.076,
        "longitude": 72.877,
        "radius_km": 80,
    },
    "Chennai": {
        "latitude": 13.082,
        "longitude": 80.270,
        "radius_km": 80,
    },
    "Bhubaneswar": {
        "latitude": 20.296,
        "longitude": 85.824,
        "radius_km": 80,
    },
    "Delhi": {
        "latitude": 28.613,
        "longitude": 77.209,
        "radius_km": 80,
    },
}


# ==========================================================
# DISTANCE
# ==========================================================

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


# ==========================================================
# CITY DETECTION
# ==========================================================

def detect_city(
    latitude: float,
    longitude: float
):
    """
    Determine the nearest supported city.

    A point is assigned to a city only if it is
    within that city's configured radius.
    """

    nearest_city = None
    nearest_distance = None

    for city_name, city in CITY_REGIONS.items():

        distance = calculate_distance(
            latitude,
            longitude,
            city["latitude"],
            city["longitude"]
        )

        if distance <= city["radius_km"]:

            if (
                nearest_distance is None
                or distance < nearest_distance
            ):
                nearest_distance = distance
                nearest_city = city_name

    return nearest_city


# ==========================================================
# ZONE COORDINATES
# ==========================================================

def get_zone_coordinates(
    db: Session,
    zone_id: int
):
    """
    Get the centroid coordinates of a zone.
    """

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

    return coordinates[0], coordinates[1]


# ==========================================================
# FIND NEAREST DEPOT
# ==========================================================

def find_nearest_depot(
    db: Session,
    zone_id: int
):
    """
    Find the nearest available depot in the
    same city as the affected zone.

    Kept for backward compatibility with
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

    coordinates = get_zone_coordinates(
        db,
        zone_id
    )

    if not coordinates:
        return None

    zone_lat, zone_lon = coordinates

    zone_city = detect_city(
        zone_lat,
        zone_lon
    )

    # --------------------------------------------------
    # Find compatible depots
    # --------------------------------------------------

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

    if zone_city:
        city_depots = []

        for depot in depots:

            if (
                depot.latitude is None
                or depot.longitude is None
            ):
                continue

            depot_city = detect_city(
                depot.latitude,
                depot.longitude
            )

            if depot_city == zone_city:
                city_depots.append(depot)

        depots = city_depots

    if not depots:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "city": zone_city,
            "message": "No available same-city depots found",
            "route": None
        }

    # --------------------------------------------------
    # Find nearest depot
    # --------------------------------------------------

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
            "city": zone_city,
            "message": "No depot with valid coordinates",
            "route": None
        }

    return {
        "zone_id": zone.id,
        "zone_name": zone.zone_name,
        "city": zone_city,

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


# ==========================================================
# ROAD STATUS
# ==========================================================

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

    result = []

    for road in roads:

        city = detect_city(
            road.start_latitude,
            road.start_longitude
        )

        result.append({
            "id": road.id,
            "name": road.road_name,
            "city": city,

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
        })

    return result


# ==========================================================
# OPTIMIZE ROUTE
# ==========================================================

def optimize_route(
    db: Session,
    zone_id: int,
    resource_type: str = "all"
):
    """
    Find the best available road route for a
    specific resource type.

    IMPORTANT:
    Depot and road candidates are restricted
    to the same city as the affected zone.
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

    coordinates = get_zone_coordinates(
        db,
        zone_id
    )

    if not coordinates:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "message": "Zone has no valid geometry",
            "route": None
        }

    zone_lat, zone_lon = coordinates

    # --------------------------------------------------
    # 3. Detect city
    # --------------------------------------------------

    zone_city = detect_city(
        zone_lat,
        zone_lon
    )

    # --------------------------------------------------
    # 4. Resource → Depot type mapping
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

    resource_key = (
        resource_type
        .lower()
        .strip()
    )

    selected_types = allowed_types.get(
        resource_key
    )

    if not selected_types:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "city": zone_city,
            "resource_type": resource_type,
            "message": (
                f"Unsupported resource type: "
                f"{resource_type}"
            ),
            "route": None
        }

    # --------------------------------------------------
    # 5. Find compatible available depots
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

    # --------------------------------------------------
    # IMPORTANT:
    # Keep only depots from the same city
    # --------------------------------------------------

    if zone_city:

        same_city_depots = []

        for depot in depots:

            if (
                depot.latitude is None
                or depot.longitude is None
            ):
                continue

            depot_city = detect_city(
                depot.latitude,
                depot.longitude
            )

            if depot_city == zone_city:
                same_city_depots.append(
                    depot
                )

        depots = same_city_depots

    if not depots:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "city": zone_city,
            "resource_type": resource_type,
            "message": (
                "No available same-city depot "
                "found for this resource type"
            ),
            "route": None
        }

    # --------------------------------------------------
    # 6. Get open roads
    # --------------------------------------------------

    roads = (
        db.query(Road)
        .filter(
            Road.status == "Open"
        )
        .all()
    )

    # --------------------------------------------------
    # IMPORTANT:
    # Keep only roads belonging to the zone's city
    # --------------------------------------------------

    if zone_city:

        same_city_roads = []

        for road in roads:

            start_city = detect_city(
                road.start_latitude,
                road.start_longitude
            )

            end_city = detect_city(
                road.end_latitude,
                road.end_longitude
            )

            if (
                start_city == zone_city
                and end_city == zone_city
            ):
                same_city_roads.append(
                    road
                )

        roads = same_city_roads

    if not roads:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "city": zone_city,
            "resource_type": resource_type,
            "message": (
                "No open roads available "
                "in this city"
            ),
            "route": None
        }

    # --------------------------------------------------
    # 7. Find roads reaching the zone
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
            "city": zone_city,
            "resource_type": resource_type,
            "message": (
                "No open road reaches this zone"
            ),
            "route": None
        }

    # --------------------------------------------------
    # 8. Find best depot + road combination
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
    # 9. No feasible route
    # --------------------------------------------------

    if not best_route:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "city": zone_city,
            "resource_type": resource_type,
            "message": "No feasible route found",
            "route": None
        }

    # --------------------------------------------------
    # 10. Build response
    # --------------------------------------------------

    depot = best_route["depot"]
    road = best_route["road"]

    return {
        "zone_id": zone.id,
        "zone_name": zone.zone_name,
        "city": zone_city,

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