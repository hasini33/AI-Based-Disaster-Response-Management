from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from geoalchemy2.shape import to_shape

from app.db.database import get_db
from app.models.disaster import Disaster
from app.models.severity import Severity
from app.models.zone import Zone
from app.services.population_service import get_population_in_zone
from app.services.severity_service import calculate_severity


router = APIRouter(
    prefix="/severity",
    tags=["Severity"]
)


@router.get("/")
def get_all_severity(
    db: Session = Depends(get_db)
):
    return db.query(Severity).all()


@router.post("/disaster/{disaster_id}")
def calculate_disaster_severity(
    disaster_id: int,
    db: Session = Depends(get_db)
):

    # 1. Get disaster
    disaster = db.query(Disaster).filter(
        Disaster.id == disaster_id
    ).first()

    if not disaster:
        raise HTTPException(
            status_code=404,
            detail="Disaster not found"
        )

    # 2. Only India disasters
    if not disaster.country or disaster.country.lower() != "india":
        raise HTTPException(
            status_code=400,
            detail="Severity calculation is currently available only for India disasters"
        )

    # 3. Check location
    if disaster.location is None:
        raise HTTPException(
            status_code=400,
            detail="Disaster has no location"
        )

    # 4. Get latitude and longitude
    point = db.execute(
        text("""
            SELECT
                ST_Y(location) AS latitude,
                ST_X(location) AS longitude
            FROM disasters
            WHERE id = :disaster_id
        """),
        {
            "disaster_id": disaster_id
        }
    ).first()

    if not point:
        raise HTTPException(
            status_code=400,
            detail="Could not read disaster coordinates"
        )

    latitude = point.latitude
    longitude = point.longitude

    # 5. Find operational zone containing disaster
    zone = db.query(Zone).filter(
        text("""
            ST_Contains(
                zones.geometry,
                ST_SetSRID(
                    ST_Point(:longitude, :latitude),
                    4326
                )
            )
        """)
    ).params(
        longitude=longitude,
        latitude=latitude
    ).first()

    if not zone:
        raise HTTPException(
            status_code=400,
            detail="Disaster location is not inside any operational zone"
        )

    # 6. Convert PostGIS geometry to Shapely
    zone_geometry = to_shape(zone.geometry)

    # 7. Calculate population inside zone
    population = get_population_in_zone(
        zone_geometry,
        "data/ind_ppp_2020.tif"
    )

    # 8. Count buildings inside zone
    building_count = db.execute(
        text("""
            SELECT COUNT(*)
            FROM buildings
            WHERE ST_Intersects(
                geometry,
                (
                    SELECT geometry
                    FROM zones
                    WHERE id = :zone_id
                )
            )
        """),
        {
            "zone_id": zone.id
        }
    ).scalar()

    buildings = building_count or 0

    # 9. Get disaster severity
    magnitude = disaster.severity or 0

    # 10. Calculate severity
    score, level = calculate_severity(
        magnitude,
        population,
        buildings
    )

    # 11. Save result
    severity = Severity(
        zone_name=zone.zone_name,
        latitude=latitude,
        longitude=longitude,
        population=population,
        buildings=buildings,
        magnitude=magnitude,
        severity_score=score,
        severity_level=level
    )

    db.add(severity)
    db.commit()
    db.refresh(severity)

    # 12. Return clean JSON
    return {
        "id": severity.id,
        "disaster_id": disaster.id,
        "latitude": latitude,
        "longitude": longitude,
        "zone_id": zone.id,
        "zone_name": zone.zone_name,
        "population": population,
        "buildings": buildings,
        "magnitude": magnitude,
        "severity_score": round(score, 2),
        "severity_level": level
    }