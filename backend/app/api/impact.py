from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.disaster import Disaster
from app.models.zone import Zone

from shapely.geometry import Point
from shapely.ops import transform
from pyproj import Transformer


router = APIRouter(
    prefix="/impact",
    tags=["Geospatial Impact"]
)


def create_extent_polygon(latitude: float, longitude: float, radius_km: float):
    """
    Creates an estimated circular disaster extent around
    the disaster location.

    Radius is in kilometers.
    """

    # Calculate suitable UTM zone for the location
    utm_zone = int((longitude + 180) / 6) + 1

    if latitude >= 0:
        epsg_code = 32600 + utm_zone
    else:
        epsg_code = 32700 + utm_zone

    # WGS84 -> UTM
    to_utm = Transformer.from_crs(
        "EPSG:4326",
        f"EPSG:{epsg_code}",
        always_xy=True
    ).transform

    # UTM -> WGS84
    to_wgs84 = Transformer.from_crs(
        f"EPSG:{epsg_code}",
        "EPSG:4326",
        always_xy=True
    ).transform

    # Create point
    point = Point(longitude, latitude)

    # Convert to meters
    point_utm = transform(to_utm, point)

    # Create radius buffer
    extent_utm = point_utm.buffer(radius_km * 1000)

    # Convert back to latitude/longitude
    extent_wgs84 = transform(to_wgs84, extent_utm)

    return extent_wgs84.wkt


def get_extent_radius(disaster_type: str, severity: float):
    """
    Returns an estimated disaster extent radius in kilometers.

    These are approximate visualization values, not
    scientific damage boundaries.
    """

    disaster_type = disaster_type.upper()

    if disaster_type in ["EQ", "EARTHQUAKE"]:
        # Example: magnitude 6.4 -> 30 km
        return max(10, min(50, severity * 5))

    if disaster_type in ["TC", "CYCLONE"]:
        return 50

    if disaster_type in ["FL", "FLOOD"]:
        return 20

    if disaster_type in ["WF", "WILDFIRE"]:
        return 15

    if disaster_type in ["VO", "VOLCANO"]:
        return 10

    return 20


@router.get("/{disaster_id}")
def get_disaster_impact(
    disaster_id: int,
    db: Session = Depends(get_db)
):

    # Get disaster
    disaster = (
        db.query(Disaster)
        .filter(Disaster.id == disaster_id)
        .first()
    )

    if not disaster:
        raise HTTPException(
            status_code=404,
            detail="Disaster not found"
        )

    # Check location
    if disaster.latitude is None or disaster.longitude is None:
        raise HTTPException(
            status_code=400,
            detail="Disaster location not available"
        )

    # Find assigned zone
    zone = None

    if disaster.zone_id:
        zone = (
            db.query(Zone)
            .filter(Zone.id == disaster.zone_id)
            .first()
        )

    # Calculate estimated extent
    radius_km = get_extent_radius(
        disaster.disaster_type,
        float(disaster.severity or 0)
    )

    extent_geometry = create_extent_polygon(
        float(disaster.latitude),
        float(disaster.longitude),
        radius_km
    )

    result = {
        "disaster_id": disaster.id,
        "disaster_type": disaster.disaster_type,
        "latitude": disaster.latitude,
        "longitude": disaster.longitude,
        "severity": disaster.severity,

        "zone_id": disaster.zone_id,
        "zone_name": zone.zone_name if zone else None,

        # Keep this field so your current frontend continues working
        "impact_area": extent_geometry,

        # New proper disaster extent information
        "impact_extent": {
            "radius_km": radius_km,
            "geometry": extent_geometry
        }
    }

    return result