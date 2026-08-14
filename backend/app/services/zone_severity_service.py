from sqlalchemy.orm import Session

from app.models.zone import Zone
from app.models.disaster import Disaster


def update_zone_severity(
    db: Session,
    disaster: Disaster,
    zone: Zone
):
    # --------------------------------------------------
    # 1. Disaster severity: 0-100
    # --------------------------------------------------

    disaster_score = min(
        max(float(disaster.severity or 0), 0),
        100
    )

    # --------------------------------------------------
    # 2. Get maximum population and buildings
    #    among all zones
    # --------------------------------------------------

    max_population = (
        db.query(Zone.estimated_population)
        .order_by(Zone.estimated_population.desc())
        .first()
    )

    max_buildings = (
        db.query(Zone.building_count)
        .order_by(Zone.building_count.desc())
        .first()
    )

    max_population = (
        float(max_population[0])
        if max_population and max_population[0]
        else 1
    )

    max_buildings = (
        float(max_buildings[0])
        if max_buildings and max_buildings[0]
        else 1
    )

    # --------------------------------------------------
    # 3. Normalize population relative to all zones
    # --------------------------------------------------

    population_score = (
        float(zone.estimated_population or 0)
        / max_population
    ) * 100

    population_score = min(
        max(population_score, 0),
        100
    )

    # --------------------------------------------------
    # 4. Normalize buildings relative to all zones
    # --------------------------------------------------

    building_score = (
        float(zone.building_count or 0)
        / max_buildings
    ) * 100

    building_score = min(
        max(building_score, 0),
        100
    )

    # --------------------------------------------------
    # 5. Weighted severity
    # --------------------------------------------------

    severity_score = (
        0.4 * disaster_score
        + 0.3 * population_score
        + 0.3 * building_score
    )

    severity_score = min(
        max(severity_score, 0),
        100
    )

    zone.severity_score = round(
        severity_score,
        2
    )

    # --------------------------------------------------
    # 6. Calculate actual disaster count
    # --------------------------------------------------

    zone.disaster_count = (
        db.query(Disaster)
        .filter(
            Disaster.zone_id == zone.id
        )
        .count()
    )

    db.commit()
    db.refresh(zone)

    return zone