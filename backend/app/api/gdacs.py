from app.services.normalization_service import normalize_gdacs
from app.db.database import SessionLocal
from app.models import Disaster
from fastapi import APIRouter,Depends
import httpx
from app.services.zone_mapping_service import assign_disaster_to_zone
from sqlalchemy.orm import Session
from app.db.database import get_db

router = APIRouter()  # creates an obj for the endpoints

GDACS_URL = "https://www.gdacs.org/xml/gdacs_archive.geojson"   #api url

@router.post("/{disaster_id}/assign-zone")
def assign_zone(
    disaster_id: int,
    db: Session = Depends(get_db)
):

    result = assign_disaster_to_zone(
        db,
        disaster_id
    )

    return result

@router.get("/gdacs")
async def get_gdacs_data():
    async with httpx.AsyncClient() as client:
        response = await client.get(GDACS_URL)      #await means:Wait here until GDACS sends the data.

    data = response.json()
    db = SessionLocal()

    # Get all disasters
    features = data["features"]
    for disaster in features:
        normalized = normalize_gdacs(disaster)

        new_disaster = Disaster(
            disaster_type=normalized["disaster_type"],
            country=normalized["country"],
            alert_level=normalized["alert_level"],
            severity=normalized["severity"],
            latitude=normalized["latitude"],
            longitude=normalized["longitude"]
        )

        db.add(new_disaster)
        db.commit()
        db.refresh(new_disaster)

        assign_zone_to_disaster(db, new_disaster)
    db.close()
    return {
    "message": "Data inserted successfully!",
    "records_inserted": len(features)
}