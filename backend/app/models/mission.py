from sqlalchemy import Column, Integer, String, Float

from app.db.database import Base


class Mission(Base):

    __tablename__ = "missions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    zone_id = Column(
        Integer,
        nullable=False
    )

    zone_name = Column(
        String,
        nullable=False
    )

    vehicle_id = Column(
        Integer,
        nullable=False
    )

    vehicle_name = Column(
        String,
        nullable=False
    )

    # Actual disaster-relief resource
    resource_type = Column(
        String,
        nullable=False
    )

    quantity = Column(
        Float,
        nullable=False
    )

    priority = Column(
        Float,
        nullable=False
    )

    distance_km = Column(
        Float,
        nullable=True
    )

    travel_time_minutes = Column(
        Float,
        nullable=True
    )

    status = Column(
        String,
        default="Pending"
    )