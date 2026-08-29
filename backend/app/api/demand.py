from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.scenario_service import simulate_scenario
from app.db.database import get_db
from app.models.zone import Zone

from app.services.demand_prediction_service import (
    predict_zone_demand
)

from app.services.dynamic_demand_service import (
    update_dynamic_demand
)


router = APIRouter(
    prefix="/demand",
    tags=["Demand"]
)


@router.get("/{zone_id}")
def zone_demand(
    zone_id: int,
    db: Session = Depends(get_db)
):
    result = predict_zone_demand(
        db,
        zone_id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Zone not found"
        )

    return result


@router.post("/{zone_id}/update")
def update_demand(
    zone_id: int,
    damage_percent: float,
    db: Session = Depends(get_db)
):
    try:
        result = update_dynamic_demand(
            db,
            zone_id,
            damage_percent
        )

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Zone not found"
            )

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.post("/update-all")
def update_all_demands(
    damage_percent: float,
    db: Session = Depends(get_db)
):
    if damage_percent < 0 or damage_percent > 100:
        raise HTTPException(
            status_code=400,
            detail="damage_percent must be between 0 and 100"
        )

    zones = db.query(Zone).all()

    if not zones:
        return {
            "message": "No zones found",
            "updated": 0
        }

    results = []

    for zone in zones:
        result = update_dynamic_demand(
            db,
            zone.id,
            damage_percent
        )

        if result:
            results.append(result)

    return {
        "message": "Demand updated for all zones",
        "damage_percent": damage_percent,
        "updated": len(results),
        "zones": results
    }


@router.post("/{zone_id}/simulate")
def scenario_demand(
    zone_id: int,
    damage_percent: float,
    response_delay_days: int = 0,
    resource_availability: float = 100,
    db: Session = Depends(get_db)
):
    try:
        result = simulate_scenario(
            db,
            zone_id,
            damage_percent,
            response_delay_days,
            resource_availability
        )

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Zone not found"
            )

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )