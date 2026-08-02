from sqlalchemy import Column, Integer, Float, String, BigInteger
from geoalchemy2 import Geometry
from app.db.database import Base

class Earthquake(Base):
    __tablename__ = "earthquakes"

    id = Column(Integer, primary_key=True, index=True)
    magnitude = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    place = Column(String)
    time = Column(BigInteger)

    location = Column(Geometry("POINT", srid=4326))