from sqlalchemy import Column, Integer, String, Float

from app.db.database import Base


class Vehicle(Base):

    __tablename__ = "vehicles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    vehicle_name = Column(
        String,
        nullable=False
    )

    vehicle_type = Column(
        String,
        nullable=False
    )

    capacity = Column(
        Float,
        nullable=False
    )

    status = Column(
        String,
        default="Available"
    )

    latitude = Column(
        Float,
        nullable=True
    )

    longitude = Column(
        Float,
        nullable=True
    )