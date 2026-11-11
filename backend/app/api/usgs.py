
import httpx

from fastapi import APIRouter, HTTPException
from geoalchemy2.elements import WKTElement

from app.db.database import SessionLocal
from app.models.earthquake import Earthquake
from app.services.normalization_service import normalize_usgs


router = APIRouter()

USGS_URL = (
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
)


@router.get("/usgs")
async def get_usgs_data():

    # 1. Fetch earthquake data from USGS
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(USGS_URL)
            response.raise_for_status()
            data = response.json()

        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Unable to fetch USGS earthquake data: {exc}"
            )

    features = data.get("features", [])

    db = SessionLocal()

    inserted = 0
    updated = 0
    skipped = 0
    errors = 0

    try:

        # 2. Process each earthquake
        for item in features:

            try:
                normalized = normalize_usgs(item)

                source_event_id = normalized.get("source_event_id")

                # A unique USGS ID is required
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

                # 3. Find existing earthquake using USGS ID
                existing = (
                    db.query(Earthquake)
                    .filter(
                        Earthquake.source_event_id == source_event_id
                    )
                    .first()
                )

                # 4. Prepare earthquake information
                earthquake_values = {
                    "source_event_id": source_event_id,
                    "magnitude": normalized.get("magnitude"),
                    "place": normalized.get("place"),
                    "time": normalized.get("time"),
                    "latitude": latitude if valid_coordinates else None,
                    "longitude": longitude if valid_coordinates else None,
                    "location": (
                        WKTElement(
                            f"POINT({longitude} {latitude})",
                            srid=4326
                        )
                        if valid_coordinates
                        else None
                    )
                }

                # 5. Insert new record or update existing record
                if existing:
                    for key, value in earthquake_values.items():
                        setattr(existing, key, value)

                    updated += 1

                else:
                    new_earthquake = Earthquake(**earthquake_values)
                    db.add(new_earthquake)
                    inserted += 1

                db.commit()

            except Exception as exc:
                db.rollback()
                errors += 1
                print(
                    f"USGS earthquake processing failed: {exc}"
                )

        return {
            "message": "USGS synchronization completed",
            "records_found": len(features),
            "records_inserted": inserted,
            "records_updated": updated,
            "duplicates_prevented": updated,
            "records_skipped": skipped,
            "processing_errors": errors
        }

    finally:
        db.close()
