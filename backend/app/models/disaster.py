from sqlalchemy import Column, Integer, String, Float
from app.db.database import Base


class Disaster(Base):
    __tablename__ = "disasters"

    id = Column(Integer, primary_key=True, index=True)

    disaster_type = Column(String(20))
    country = Column(String(100))
    alert_level = Column(String(20))
    severity = Column(Float)

    latitude = Column(Float)
    longitude = Column(Float)
    