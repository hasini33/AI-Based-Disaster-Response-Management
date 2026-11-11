
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.elements import WKTElement
from sqlalchemy.orm import Session

from app.db.database import SessionLocal, get_db
from app.models.disaster import Disaster
from app.services.normalization_service import normalize_gdacs
from app.services.zone_mapping_service import assign_disaster_to_zone


router = APIRouter()

GDACS_URL = "https://www.gdacs.org/xml/gdacs_archive.geojson"


def parse_event_date(value):
    """Convert a GDACS date string into a Python datetime."""
    if not value:
        return None

    try:
        return datetime.fromisoformat(
            str(value).replace("Z", "+00:00")
        ).replace(tzinfo=None)
    except (ValueError, TypeError):
        return None


@router.get("/disasters")
def get_disasters(db: Session = Depends(get_db)):
    disasters = db.query(Disaster).all()

    return [
        {
            "id": disaster.id,
            "type": disaster.disaster_type,
            "country": disaster.country,
            "severity": disaster.severity,
            "alert_level": disaster.alert_level,
            "latitude": disaster.latitude,
            "longitude": disaster.longitude,
            "zone_id": disaster.zone_id
        }
        for disaster in disasters
    ]


@router.post("/{disaster_id}/assign-zone")
def assign_zone(
    disaster_id: int,
    db: Session = Depends(get_db)
):
    return assign_disaster_to_zone(db, disaster_id)


@router.get("/gdacs")
async def get_gdacs_data():

    # 1. Fetch GDACS data
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(GDACS_URL)
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Unable to fetch GDACS data: {exc}"
            )

    features = data.get("features", [])

    db = SessionLocal()

    inserted = 0
    updated = 0
    skipped = 0
    errors = 0
    zone_assignment_errors = 0

    try:
        # 2. Process each GDACS event
        for feature in features:

            try:
                normalized = normalize_gdacs(feature)

                source_event_id = normalized.get("source_event_id")

                # A source ID is essential for duplicate prevention
                if not source_event_id:
                    skipped += 1
                    continue

                latitude = normalized.get("latitude")
                longitude = normalized.get("longitude")

                valid_coordinates = (
                    latitude is not None
                    and longitude is not None
                    and -90 <= latitude <= 90
                    and -180 <= longitude <= 180
                )

                # 3. Find the event using its unique source ID
                existing = (
                    db.query(Disaster)
                    .filter(
                        Disaster.source == "GDACS",
                        Disaster.source_event_id == source_event_id
                    )
                    .first()
                )

                # 4. Prepare event information
                event_values = {
                    "source": "GDACS",
                    "source_event_id": source_event_id,
                    "disaster_type": normalized.get("disaster_type"),
                    "country": normalized.get("country"),
                    "alert_level": normalized.get("alert_level"),
                    "severity": normalized.get("severity"),
                    "latitude": latitude if valid_coordinates else None,
                    "longitude": longitude if valid_coordinates else None,
                    "event_date": parse_event_date(
                        normalized.get("event_date")
                    ),
                    "location": (
                        WKTElement(
                            f"POINT({longitude} {latitude})",
                            srid=4326
                        )
                        if valid_coordinates
                        else None
                    )
                }

                # 5. Insert new event or update existing event
                if existing:
                    for key, value in event_values.items():
                        setattr(existing, key, value)

                    updated += 1

                else:
                    new_disaster = Disaster(**event_values)
                    db.add(new_disaster)
                    inserted += 1

                # Save the event before zone assignment
                db.commit()

                # 6. Assign the event to an operational zone
                saved_disaster = (
                    db.query(Disaster)
                    .filter(
                        Disaster.source == "GDACS",
                        Disaster.source_event_id == source_event_id
                    )
                    .first()
                )

                if saved_disaster and valid_coordinates:
                    try:
                        assign_disaster_to_zone(
                            db,
                            saved_disaster.id
                        )
                    except Exception as exc:
                        db.rollback()
                        zone_assignment_errors += 1
                        print(
                            f"Zone assignment failed for "
                            f"GDACS event {source_event_id}: {exc}"
                        )

            except Exception as exc:
                db.rollback()
                errors += 1
                print(f"GDACS event processing failed: {exc}")

        return {
            "message": "GDACS synchronization completed",
            "records_found": len(features),
            "records_inserted": inserted,
            "records_updated": updated,
            "duplicates_prevented": updated,
            "records_skipped": skipped,
            "processing_errors": errors,
            "zone_assignment_errors": zone_assignment_errors
        }

    finally:
        db.close()
