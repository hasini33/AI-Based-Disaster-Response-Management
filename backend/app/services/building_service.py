from sqlalchemy.orm import Session
from geoalchemy2 import functions

from app.models.zone import Zone
from app.models.building import Building


def update_building_count(
    db: Session,
    zone: Zone
):
    building_count = (
        db.query(Building)
        .filter(
            functions.ST_Contains(
                zone.geometry,
                Building.geometry
            )
        )
        .count()
    )

    zone.building_count = building_count

    db.commit()
    db.refresh(zone)

    return zone