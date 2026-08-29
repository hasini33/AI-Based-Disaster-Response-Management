from sqlalchemy.orm import Session
from geoalchemy2 import functions
from geoalchemy2.elements import WKTElement
from app.services.satellite_service import assess_satellite_damage
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
    # 3. CREATE POSTGIS POINT
    # --------------------------------------------------

    disaster.location = WKTElement(
        f"POINT({disaster.longitude} {disaster.latitude})",
        srid=4326
    )

    # --------------------------------------------------
    # 4. SATELLITE DAMAGE ASSESSMENT
    # --------------------------------------------------

    try:

        satellite_result = assess_satellite_damage(
            latitude=disaster.latitude,
            longitude=disaster.longitude,
            disaster_type=disaster.disaster_type,
            severity=disaster.severity or 0,
            disaster_date=disaster.event_date
        )

        damage_assessment = satellite_result.get(
            "damage_assessment",
            {}
        )

        satellite_damage = damage_assessment.get(
            "damage_percentage"
        )

        # Save satellite-derived damage percentage
        if satellite_damage is not None:
            disaster.satellite_damage_percent = float(
                satellite_damage
            )

        db.flush()

    except Exception as exc:

        # Satellite failure should NOT stop
        # disaster-zone assignment.

        disaster.satellite_damage_percent = None

        print(
            f"Satellite assessment failed "
            f"for disaster {disaster.id}: {exc}"
        )

    # --------------------------------------------------
    # 5. FIND EXISTING OPERATIONAL ZONE
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
    # 6. DISASTER OUTSIDE OPERATIONAL ZONES
    # --------------------------------------------------

    if not zone:

        db.commit()

        return {
            "message": "Disaster is outside the operational zones",
            "disaster_id": disaster.id,
            "latitude": disaster.latitude,
            "longitude": disaster.longitude,
            "zone_id": None,
            "satellite_damage_percent":
                disaster.satellite_damage_percent
        }

    # --------------------------------------------------
    # 7. ASSIGN DISASTER TO ZONE
    # --------------------------------------------------

    disaster.zone_id = zone.id

    db.commit()
    db.refresh(disaster)

    # --------------------------------------------------
    # 8. UPDATE ZONE SEVERITY
    # --------------------------------------------------

    update_zone_severity(
        db,
        disaster,
        zone
    )

    # --------------------------------------------------
    # 9. RETURN RESULT
    # --------------------------------------------------

    return {
        "disaster_id": disaster.id,
        "zone_id": zone.id,
        "zone_name": zone.zone_name,
        "severity_score": zone.severity_score,
        "disaster_count": zone.disaster_count,
        "satellite_damage_percent":
            disaster.satellite_damage_percent
    }