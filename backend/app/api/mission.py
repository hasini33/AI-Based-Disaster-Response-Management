from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.mission import Mission
from app.services.mission_allocation_service import (
    create_missions_from_optimized_routes,
    get_missions,
    update_mission_status
)


router = APIRouter(
    prefix="/missions",
    tags=["Mission Allocation"]
)


@router.post("/generate")
def generate_missions(
    db: Session = Depends(get_db)
):

    try:

        return create_missions_from_optimized_routes(
            db
        )

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/")
def list_missions(
    db: Session = Depends(get_db)
):

    return get_missions(db)


@router.put("/{mission_id}/status")
def change_mission_status(
    mission_id: int,
    status: str,
    db: Session = Depends(get_db)
):

    mission = (
        db.query(Mission)
        .filter(
            Mission.id == mission_id
        )
        .first()
    )

    if not mission:

        raise HTTPException(
            status_code=404,
            detail="Mission not found"
        )

    allowed_statuses = [
        "Pending",
        "Assigned",
        "In Progress",
        "Completed",
        "Cancelled"
    ]

    if status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid mission status. "
                "Allowed statuses: "
                + ", ".join(allowed_statuses)
            )
        )

    allowed_transitions = {

        "Pending": [
            "Assigned",
            "Cancelled"
        ],

        "Assigned": [
            "In Progress",
            "Cancelled"
        ],

        "In Progress": [
            "Completed",
            "Cancelled"
        ],

        "Completed": [],

        "Cancelled": []
    }

    current_status = mission.status

    if status not in allowed_transitions.get(
        current_status,
        []
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change mission status "
                f"from '{current_status}' "
                f"to '{status}'"
            )
        )

    result = update_mission_status(
        db,
        mission_id,
        status
    )

    return {
        "message": "Mission status updated",
        "mission": result
    }