"""CRUD operations for disaster zones."""
from pathlib import Path
from shapely import wkt
from app.services.population_service import get_population_in_zone
from sqlalchemy.orm import Session
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape
from app.models.zone import Zone
from app.schemas.zone import ZoneCreate, ZoneUpdate


POPULATION_RASTER_PATH = Path(
    "data/ind_ppp_2020.tif"
)

def create_zone(db: Session, zone: ZoneCreate):
    db_zone = Zone(
        zone_name=zone.zone_name,
        geometry=WKTElement(zone.geometry, srid=4326),
    )

    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)

    return {
        "id": db_zone.id,
        "zone_name": db_zone.zone_name,
        "geometry": to_shape(db_zone.geometry).wkt,
        "estimated_population": db_zone.estimated_population,
        "building_count": db_zone.building_count,
        "disaster_count": db_zone.disaster_count,
        "severity_score": db_zone.severity_score,
        "created_at": db_zone.created_at,
    }


def get_all_zones(db: Session):
    zones = db.query(Zone).all()

    return [
    {
        "id": zone.id,
        "zone_name": zone.zone_name,
        "geometry": to_shape(zone.geometry).wkt,
        "estimated_population": zone.estimated_population,
        "building_count": zone.building_count,
        "disaster_count": len(zone.disasters),
        "severity_score": zone.severity_score,

        "damage_percent": zone.damage_percent,
        "elderly_percent": zone.elderly_percent,
        "children_percent": zone.children_percent,
        "medically_dependent_percent": zone.medically_dependent_percent,

        "created_at": zone.created_at,
    }
    for zone in zones
]


def get_zone_by_id(db: Session, zone_id: int):
    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id)
        .first()
    )

    if not zone:
        return None

    return {
        "id": zone.id,
        "zone_name": zone.zone_name,
        "geometry": to_shape(zone.geometry).wkt,
        "estimated_population": zone.estimated_population,
        "building_count": zone.building_count,
        "disaster_count": len(zone.disasters),
        "severity_score": zone.severity_score,
        "created_at": zone.created_at,
        "damage_percent": zone.damage_percent,
        "elderly_percent": zone.elderly_percent,
        "children_percent": zone.children_percent,
        "medically_dependent_percent": zone.medically_dependent_percent,
    }


def update_zone(db: Session, zone_id: int, zone: ZoneUpdate):
    db_zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id)
        .first()
    )

    if not db_zone:
        return None

    db_zone.zone_name = zone.zone_name
    db_zone.geometry = WKTElement(
        zone.geometry,
        srid=4326
    )

    db.commit()
    db.refresh(db_zone)

    return {
        "id": db_zone.id,
        "zone_name": db_zone.zone_name,
        "geometry": to_shape(db_zone.geometry).wkt,
        "estimated_population": db_zone.estimated_population,
        "building_count": db_zone.building_count,
        "disaster_count": len(db_zone.disasters),
        "severity_score": db_zone.severity_score,
        "created_at": db_zone.created_at,
    }


def delete_zone(db: Session, zone_id: int):
    db_zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id)
        .first()
    )

    if not db_zone:
        return None

    db.delete(db_zone)
    db.commit()

    return {
        "message": "Zone deleted successfully",
        "id": zone_id,
    }

def update_zone_population(db: Session, zone_id: int):

    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id)
        .first()
    )

    if not zone:
        return None

    zone_shape = to_shape(zone.geometry)

    population = get_population_in_zone(
        zone_shape,
        POPULATION_RASTER_PATH
    )

    zone.estimated_population = population

    db.commit()
    db.refresh(zone)

    return {
        "zone_id": zone.id,
        "zone_name": zone.zone_name,
        "population": zone.estimated_population
    }