from fastapi import APIRouter, HTTPException
from app.db.database import SessionLocal
from app.models.building import Building

router = APIRouter()


@router.get("/buildings")
def get_buildings(limit: int = 10):

    db = SessionLocal()

    buildings = db.query(Building).limit(limit).all()

    db.close()

    return [
        {
            "id": b.id,
            "osm_id": b.osm_id,
            "building_type": b.building_type,
            "amenity": b.amenity,
            "name": b.name
        }
        for b in buildings
    ]


@router.get("/buildings/{building_id}")
def get_building(building_id: int):

    db = SessionLocal()

    building = (
        db.query(Building)
        .filter(Building.id == building_id)
        .first()
    )

    db.close()

    if building is None:
        raise HTTPException(status_code=404, detail="Building not found")

    return {
        "id": building.id,
        "osm_id": building.osm_id,
        "building_type": building.building_type,
        "amenity": building.amenity,
        "name": building.name
    }