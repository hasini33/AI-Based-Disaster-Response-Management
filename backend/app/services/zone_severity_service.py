from sqlalchemy.orm import Session

from app.models.zone import Zone
from app.models.disaster import Disaster


def update_zone_severity(
    db: Session,
    disaster: Disaster,
    zone: Zone
):
    building_score = zone.building_count

    population_score = zone.estimated_population / 1000

    zone.severity_score = (
        disaster.severity * 0.4
        + building_score * 0.3
        + population_score * 0.3
    )

    zone.disaster_count = (zone.disaster_count or 0) + 1

    db.commit()
    db.refresh(zone)

    return zone