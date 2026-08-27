from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.schemas.resource import (
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse,
)

from app.services.resource_service import (
    create_resource,
    get_all_resources,
    get_resource_by_id,
    update_resource,
    delete_resource,
    allocate_resource,
)


router = APIRouter(
    prefix="/resources",
    tags=["Resources"],
)


# ======================================================
# CREATE
# ======================================================

@router.post(
    "/",
    response_model=ResourceResponse,
)
def create_new_resource(
    resource: ResourceCreate,
    db: Session = Depends(get_db),
):
    return create_resource(
        db,
        resource,
    )


# ======================================================
# GET ALL
# ======================================================

@router.get(
    "/",
    response_model=list[ResourceResponse],
)
def read_resources(
    db: Session = Depends(get_db),
):
    return get_all_resources(db)


# ======================================================
# GET BY ID
# ======================================================

@router.get(
    "/{resource_id}",
    response_model=ResourceResponse,
)
def read_resource(
    resource_id: int,
    db: Session = Depends(get_db),
):
    resource = get_resource_by_id(
        db,
        resource_id,
    )

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found",
        )

    return resource


# ======================================================
# UPDATE
# ======================================================

@router.put(
    "/{resource_id}",
    response_model=ResourceResponse,
)
def update_existing_resource(
    resource_id: int,
    resource: ResourceUpdate,
    db: Session = Depends(get_db),
):
    updated_resource = update_resource(
        db,
        resource_id,
        resource,
    )

    if not updated_resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found",
        )

    return updated_resource


# ======================================================
# DELETE
# ======================================================

@router.delete(
    "/{resource_id}",
)
def delete_existing_resource(
    resource_id: int,
    db: Session = Depends(get_db),
):
    deleted_resource = delete_resource(
        db,
        resource_id,
    )

    if not deleted_resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found",
        )

    return {
        "message": "Resource deleted successfully",
        "resource_id": resource_id,
    }


# ======================================================
# ALLOCATE
# ======================================================

@router.post(
    "/allocate",
    response_model=ResourceResponse,
)
def allocate(
    resource_type: str = Query(...),
    quantity: int = Query(..., gt=0),
    db: Session = Depends(get_db),
):
    result = allocate_resource(
        db,
        resource_type,
        quantity,
    )

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result["error"],
        )

    return result