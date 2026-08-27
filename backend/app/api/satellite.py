from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.disaster import Disaster

from app.services.satellite_service import (
    assess_satellite_damage
)


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
        .filter(
            Disaster.id == disaster_id
        )
        .first()
    )

    if not disaster:
        raise HTTPException(
            status_code=404,
            detail="Disaster not found"
        )

    if (
        disaster.latitude is None
        or disaster.longitude is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Disaster coordinates are not available"
        )

    result = assess_satellite_damage(
        latitude=float(
            disaster.latitude
        ),
        longitude=float(
            disaster.longitude
        ),
        disaster_type=disaster.disaster_type,
        severity=float(
            disaster.severity or 0
        ),
        disaster_date=disaster.event_date
    )

    return {
        "disaster_id": disaster.id,
        "disaster_type": disaster.disaster_type,
        "latitude": disaster.latitude,
        "longitude": disaster.longitude,
        "severity": disaster.severity,
        **result
    }