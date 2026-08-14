from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class Allocation(Base):

    __tablename__ = "allocations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    zone_id = Column(
        Integer,
        nullable=False
    )

    resource_type = Column(
        String,
        nullable=False
    )

    required = Column(
        Float,
        default=0
    )

    allocated = Column(
        Float,
        default=0
    )

    shortage = Column(
        Float,
        default=0
    )

    status = Column(
        String,
        default="Pending"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )