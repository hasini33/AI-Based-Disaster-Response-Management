from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.allocation import Allocation

from app.services.resource_allocation_service import (
    allocate_resources
)

from app.services.optimization_service import (
    optimize_resource_allocation
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


# ==================================================
# 1. ALLOCATION HISTORY
# ==================================================

@router.get("/history")
def allocation_history(
    db: Session = Depends(get_db)
):

    allocations = (
        db.query(Allocation)
        .order_by(
            Allocation.created_at.desc()
        )
        .all()
    )

    return {
        "total": len(allocations),
        "allocations": allocations
    }


# ==================================================
# 2. GLOBAL RESOURCE OPTIMIZATION
# ==================================================

@router.get("/optimize")
def optimize_allocation(
    db: Session = Depends(get_db)
):

    try:

        return optimize_resource_allocation(
            db
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# 3. GET ALLOCATION FOR ONE ZONE
# ==================================================

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


# ==================================================
# 4. CREATE OPTIMIZED ALLOCATION REQUEST
# ==================================================

@router.post("/{zone_id}/request")
def create_request(
    zone_id: int,
    db: Session = Depends(get_db)
):

    optimized = optimize_resource_allocation(db)

    if optimized.get("status") != "optimized":
        raise HTTPException(
            status_code=400,
            detail=optimized.get(
                "message",
                "Unable to optimize resource allocation"
            )
        )

    zone_allocation = next(
        (
            item
            for item in optimized.get("allocation", [])
            if item["zone_id"] == zone_id
        ),
        None
    )

    if not zone_allocation:
        raise HTTPException(
            status_code=404,
            detail="Zone allocation not found"
        )

    resources = zone_allocation.get(
        "resources",
        {}
    )

    if not resources:
        raise HTTPException(
            status_code=400,
            detail="No resource allocation available for this zone"
        )

    created = create_allocation_requests(
        db,
        zone_id,
        resources
    )

    if not created:
        raise HTTPException(
            status_code=409,
            detail="Pending allocation requests already exist for this zone"
        )

    return {
        "message": "Optimized allocation request created",
        "status": "Pending",
        "zone_id": zone_id,
        "zone_name": zone_allocation["zone_name"],
        "priority": zone_allocation["priority"],
        "allocations": created
    }
# ==================================================
# 5. APPROVE ALLOCATION
# ==================================================

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
            status_code=400,
            detail=(
                "Allocation cannot be approved. "
                "It may not exist, may already be processed, "
                "or available inventory may be insufficient."
            )
        )

    return {
        "message": "Allocation approved",
        "allocation": result
    }


# ==================================================
# 6. REJECT ALLOCATION
# ==================================================

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
            status_code=400,
            detail=(
                "Allocation cannot be rejected. "
                "It may not exist or may already be processed."
            )
        )

    return {
        "message": "Allocation rejected",
        "allocation": result
    }


# ==================================================
# 7. COMPLETE ALLOCATION
# ==================================================

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
            status_code=400,
            detail=(
                "Allocation cannot be completed. "
                "Only Approved allocations can be completed."
            )
        )

    return {
        "message": "Allocation completed",
        "allocation": result
    }