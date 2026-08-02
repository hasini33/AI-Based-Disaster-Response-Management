from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.earthquake import Earthquake
from app.models.severity import Severity
from app.services.population_service import get_population_at_location
from app.services.severity_service import calculate_severity

router = APIRouter(
    prefix="/severity",
    tags=["Severity"]
)


@router.get("/")
def get_all_severity(db: Session = Depends(get_db)):
    zones = db.query(Severity).all()
    return zones


@router.post("/sample")
def create_sample_severity(db: Session = Depends(get_db)):

    latest_earthquake = (
        db.query(Earthquake)
        .order_by(Earthquake.time.desc())
        .first()
    )

    if not latest_earthquake:
        return {"message": "No earthquake data found"}

    magnitude = latest_earthquake.magnitude
    print("Latitude :", latest_earthquake.latitude)
    print("Longitude:", latest_earthquake.longitude)
    print("Place    :", latest_earthquake.place)

    population = (
        get_population_at_location(
            latest_earthquake.latitude,
            latest_earthquake.longitude,
            "data/ind_ppp_2020.tif"
        )
    )

    # Temporary until we calculate real building counts
    buildings = 80

    score, level = calculate_severity(
        magnitude,
        population,
        buildings
    )

    zone = Severity(
        zone_name=latest_earthquake.place,
        latitude=latest_earthquake.latitude,
        longitude=latest_earthquake.longitude,
        population=population,
        buildings=buildings,
        magnitude=magnitude,
        severity_score=score,
        severity_level=level
    )

    db.add(zone)
    db.commit()
    db.refresh(zone)

    return zone