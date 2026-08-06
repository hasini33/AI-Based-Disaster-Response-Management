from sqlalchemy.orm import Session

from app.models.field_operation import FieldOperation
from app.schemas.field_operation import FieldOperationCreate


def create_field_operation(
    db: Session,
    operation: FieldOperationCreate
):
    field_operation = FieldOperation(
        disaster_id=operation.disaster_id,
        zone_id=operation.zone_id,
        resource_type=operation.resource_type,
        quantity=operation.quantity,
    )

    db.add(field_operation)
    db.commit()
    db.refresh(field_operation)

    return field_operation


def get_all_field_operations(db: Session):
    return db.query(FieldOperation).all()