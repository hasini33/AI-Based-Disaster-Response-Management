from sqlalchemy.orm import Session

from app.models.resource import Resource


def allocate_resource(
    db: Session,
    resource_type: str,
    quantity: int
):
    resource = (
        db.query(Resource)
        .filter(Resource.resource_type == resource_type)
        .first()
    )

    if not resource:
        return {"error": "Resource not found"}

    if resource.capacity < quantity:
        return {"error": "Insufficient resources"}

    # Reduce available quantity
    resource.capacity -= quantity

    # Update status
    if resource.capacity == 0:
        resource.status = "Unavailable"

    db.commit()
    db.refresh(resource)

    return resource