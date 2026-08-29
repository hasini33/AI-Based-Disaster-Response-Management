from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.services.vehicle_service import (
    create_sample_vehicles
)


router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)


@router.post("/create-sample")
def create_vehicles(
    db: Session = Depends(get_db)
):

    return create_sample_vehicles(db)