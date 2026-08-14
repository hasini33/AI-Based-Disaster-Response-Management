from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.zone import Zone

from app.services.vulnerability_service import (
    get_zone_demographics
)


router = APIRouter(
    prefix="/demographics",
    tags=["Demographics"]
)


@router.get("/{zone_id}")
def zone_demographics(
    zone_id: int,
    db: Session = Depends(get_db)
):

    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id)
        .first()
    )

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Zone not found"
        )

    result = get_zone_demographics(
        zone.geometry
    )

    return {
        "zone_id": zone.id,
        "zone_name": zone.zone_name,
        "demographics": result
    }