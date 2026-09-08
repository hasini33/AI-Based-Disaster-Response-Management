from sqlalchemy.orm import Session

from app.models.resource import Resource
from app.schemas.resource import (
    ResourceCreate,
    ResourceUpdate,
)


def create_resource(
    db: Session,
    resource: ResourceCreate
):
    resource_name = resource.resource_name.strip()

    # Prevent duplicate resources
    existing = (
        db.query(Resource)
        .filter(Resource.resource_name == resource_name)
        .first()
    )

    if existing:
        return existing

    new_resource = Resource(
        resource_name=resource_name,
        resource_type=resource.resource_type,
        latitude=resource.latitude,
        longitude=resource.longitude,
        capacity=resource.capacity,
        status=resource.status,
    )

    # Automatically mark zero-capacity resources unavailable
    if new_resource.capacity == 0:
        new_resource.status = "unavailable"

    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)

    return new_resource

def get_all_resources(db: Session):
    return (
        db.query(Resource)
        .order_by(Resource.id)
        .all()
    )


def get_resource_by_id(
    db: Session,
    resource_id: int
):
    return (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )


def update_resource(
    db: Session,
    resource_id: int,
    resource_data: ResourceUpdate
):
    resource = get_resource_by_id(
        db,
        resource_id
    )

    if not resource:
        return None

    update_data = resource_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():

        if field == "resource_name" and value is not None:
            value = value.strip()

        setattr(
            resource,
            field,
            value
        )

    # Keep status consistent with capacity
    if resource.capacity == 0:
        resource.status = "unavailable"

    db.commit()
    db.refresh(resource)

    return resource


def delete_resource(
    db: Session,
    resource_id: int
):
    resource = get_resource_by_id(
        db,
        resource_id
    )

    if not resource:
        return None

    db.delete(resource)
    db.commit()

    return resource


def allocate_resource(
    db: Session,
    resource_type: str,
    quantity: int
):
    # --------------------------------------------------
    # Validate quantity
    # --------------------------------------------------

    if quantity <= 0:
        return {
            "error": "Quantity must be greater than 0"
        }

    # --------------------------------------------------
    # Normalize resource type
    # --------------------------------------------------

    normalized_type = resource_type.strip().lower()

    aliases = {
        "medical kit": "medical_kits",
        "medical kits": "medical_kits",
        "medical_kit": "medical_kits",
        "relief center": "relief_center",
        "relief centre": "relief_center",
    }

    normalized_type = aliases.get(
        normalized_type,
        normalized_type
    )

    # --------------------------------------------------
    # Find available resource
    # --------------------------------------------------

    resource = (
        db.query(Resource)
        .filter(
            Resource.resource_type.ilike(
                normalized_type
            ),
            Resource.capacity > 0
        )
        .order_by(Resource.id)
        .first()
    )

    if not resource:
        return {
            "error": (
                f"No available resource found "
                f"for type '{resource_type}'"
            )
        }

    # --------------------------------------------------
    # Check capacity
    # --------------------------------------------------

    if resource.capacity < quantity:
        return {
            "error": (
                f"Insufficient resources. "
                f"Available capacity: {resource.capacity}"
            )
        }

    # --------------------------------------------------
    # Allocate
    # --------------------------------------------------

    resource.capacity -= quantity

    if resource.capacity == 0:
        resource.status = "unavailable"
    else:
        resource.status = "available"

    db.commit()
    db.refresh(resource)

    return resource