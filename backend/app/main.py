from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.gdacs import router as gdacs_router
from app.api.usgs import router as usgs_router
from app.api.resource import router as resource_router
from app.api.severity import router as severity_router

from app.api import (
    buildings,
    satellite,
    field_operation,
    ndma
)

from app.api.impact import router as impact_router
from app.api.demand import router as demand_router
from app.api.vulnerability import router as vulnerability_router
from app.api.demographics import router as demographics_router
from app.api.scenario import router as scenario_router
from app.api.allocation import router as allocation_router
from app.api.zone_data import router as zone_data_router
from app.api.zone import router as zone_router

from app.db.database import engine
from app.models import Base


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Based Disaster Response Management System"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Core
app.include_router(zone_router)

# Disaster data
app.include_router(gdacs_router)
app.include_router(usgs_router)
app.include_router(ndma.router)

# Analysis
app.include_router(impact_router)
app.include_router(vulnerability_router)
app.include_router(demographics_router)
app.include_router(scenario_router)

# AI / Demand
app.include_router(demand_router)

# Resources
app.include_router(resource_router)
app.include_router(allocation_router)
app.include_router(zone_data_router)

# Other
app.include_router(buildings.router, tags=["Buildings"])
app.include_router(satellite.router, tags=["Satellite"])
app.include_router(severity_router)
app.include_router(field_operation.router)


@app.get("/")
def home():
    return {
        "message": "Disaster Response API Running"
    }