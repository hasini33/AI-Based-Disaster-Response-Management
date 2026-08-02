from fastapi import APIRouter, HTTPException
from app.db.database import SessionLocal
from app.models.earthquake import Earthquake
from app.services.sentinel_service import get_satellite_image
router = APIRouter()


@router.get("/satellite/{earthquake_id}")
async def fetch_satellite_image(earthquake_id: int):

    db = SessionLocal()

    earthquake = (
        db.query(Earthquake)
        .filter(Earthquake.id == earthquake_id)
        .first()
    )

    db.close()

    if earthquake is None:
        raise HTTPException(status_code=404, detail="Earthquake not found")

    image = get_satellite_image(
    earthquake.latitude,
    earthquake.longitude
)

    return {
        "earthquake_id": earthquake.id,
        "place": earthquake.place,
        "latitude": earthquake.latitude,
        "longitude": earthquake.longitude,
        "message": "Satellite image fetched successfully"
    }