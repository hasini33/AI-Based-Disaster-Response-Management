from sqlalchemy import Column, Integer, String, Float,DateTime
from app.db.database import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKTElement

class Disaster(Base):
    __tablename__ = "disasters"

    id = Column(Integer, primary_key=True, index=True)

    disaster_type = Column(String(255))
    country = Column(String(100))
    alert_level = Column(String(20))
    severity = Column(Float)

    latitude = Column(Float)
    longitude = Column(Float)
    satellite_damage_percent = Column(Float, nullable=True)
    event_date = Column(DateTime, nullable=True)

    zone_id = Column(
        Integer,
        ForeignKey("zones.id"),
        nullable=True
    )

    satellite_damage_percent = Column(
        Float,
        nullable=True
    )

    zone = relationship(
        "Zone",
        back_populates="disasters"
    )
    location = Column(Geometry("POINT", srid=4326))
    event_date = Column(DateTime, nullable=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    zone = relationship(
    "Zone",
    back_populates="disasters"
)