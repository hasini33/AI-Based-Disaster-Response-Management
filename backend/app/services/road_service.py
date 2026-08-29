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
       text( """
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


def create_sample_roads(db: Session):

    existing = db.query(Road).count()

    if existing > 0:
        return {
            "message": "Road data already exists",
            "count": existing
        }

    # --------------------------------------------------
    # Get all existing zones
    # --------------------------------------------------

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

    roads = []

    # --------------------------------------------------
    # Create a connected road network
    #
    # Each zone is connected to the next zone.
    # The first zone is also connected to the
    # Relief Center A coordinates.
    # --------------------------------------------------

    depot_latitude = 17.380
    depot_longitude = 78.480

    zone_points = []

    for zone in zones:

        coordinates = get_zone_coordinates(
            db,
            zone.id
        )

        if coordinates:

            zone_points.append({
                "zone": zone,
                "latitude": coordinates["latitude"],
                "longitude": coordinates["longitude"]
            })

    # --------------------------------------------------
    # Depot → first zone
    # --------------------------------------------------

    if zone_points:

        first = zone_points[0]

        roads.append(
            Road(
                road_name="Relief Center Main Route",

                start_latitude=depot_latitude,
                start_longitude=depot_longitude,

                end_latitude=first["latitude"],
                end_longitude=first["longitude"],

                distance_km=1.0,
                status="Open",
                travel_time_minutes=5
            )
        )

    # --------------------------------------------------
    # Connect every zone to the next zone
    # --------------------------------------------------

    for index in range(
        len(zone_points) - 1
    ):

        current = zone_points[index]
        next_zone = zone_points[index + 1]

        roads.append(
            Road(
                road_name=(
                    f"{current['zone'].zone_name}"
                    f" - "
                    f"{next_zone['zone'].zone_name}"
                    f" Road"
                ),

                start_latitude=current["latitude"],
                start_longitude=current["longitude"],

                end_latitude=next_zone["latitude"],
                end_longitude=next_zone["longitude"],

                distance_km=2.0,
                status="Open",
                travel_time_minutes=8
            )
        )

    # --------------------------------------------------
    # Add an alternative route from the depot
    # --------------------------------------------------

    if len(zone_points) >= 2:

        second = zone_points[1]

        roads.append(
            Road(
                road_name="Emergency Bypass",

                start_latitude=depot_latitude,
                start_longitude=depot_longitude,

                end_latitude=second["latitude"],
                end_longitude=second["longitude"],

                distance_km=3.5,
                status="Open",
                travel_time_minutes=12
            )
        )

    # --------------------------------------------------
    # Add one blocked road for disaster testing
    # --------------------------------------------------

    if len(zone_points) >= 3:

        blocked_zone = zone_points[2]

        roads.append(
            Road(
                road_name="Flood Damaged Road",

                start_latitude=depot_latitude,
                start_longitude=depot_longitude,

                end_latitude=blocked_zone["latitude"],
                end_longitude=blocked_zone["longitude"],

                distance_km=2.5,
                status="Blocked",
                travel_time_minutes=0
            )
        )

    # --------------------------------------------------
    # Save roads
    # --------------------------------------------------

    db.add_all(roads)

    db.commit()

    return {
        "message": "Connected zone road network created",
        "count": len(roads)
    }