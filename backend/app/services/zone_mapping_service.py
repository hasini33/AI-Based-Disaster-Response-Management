from sqlalchemy.orm import Session
from geoalchemy2 import functions
from app.services.zone_severity_service import update_zone_severity
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
        print(disaster)
        return None


    # Find matching zone
    if disaster.location is None:
        return {
        "message": "Disaster location not available"
    }
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
        
        zone.disaster_id = disaster.id

        db.commit()
        db.refresh(disaster)

        update_zone_severity(
            db,
            disaster,
            zone
        )

        return {
    "disaster_id": disaster.id,
    "zone_id": zone.id,
    "zone_name": zone.zone_name,
    "severity_score": zone.severity_score,
    "disaster_count": zone.disaster_count
}


    return {
        "message": "No matching zone found"
    }