from sqlalchemy.orm import Session

from app.models.road import Road


def create_sample_roads(db: Session):

    existing = db.query(Road).count()

    if existing > 0:
        return {
            "message": "Road data already exists",
            "count": existing
        }

    roads = [

        Road(
            road_name="Main Road",
            start_latitude=17.380,
            start_longitude=78.480,
            end_latitude=17.375,
            end_longitude=78.475,
            distance_km=0.77,
            status="Open",
            travel_time_minutes=3
        ),

        Road(
            road_name="East Bypass",
            start_latitude=17.380,
            start_longitude=78.480,
            end_latitude=17.370,
            end_longitude=78.465,
            distance_km=1.90,
            status="Open",
            travel_time_minutes=7
        ),

        Road(
            road_name="North Route",
            start_latitude=17.400,
            start_longitude=78.500,
            end_latitude=17.375,
            end_longitude=78.475,
            distance_km=3.60,
            status="Open",
            travel_time_minutes=12
        ),

        Road(
            road_name="Flooded Road",
            start_latitude=17.385,
            start_longitude=78.486,
            end_latitude=17.375,
            end_longitude=78.475,
            distance_km=1.50,
            status="Blocked",
            travel_time_minutes=0
        )
    ]

    db.add_all(roads)
    db.commit()

    return {
        "message": "Sample roads created",
        "count": len(roads)
    }