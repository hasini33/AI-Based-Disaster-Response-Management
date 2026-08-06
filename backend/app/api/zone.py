from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.resource_allocation_service import allocate_resources
from app.models.zone import Zone
from app.db.database import get_db
from app.schemas.zone import ZoneCreate, ZoneUpdate, ZoneResponse
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


@router.post("/")
def create_new_zone(zone: ZoneCreate, db: Session = Depends(get_db)):
    return create_zone(db, zone)


@router.get("/")
def read_all_zones(db: Session = Depends(get_db)):
    return get_all_zones(db)


@router.get("/{zone_id}")
def read_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = get_zone_by_id(db, zone_id)

    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    return zone


@router.put("/{zone_id}")
def update_existing_zone(
    zone_id: int,
    zone: ZoneUpdate,
    db: Session = Depends(get_db)
):
    updated_zone = update_zone(db, zone_id, zone)

    if not updated_zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    return updated_zone


@router.delete("/{zone_id}")
def delete_existing_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = delete_zone(db, zone_id)

    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    return {"message": "Zone deleted successfully"}

@router.get("/{zone_id}/summary")
def zone_summary(
    zone_id: int,
    db: Session = Depends(get_db)
):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()

    if not zone:
        return {"message": "Zone not found"}

    return {
        "zone_name": zone.zone_name,
        "severity_score": zone.severity_score,
        "disaster_count": zone.disaster_count,
        "estimated_population": zone.estimated_population,
        "building_count": zone.building_count
    }


@router.get("/{zone_id}/resources")
def get_resources(
    zone_id: int,
    db: Session = Depends(get_db)
):
    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id)
        .first()
    )

    if not zone:
        return {
            "message": "Zone not found"
        }

    resources = allocate_resources(zone)

    return {
        "zone_name": zone.zone_name,
        "severity_score": zone.severity_score,
        "resources": resources
    }