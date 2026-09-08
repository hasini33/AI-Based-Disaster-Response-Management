from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.road import Road
from app.models.zone import Zone


def get_zone_coordinates(
    db: Session,
    zone_id: int
):
    """
    Get the centroid coordinates of a zone.
    """

    result = db.execute(
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

    if not result:
        return None

    return {
        "latitude": result[0],
        "longitude": result[1]
    }


# ------------------------------------------------------
# CITY DEFINITIONS
# ------------------------------------------------------
#
# Option A:
# We don't add a city column to the database.
#
# Instead, city membership is determined from coordinates.
# ------------------------------------------------------

CITY_REGIONS = {
    "Hyderabad": {
        "latitude": 17.385,
        "longitude": 78.486,
        "radius_km": 80
    },

    "Mumbai": {
        "latitude": 19.076,
        "longitude": 72.877,
        "radius_km": 80
    },

    "Chennai": {
        "latitude": 13.082,
        "longitude": 80.270,
        "radius_km": 80
    },

    "Bhubaneswar": {
        "latitude": 20.296,
        "longitude": 85.824,
        "radius_km": 80
    },

    "Delhi": {
        "latitude": 28.613,
        "longitude": 77.209,
        "radius_km": 80
    }
}


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

    from math import radians, sin, cos, sqrt, atan2

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


def detect_city(
    latitude: float,
    longitude: float
):
    """
    Determine which supported city a coordinate belongs to.

    This uses geographic distance instead of a database
    city column.
    """

    nearest_city = None
    shortest_distance = None

    for city, data in CITY_REGIONS.items():

        distance = calculate_distance(
            latitude,
            longitude,
            data["latitude"],
            data["longitude"]
        )

        if distance <= data["radius_km"]:

            if (
                shortest_distance is None
                or distance < shortest_distance
            ):
                shortest_distance = distance
                nearest_city = city

    return nearest_city


def get_existing_road_names(
    db: Session
):
    """
    Return existing road names so that running the
    seed operation multiple times does not create
    duplicate roads.
    """

    roads = db.query(Road.road_name).all()

    return {
        road[0]
        for road in roads
    }


def create_city_road_network(
    db: Session,
    city_name: str,
    center_latitude: float,
    center_longitude: float,
    zones: list,
    prefix: str
):
    """
    Create a clean local road network using only the
    current disaster zones belonging to this city.

    Structure:

        City Relief Center
                |
             Zone A
                |
             Zone B
    """

    existing_names = get_existing_road_names(db)
    roads = []

    # --------------------------------------------------
    # Only use current multi-city disaster zones
    # --------------------------------------------------

    city_zones = []

    for zone in zones:

        # Ignore old/general dashboard zones
        if not zone.zone_name.startswith(city_name):
            continue

        coordinates = get_zone_coordinates(db, zone.id)

        if not coordinates:
            continue

        city_zones.append({
            "zone": zone,
            "latitude": coordinates["latitude"],
            "longitude": coordinates["longitude"]
        })

    if not city_zones:
        return []

    # --------------------------------------------------
    # Sort by zone ID
    # --------------------------------------------------

    city_zones.sort(
        key=lambda item: item["zone"].id
    )

    # --------------------------------------------------
    # Relief Center → Zone A
    # --------------------------------------------------

    first = city_zones[0]

    road_name = f"{prefix} Relief Center Route"

    if road_name not in existing_names:

        distance = calculate_distance(
            center_latitude,
            center_longitude,
            first["latitude"],
            first["longitude"]
        )

        roads.append(
            Road(
                road_name=road_name,
                start_latitude=center_latitude,
                start_longitude=center_longitude,
                end_latitude=first["latitude"],
                end_longitude=first["longitude"],
                distance_km=round(max(distance, 0.5), 2),
                status="Open",
                travel_time_minutes=round(max(distance * 2.5, 2), 1)
            )
        )

    # --------------------------------------------------
    # Zone A → Zone B
    # --------------------------------------------------

    for index in range(len(city_zones) - 1):

        current = city_zones[index]
        next_zone = city_zones[index + 1]

        road_name = (
            f"{prefix} "
            f"{current['zone'].zone_name} - "
            f"{next_zone['zone'].zone_name} Road"
        )

        if road_name in existing_names:
            continue

        distance = calculate_distance(
            current["latitude"],
            current["longitude"],
            next_zone["latitude"],
            next_zone["longitude"]
        )

        roads.append(
            Road(
                road_name=road_name,
                start_latitude=current["latitude"],
                start_longitude=current["longitude"],
                end_latitude=next_zone["latitude"],
                end_longitude=next_zone["longitude"],
                distance_km=round(max(distance, 0.5), 2),
                status="Open",
                travel_time_minutes=round(max(distance * 2.5, 2), 1)
            )
        )

    # --------------------------------------------------
    # Emergency bypass to Zone B
    # --------------------------------------------------

    if len(city_zones) >= 2:

        second = city_zones[1]

        road_name = f"{prefix} Emergency Bypass"

        if road_name not in existing_names:

            distance = calculate_distance(
                center_latitude,
                center_longitude,
                second["latitude"],
                second["longitude"]
            )

            roads.append(
                Road(
                    road_name=road_name,
                    start_latitude=center_latitude,
                    start_longitude=center_longitude,
                    end_latitude=second["latitude"],
                    end_longitude=second["longitude"],
                    distance_km=round(max(distance, 0.5), 2),
                    status="Open",
                    travel_time_minutes=round(max(distance * 2.5, 2), 1)
                )
            )

    return roads

def create_sample_roads(db: Session):
    """
    Create clean road networks for the five supported cities.
    """

    zones = (
        db.query(Zone)
        .order_by(Zone.id)
        .all()
    )

    if not zones:
        return {
            "message": "No zones found",
            "count": 0
        }

    all_roads = []

    cities = [
        ("Hyderabad", 17.380, 78.480),
        ("Mumbai", 19.076, 72.877),
        ("Chennai", 13.082, 80.270),
        ("Bhubaneswar", 20.296, 85.824),
        ("Delhi", 28.613, 77.209),
    ]

    for city_name, lat, lon in cities:

        all_roads.extend(
            create_city_road_network(
                db=db,
                city_name=city_name,
                center_latitude=lat,
                center_longitude=lon,
                zones=zones,
                prefix=city_name
            )
        )

    if all_roads:
        db.add_all(all_roads)
        db.commit()

    return {
        "message": "Clean multi-city road networks created",
        "new_roads": len(all_roads),
        "total_roads": db.query(Road).count(),
        "cities": [c[0] for c in cities]
    }