from app.db.database import SessionLocal
from app.models.zone import Zone
from app.services.zone_severity_service import update_zone_severity


db = SessionLocal()

try:

    zones = db.query(Zone).all()

    for zone in zones:

        update_zone_severity(
            db,
            None,
            zone
        )

        print(
            f"{zone.zone_name}: "
            f"disasters={zone.disaster_count}, "
            f"severity={zone.severity_score}"
        )

finally:

    db.close()