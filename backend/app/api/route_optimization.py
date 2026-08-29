from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db

from app.services.route_optimization_service import (
    optimize_vehicle_routes
)


router = APIRouter(
    prefix="/route-optimization",
    tags=["Route Optimization"]
)


@router.get("/optimize")
def optimize_routes(
    db: Session = Depends(get_db)
):

    result = optimize_vehicle_routes(
        db
    )

    if result.get("status") == "failed":

        raise HTTPException(
            status_code=400,
            detail=result.get(
                "message",
                "Route optimization failed"
            )
        )

    return result