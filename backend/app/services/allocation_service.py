from sqlalchemy.orm import Session

from app.models.allocation import Allocation
from app.models.resource import Resource


RESOURCE_MAP = {
    "food_packets": "Food",
    "water_liters": "Water",
    "medical_kits": "medical_kits",
    "shelter_capacity": "Shelter",
}


def create_allocation_requests(
    db: Session,
    zone_id: int,
    allocation_data: dict
):

    created = []

    for resource_type, data in allocation_data.items():

        allocation = Allocation(
            zone_id=zone_id,
            resource_type=resource_type,
            required=data["required"],
            allocated=data["allocated"],
            shortage=data["shortage"],
            status="Pending"
        )

        db.add(allocation)
        created.append(allocation)

    db.commit()

    for allocation in created:
        db.refresh(allocation)

    return created


def approve_allocation(
    db: Session,
    allocation_id: int
):

    allocation = (
        db.query(Allocation)
        .filter(
            Allocation.id == allocation_id
        )
        .first()
    )

    if not allocation:
        return None

    if allocation.status != "Pending":
        return None

    # If optimized allocation is zero,
    # there is nothing to deduct.
    if allocation.allocated <= 0:

        allocation.status = "Approved"

        db.commit()
        db.refresh(allocation)

        return allocation

    database_resource_type = RESOURCE_MAP.get(
        allocation.resource_type
    )

    if not database_resource_type:
        return None

    # Case-insensitive matching.
    resources = (
        db.query(Resource)
        .filter(
            Resource.resource_type.ilike(
                database_resource_type
            ),
            Resource.status.ilike(
                "Available"
            )
        )
        .all()
    )

    total_available = sum(
        float(resource.capacity or 0)
        for resource in resources
    )

    if total_available < allocation.allocated:
        return None

    remaining = float(
        allocation.allocated
    )

    for resource in resources:

        if remaining <= 0:
            break

        stock = float(
            resource.capacity or 0
        )

        deduction = min(
            stock,
            remaining
        )

        resource.capacity = int(
            stock - deduction
        )

        remaining -= deduction

    allocation.status = "Approved"

    db.commit()
    db.refresh(allocation)

    return allocation


def reject_allocation(
    db: Session,
    allocation_id: int
):

    allocation = (
        db.query(Allocation)
        .filter(
            Allocation.id == allocation_id
        )
        .first()
    )

    if not allocation:
        return None

    if allocation.status != "Pending":
        return None

    allocation.status = "Rejected"

    db.commit()
    db.refresh(allocation)

    return allocation


def complete_allocation(
    db: Session,
    allocation_id: int
):

    allocation = (
        db.query(Allocation)
        .filter(
            Allocation.id == allocation_id
        )
        .first()
    )

    if not allocation:
        return None

    # Completion is allowed only after approval.
    if allocation.status != "Approved":
        return None

    allocation.status = "Completed"

    db.commit()
    db.refresh(allocation)

    return allocation