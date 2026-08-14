from sqlalchemy.orm import Session

from app.models.allocation import Allocation


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

    allocation.status = "Completed"

    db.commit()
    db.refresh(allocation)

    return allocation