from fastapi import FastAPI

from app.api.gdacs import router as gdacs_router
from app.api.usgs import router as usgs_router
from app.api.resource import router as resource_router
from app.api.severity import router as severity_router
from app.api import buildings
from app.api import satellite
from app.api import zone
from app.api import field_operation
from app.api import satellite
from app.api import ndma




from app.db.database import engine

from app.models import Base

Base.metadata.create_all(bind=engine)
app = FastAPI(title= "AI Based Disaster Response Management System")



app.include_router(zone.router)
app.include_router(field_operation.router)
app.include_router(buildings.router, tags=["Buildings"])
app.include_router(satellite.router, tags=["Satellite"])
app.include_router(severity_router,tags=["Severity"])
app.include_router(resource_router)
app.include_router(ndma.router, tags=["NDMA"])
app.include_router(satellite.router)
app.include_router(gdacs_router,tags=["GDACS"])
app.include_router(usgs_router,tags=["USGS"])



@app.get("/")
def home():
    return {"message": "Disaster Response API Running"}