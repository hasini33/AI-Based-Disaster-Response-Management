
from sqlalchemy import Column, Integer, Float, String, BigInteger, Index
from geoalchemy2 import Geometry

from app.db.database import Base


class Earthquake(Base):
    __tablename__ = "earthquakes"

    __table_args__ = (
        Index(
            "uq_earthquakes_source_event",
            "source_event_id",
            unique=True
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    # Unique identifier received from the USGS API
    source_event_id = Column(String(150), nullable=True)

    magnitude = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    place = Column(String)
    time = Column(BigInteger)

    location = Column(Geometry("POINT", srid=4326))
