from sqlalchemy import Column, Integer, String, Float
from app.db.database import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKTElement

class Disaster(Base):
    __tablename__ = "disasters"

    id = Column(Integer, primary_key=True, index=True)

    disaster_type = Column(String(20))
    country = Column(String(100))
    alert_level = Column(String(20))
    severity = Column(Float)

    latitude = Column(Float)
    longitude = Column(Float)
    
    location = Column(Geometry("POINT", srid=4326))

    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    zone = relationship(
    "Zone",
    foreign_keys=[zone_id]
)