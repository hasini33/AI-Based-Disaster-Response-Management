from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.db.database import Base


class FieldOperation(Base):
    __tablename__ = "field_operations"

    id = Column(Integer, primary_key=True, index=True)

    disaster_id = Column(Integer, ForeignKey("disasters.id"), nullable=False)

    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)

    resource_type = Column(String, nullable=False)

    quantity = Column(Integer, nullable=False)

    status = Column(String, default="Dispatched")

    created_at = Column(DateTime(timezone=True), server_default=func.now())