from sqlalchemy import Column, Integer, String, Float
from app.db.database import Base


class Depot(Base):

    __tablename__ = "depots"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    depot_name = Column(
        String,
        nullable=False
    )

    depot_type = Column(
        String,
        nullable=False,
        default="Supply"
    )

    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )

    status = Column(
        String,
        default="Available"
    )