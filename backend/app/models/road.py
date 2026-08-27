from sqlalchemy import Column, Integer, String, Float

from app.db.database import Base


class Road(Base):

    __tablename__ = "roads"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    road_name = Column(
        String,
        nullable=False
    )

    start_latitude = Column(
        Float,
        nullable=False
    )

    start_longitude = Column(
        Float,
        nullable=False
    )

    end_latitude = Column(
        Float,
        nullable=False
    )

    end_longitude = Column(
        Float,
        nullable=False
    )

    distance_km = Column(
        Float,
        nullable=False
    )

    status = Column(
        String,
        default="Open"
    )

    travel_time_minutes = Column(
        Float,
        nullable=True
    )