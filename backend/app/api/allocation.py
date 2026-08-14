from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.allocation import Allocation
from app.services.resource_allocation_service import (
    allocate_resources
)

from app.services.allocation_service import (
    create_allocation_requests,
    approve_allocation,
    reject_allocation,
    complete_allocation
)

router = APIRouter(
    prefix="/allocation",
    tags=["Allocation"]
)

@router.get("/history")
def allocation_history(
    db: Session = Depends(get_db)
):

    allocations = (
        db.query(Allocation)
        .order_by(Allocation.created_at.desc())
        .all()
    )

    return {
        "total": len(allocations),
        "allocations": allocations
    }


@router.get("/{zone_id}")
def get_allocation(
    zone_id: int,
    db: Session = Depends(get_db)
):

    result = allocate_resources(
        db,
        zone_id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Zone not found"
        )

    return result


@router.post("/{zone_id}/request")
def create_request(
    zone_id: int,
    db: Session = Depends(get_db)
):

    result = allocate_resources(
        db,
        zone_id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Zone not found"
        )

    created = create_allocation_requests(
        db,
        zone_id,
        result["allocation"]
    )

    return {
        "message": "Allocation request created",
        "status": "Pending",
        "allocations": created
    }


@router.put("/{allocation_id}/approve")
def approve_request(
    allocation_id: int,
    db: Session = Depends(get_db)
):

    result = approve_allocation(
        db,
        allocation_id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Allocation not found"
        )

    return {
        "message": "Allocation approved",
        "allocation": result
    }
@router.put("/{allocation_id}/reject")
def reject_request(
    allocation_id: int,
    db: Session = Depends(get_db)
):

    result = reject_allocation(
        db,
        allocation_id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Allocation not found"
        )

    return {
        "message": "Allocation rejected",
        "allocation": result
    }


@router.put("/{allocation_id}/complete")
def complete_request(
    allocation_id: int,
    db: Session = Depends(get_db)
):

    result = complete_allocation(
        db,
        allocation_id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Allocation not found"
        )

    return {
        "message": "Allocation completed",
        "allocation": result
    }

@router.get("/history")
def allocation_history(
    db: Session = Depends(get_db)
):

    allocations = (
        db.query(Allocation)
        .order_by(Allocation.created_at.desc())
        .all()
    )

    return {
        "total": len(allocations),
        "allocations": allocations
    }