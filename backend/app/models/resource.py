from sqlalchemy import Column, Integer, String, Float
from app.db.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)

    resource_name = Column(String, nullable=False)

    resource_type = Column(String, nullable=False)

    latitude = Column(Float)

    longitude = Column(Float)

    capacity = Column(Integer)

    status = Column(String, default="Available")