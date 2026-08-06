'''This file will executes crude operations '''


from sqlalchemy.orm import Session
from app.models.zone import Zone
from app.schemas.zone import ZoneCreate, ZoneUpdate
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape

def create_zone(db: Session, zone: ZoneCreate):
    db_zone = Zone(

    zone_name=zone.zone_name,

    geometry=WKTElement(zone.geometry, srid=4326)

)
    #db_zone = Zone(zone_name=zone.zone_name)
    db.add(db_zone)
    db.commit()           #Now PostgreSQL executes
    db.refresh(db_zone)
    return {
    "id": db_zone.id,
    "zone_name": db_zone.zone_name,
    "geometry": to_shape(db_zone.geometry).wkt
}


def get_all_zones(db: Session):
    zones = db.query(Zone).all()

    return [
        {
            "id": zone.id,
            "zone_name": zone.zone_name,
            "geometry": to_shape(zone.geometry).wkt,
            "disaster_ids": [d.id for d in zone.disasters],
            "estimated_population": zone.estimated_population,
            "building_count": zone.building_count,
            "severity_score": zone.severity_score,
            "created_at": zone.created_at,
        }
        for zone in zones
    ]

def get_zone_by_id(db: Session, zone_id: int):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()

    if not zone:
        return None

    return {
    "id": zone.id,
    "zone_name": zone.zone_name,
    "geometry": to_shape(zone.geometry).wkt,
    "disaster_ids": [d.id for d in zone.disasters],
    "estimated_population": zone.estimated_population,
    "building_count": zone.building_count,
    "severity_score": zone.severity_score,
    "created_at": zone.created_at,
}


def update_zone(db: Session, zone_id: int, zone: ZoneUpdate):
    db_zone = db.query(Zone).filter(Zone.id == zone_id).first()

    if db_zone:
        db_zone.zone_name = zone.zone_name
        db_zone.geometry = WKTElement(zone.geometry, srid=4326)
        db.commit()
        db.refresh(db_zone)

    return {
    "id": db_zone.id,
    "zone_name": db_zone.zone_name,
    "geometry": to_shape(db_zone.geometry).wkt,
    "disaster_ids": [d.id for d in db_zone.disasters],
    "estimated_population": db_zone.estimated_population,
    "building_count": db_zone.building_count,
    "severity_score": db_zone.severity_score,
    "created_at": db_zone.created_at,
}


def delete_zone(db: Session, zone_id: int):
    db_zone = db.query(Zone).filter(Zone.id == zone_id).first()

    if db_zone:
        db.delete(db_zone)
        db.commit()

    return db_zone