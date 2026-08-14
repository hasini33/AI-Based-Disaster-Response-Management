from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db

from app.services.scenario_service import (
    simulate_scenario
)


router = APIRouter(
    prefix="/scenario",
    tags=["Scenario"]
)


@router.post("/{zone_id}/simulate")
def simulate_zone_scenario(
    zone_id: int,
    damage_percent: float,
    db: Session = Depends(get_db)
):

    try:

        result = simulate_scenario(
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