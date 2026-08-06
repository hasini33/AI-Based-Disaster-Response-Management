from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.resource_service import allocate_resource
from app.db.database import get_db
from app.models.resource import Resource

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.get("/")
def get_resources(db: Session = Depends(get_db)):
    resources = db.query(Resource).all()
    return resources

@router.post("/allocate")
def allocate(
    resource_type: str,
    quantity: int,
    db: Session = Depends(get_db)
):
    return allocate_resource(
        db,
        resource_type,
        quantity
    )