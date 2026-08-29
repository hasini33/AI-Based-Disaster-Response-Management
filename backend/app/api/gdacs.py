from app.services.normalization_service import normalize_gdacs
from app.db.database import SessionLocal
from app.models import Disaster
from fastapi import APIRouter,Depends
import httpx
from geoalchemy2.elements import WKTElement
from app.services.zone_mapping_service import assign_disaster_to_zone
from sqlalchemy.orm import Session
from app.db.database import get_db

router = APIRouter()  # creates an obj for the endpoints

GDACS_URL = "https://www.gdacs.org/xml/gdacs_archive.geojson"   #api url



@router.get("/disasters")
def get_disasters(db: Session = Depends(get_db)):

    disasters = db.query(Disaster).all()

    result = []

    for disaster in disasters:

        result.append({
            "id": disaster.id,
            "type": disaster.disaster_type,
            "country": disaster.country,
            "severity": disaster.severity,
            "alert_level": disaster.alert_level,
            "latitude": disaster.latitude,
            "longitude": disaster.longitude,
            "zone_id": disaster.zone_id
        })

    return result



@router.post("/{disaster_id}/assign-zone")    # post api will allow u to create the resource which will modify the server
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
        response = await client.get(GDACS_URL)
        response.raise_for_status()

    data = response.json()

    db = SessionLocal()

    try:
        features = data["features"]
        inserted = 0
        skipped = 0

        for disaster in features:
            normalized = normalize_gdacs(disaster)

            # Check whether this disaster already exists
            existing_disaster = db.query(Disaster).filter(
                Disaster.disaster_type == normalized["disaster_type"],
                Disaster.country == normalized["country"],
                Disaster.latitude == normalized["latitude"],
                Disaster.longitude == normalized["longitude"],
                Disaster.severity == normalized["severity"],
                Disaster.alert_level == normalized["alert_level"]
            ).first()

            # Skip duplicate
            if existing_disaster:
                skipped += 1
                continue

            new_disaster = Disaster(
                disaster_type=normalized["disaster_type"],
                country=normalized["country"],
                alert_level=normalized["alert_level"],
                severity=normalized["severity"],
                latitude=normalized["latitude"],
                longitude=normalized["longitude"],
                location=WKTElement(
                    f"POINT({normalized['longitude']} {normalized['latitude']})",
                    srid=4326
                )
            )

            db.add(new_disaster)
            db.commit()
            db.refresh(new_disaster)

            # Assign the newly inserted disaster to a zone
            assign_disaster_to_zone(
                db,
                new_disaster.id
            )

            inserted += 1

        return {
            "message": "GDACS synchronization completed",
            "records_found": len(features),
            "records_inserted": inserted,
            "duplicates_skipped": skipped
        }

    finally:
        db.close()