from sqlalchemy import Column,Integer,String
from geoalchemy2 import Geometry
from app.db.database import Base

class Building(Base):
    __tablename__="buildings"

    id=Column(Integer,primary_key=True, index=True)
    osm_id=Column(String,unique=True,nullable=False)
    building_type=Column(String)
    amenity = Column(String)
    name=Column(String)
    geometry=Column(
        Geometry(geometry_type="GEOMETRY",srid=4326)
                    )