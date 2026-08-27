from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.services.routing_service import (
    find_nearest_depot
)

from app.services.depot_service import (
    create_depots_from_resources
)



from app.services.road_service import create_sample_roads

from app.services.routing_service import (
    optimize_route
)


router = APIRouter(
    prefix="/routing",
    tags=["Routing"]
)



@router.post("/optimize/{zone_id}")
def optimize_zone_route(
    zone_id: int,
    resource_type: str = "all",
    db: Session = Depends(get_db)
):

    result = optimize_route(
        db,
        zone_id,
        resource_type
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Zone not found"
        )

    return result



@router.get("/roads")
def get_available_roads(
    db: Session = Depends(get_db)
):

    from app.services.routing_service import (
        get_road_status
    )

    return {
        "roads": get_road_status(db)
    }




@router.post("/create-from-resources")
def create_depots(
    db: Session = Depends(get_db)
):

    created = create_depots_from_resources(
        db
    )

    return {
        "message": "Depots created",
        "count": len(created),
        "depots": [
            {
                "id": depot.id,
                "name": depot.depot_name,
                "latitude": depot.latitude,
                "longitude": depot.longitude
            }
            for depot in created
        ]
    }


@router.post("/create-sample-roads")
def create_roads(
    db: Session = Depends(get_db)
):

    return create_sample_roads(db)



@router.get("/{zone_id}")
def get_nearest_depot(
    zone_id: int,
    db: Session = Depends(get_db)
):

    result = find_nearest_depot(
        db,
        zone_id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Zone not found"
        )

    return result

