from sqlalchemy.orm import Session
from geoalchemy2 import functions

from app.models.disaster import Disaster
from app.models.zone import Zone


def assign_disaster_to_zone(db: Session, disaster_id: int):

    # Get disaster
    disaster = (
        db.query(Disaster)
        .filter(Disaster.id == disaster_id)
        .first()
    )

    if not disaster:
        return None


    # Find matching zone
    zone = (
        db.query(Zone)
        .filter(
            functions.ST_Contains(
                Zone.geometry,
                disaster.location
            )
        )
        .first()
    )


    if zone:

        disaster.zone_id = zone.id

        db.commit()
        db.refresh(disaster)

        return {
            "disaster_id": disaster.id,
            "zone_id": zone.id,
            "zone_name": zone.name
        }


    return {
        "message": "No matching zone found"
    }