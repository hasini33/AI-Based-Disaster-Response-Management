from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.resource import Resource

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.get("/")
def get_resources(db: Session = Depends(get_db)):
    resources = db.query(Resource).all()
    return resources