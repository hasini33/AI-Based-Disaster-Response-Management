from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException

from app.db.database import get_db
from app.models.disaster import Disaster

from app.services.zone_mapping_service import (
    assign_disaster_to_zone
)


router = APIRouter(
    prefix="/india",
    tags=["India"]
)


# ============================================================
# GET ALL INDIA DISASTERS
# ============================================================

@router.get("/india")
def get_india_disasters(
    db: Session = Depends(get_db)
):
    disasters = (
        db.query(Disaster)
        .filter(
            Disaster.country.ilike("India")
        )
        .all()
    )

    return [
        {
            "id": d.id,
            "type": d.disaster_type,
            "country": d.country,
            "severity": d.severity,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "zone_id": d.zone_id
        }
        for d in disasters
    ]


# ============================================================
# ASSIGN DISASTER TO OPERATIONAL ZONE
# ============================================================

@router.post(
    "/disasters/{disaster_id}/assign-zone"
)
def assign_zone(
    disaster_id: int,
    db: Session = Depends(get_db)
):

    result = assign_disaster_to_zone(
        db,
        disaster_id
    )

    # Disaster does not exist
    if result.get("message") == "Disaster not found":
        raise HTTPException(
            status_code=404,
            detail="Disaster not found"
        )

    return result