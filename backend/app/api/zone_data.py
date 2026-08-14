from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.zone import Zone

from app.services.zone_service import (
    update_zone_population
)

from app.services.building_service import (
    update_building_count
)


router = APIRouter(
    prefix="/zone-data",
    tags=["Zone Data"]
)


@router.post("/{zone_id}/population")
def update_population(
    zone_id: int,
    db: Session = Depends(get_db)
):

    return update_zone_population(
        db,
        zone_id
    )


@router.post("/population/update-all")
def update_all_populations(
    db: Session = Depends(get_db)
):

    zones = db.query(Zone).all()

    results = []

    for zone in zones:

        result = update_zone_population(
            db,
            zone.id
        )

        if result:
            results.append(result)

    return {
        "message": "Population updated for all zones",
        "updated": len(results),
        "zones": results
    }


@router.post("/buildings/update-all")
def update_all_buildings(
    db: Session = Depends(get_db)
):

    zones = db.query(Zone).all()

    results = []

    for zone in zones:

        updated_zone = update_building_count(
            db,
            zone
        )

        results.append({
            "zone_id": updated_zone.id,
            "zone_name": updated_zone.zone_name,
            "building_count":
                updated_zone.building_count
        })

    return {
        "message": "Building counts updated for all zones",
        "updated": len(results),
        "zones": results
    }