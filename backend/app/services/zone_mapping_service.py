from sqlalchemy.orm import Session
from geoalchemy2 import functions
from geoalchemy2.elements import WKTElement

from app.services.zone_severity_service import update_zone_severity
from app.models.disaster import Disaster
from app.models.zone import Zone


def assign_disaster_to_zone(
    db: Session,
    disaster_id: int
):
    # --------------------------------------------------
    # 1. Get disaster
    # --------------------------------------------------

    disaster = (
        db.query(Disaster)
        .filter(Disaster.id == disaster_id)
        .first()
    )

    if not disaster:
        return {
            "message": "Disaster not found"
        }

    # --------------------------------------------------
    # 2. Check coordinates
    # --------------------------------------------------

    if (
        disaster.latitude is None
        or disaster.longitude is None
    ):
        return {
            "message": "Disaster latitude/longitude not available",
            "disaster_id": disaster.id
        }

    # --------------------------------------------------
    # 3. Create PostGIS point
    # --------------------------------------------------

    disaster.location = WKTElement(
        f"POINT({disaster.longitude} {disaster.latitude})",
        srid=4326
    )

    # --------------------------------------------------
    # 4. Find existing operational zone
    # --------------------------------------------------

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

    # --------------------------------------------------
    # 5. If outside all operational zones
    #    DO NOT CREATE A NEW ZONE
    # --------------------------------------------------

    if not zone:

        db.commit()

        return {
            "message": "Disaster is outside the operational zones",
            "disaster_id": disaster.id,
            "latitude": disaster.latitude,
            "longitude": disaster.longitude,
            "zone_id": None
        }

    # --------------------------------------------------
    # 6. Assign disaster to existing zone
    # --------------------------------------------------

    disaster.zone_id = zone.id

    db.commit()
    db.refresh(disaster)

    # --------------------------------------------------
    # 7. Update zone severity
    # --------------------------------------------------

    update_zone_severity(
        db,
        disaster,
        zone
    )

    # --------------------------------------------------
    # 8. Return result
    # --------------------------------------------------

    return {
        "disaster_id": disaster.id,
        "zone_id": zone.id,
        "zone_name": zone.zone_name,
        "severity_score": zone.severity_score,
        "disaster_count": zone.disaster_count
    }