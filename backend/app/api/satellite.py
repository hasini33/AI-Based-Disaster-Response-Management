from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.disaster import Disaster
from app.services.satellite_service import get_satellite_imagery


router = APIRouter(
    prefix="/satellite",
    tags=["Satellite"]
)


@router.get("/{disaster_id}")
def satellite(
    disaster_id: int,
    db: Session = Depends(get_db)
):

    disaster = (
        db.query(Disaster)
        .filter(Disaster.id == disaster_id)
        .first()
    )

    if not disaster:
        raise HTTPException(
            status_code=404,
            detail="Disaster not found"
        )

    satellite_data = get_satellite_imagery(
        float(disaster.latitude),
        float(disaster.longitude)
    )

    return {
        "disaster_id": disaster.id,
        "latitude": disaster.latitude,
        "longitude": disaster.longitude,
        "satellite": satellite_data
    }