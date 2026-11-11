
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.db.database import Base


class Disaster(Base):
    __tablename__ = "disasters"

    __table_args__ = (
        Index(
            "uq_disasters_source_event",
            "source",
            "source_event_id",
            unique=True
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    # Source identification for duplicate prevention
    source = Column(String(30), nullable=True)
    source_event_id = Column(String(150), nullable=True)

    disaster_type = Column(String(255))
    country = Column(String(100))
    alert_level = Column(String(20))
    severity = Column(Float)

    latitude = Column(Float)
    longitude = Column(Float)

    location = Column(Geometry("POINT", srid=4326))

    satellite_damage_percent = Column(Float, nullable=True)
    event_date = Column(DateTime, nullable=True)

    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    zone = relationship("Zone", back_populates="disasters")
