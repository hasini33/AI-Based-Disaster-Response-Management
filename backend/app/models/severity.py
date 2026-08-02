from sqlalchemy import Column, Integer, Float, String
from app.db.database import Base


class Severity(Base):
    __tablename__ = "severity"

    id = Column(Integer, primary_key=True, index=True)

    zone_name = Column(String, nullable=False)

    latitude = Column(Float, nullable=False)

    longitude = Column(Float, nullable=False)

    population = Column(Integer)

    buildings = Column(Integer)

    magnitude = Column(Float)

    severity_score = Column(Float)

    severity_level = Column(String)