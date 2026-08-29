from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.zone import Zone

from app.db.database import get_db
from app.schemas.zone import ZoneCreate, ZoneUpdate

from app.services.zone_service import (
    create_zone,
    get_all_zones,
    get_zone_by_id,
    update_zone,
    delete_zone,
)

router = APIRouter(
    prefix="/zones",
    tags=["Zones"]
)

@router.put("/{zone_id}/priority")
def override_zone_priority(
    zone_id: int,
    priority: float,
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

    if priority < 1 or priority > 5:
        raise HTTPException(
            status_code=400,
            detail="Priority must be between 1 and 5"
        )

    zone.priority_override = priority

    db.commit()
    db.refresh(zone)

    return {
        "message": "Priority override updated",
        "zone_id": zone.id,
        "zone_name": zone.zone_name,
        "severity_score": zone.severity_score,
        "priority_override": zone.priority_override
    }


@router.post("/")
def create_new_zone(
    zone: ZoneCreate,
    db: Session = Depends(get_db)
):
    return create_zone(db, zone)


@router.get("/")
def read_all_zones(
    db: Session = Depends(get_db)
):
    return get_all_zones(db)


@router.get("/{zone_id}")
def read_zone(
    zone_id: int,
    db: Session = Depends(get_db)
):
    zone = get_zone_by_id(db, zone_id)

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Zone not found"
        )

    return zone


@router.put("/{zone_id}")
def update_existing_zone(
    zone_id: int,
    zone: ZoneUpdate,
    db: Session = Depends(get_db)
):
    updated_zone = update_zone(
        db,
        zone_id,
        zone
    )

    if not updated_zone:
        raise HTTPException(
            status_code=404,
            detail="Zone not found"
        )

    return updated_zone


@router.delete("/{zone_id}")
def delete_existing_zone(
    zone_id: int,
    db: Session = Depends(get_db)
):
    zone = delete_zone(
        db,
        zone_id
    )

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Zone not found"
        )

    return {
        "message": "Zone deleted successfully"
    }