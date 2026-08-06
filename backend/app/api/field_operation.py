from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.field_operation import (
    FieldOperationCreate,
    FieldOperationResponse,
)
from app.services.field_operation_service import (
    create_field_operation,
    get_all_field_operations,
)

router = APIRouter(
    prefix="/field-operations",
    tags=["Field Operations"],
)


@router.post("/", response_model=FieldOperationResponse)
def create_operation(
    operation: FieldOperationCreate,
    db: Session = Depends(get_db),
):
    return create_field_operation(db, operation)


@router.get("/")
def get_operations(db: Session = Depends(get_db)):
    return get_all_field_operations(db)