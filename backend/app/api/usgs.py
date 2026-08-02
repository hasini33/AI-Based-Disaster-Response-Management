from fastapi import APIRouter
from app.db.database import SessionLocal
from app.models.earthquake import Earthquake
from app.services.normalization_service import normalize_usgs
from geoalchemy2.elements import WKTElement
import httpx

router = APIRouter()

USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"

@router.get("/usgs")
async def get_usgs_data():

    async with httpx.AsyncClient() as client:
        response = await client.get(USGS_URL)

    data = response.json()
    db = SessionLocal()
    #earthquakes = []

    for item in data["features"]:


        normalized = normalize_usgs(item)

        quake = Earthquake(
        magnitude=normalized["magnitude"],
        latitude=normalized["latitude"],
        longitude=normalized["longitude"],
        place=normalized["place"],
        time=normalized["time"],
        location=WKTElement(
            f"POINT({normalized['longitude']} {normalized['latitude']})",
            srid=4326
        )
    )
        db.add(quake)

    db.commit() 
    db.close()
    return {
        "message": "Earthquake data stored successfully"
        }