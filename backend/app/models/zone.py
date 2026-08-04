from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from sqlalchemy.orm import relationship

from app.db.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)

    disaster_id = Column(Integer, ForeignKey("disasters.id"), nullable=True)

    zone_name = Column(String, unique=True, nullable=False)

    geometry = Column(
        Geometry("POLYGON", srid=4326),
        nullable=False
    )

    estimated_population = Column(Integer, default=0)

    building_count = Column(Integer, default=0)

    severity_score = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    disasters = relationship(
    "Disaster",
    foreign_keys="Disaster.zone_id"
)