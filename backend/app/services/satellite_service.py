from pystac_client import Client
import planetary_computer
from shapely.geometry import Point

CATALOG = "https://planetarycomputer.microsoft.com/api/stac/v1"


def calculate_earthquake_extent(latitude: float, longitude: float, magnitude: float):
    """
    Create an estimated disaster impact polygon around
    an earthquake epicenter.

    This is an estimated extent, not a satellite-derived
    damage boundary.
    """

    # Approximate radius in kilometers based on magnitude
    if magnitude >= 7.0:
        radius_km = 50
    elif magnitude >= 6.0:
        radius_km = 30
    elif magnitude >= 5.0:
        radius_km = 15
    else:
        radius_km = 5

    # Approximate conversion:
    # 1 degree latitude ~= 111 km
    radius_deg = radius_km / 111

    point = Point(longitude, latitude)

    # Buffer in degrees
    polygon = point.buffer(radius_deg)

    return {
        "radius_km": radius_km,
        "geometry": polygon.wkt
    }


def get_satellite_imagery(latitude: float, longitude: float):

    print("Satellite search started")
    print(latitude, longitude)

    catalog = Client.open(CATALOG)

    print("Catalog opened")

    search = catalog.search(
    collections=["sentinel-2-l2a"],
    intersects={
        "type": "Point",
        "coordinates": [longitude, latitude],
    },
    datetime="2025-01-01/2026-08-05",
    max_items=20,
)

    print("Search created")

    try:
        item = next(search.items())

    except StopIteration:
        print("No satellite image found")

        return {
            "image_found": False,
            "collection": None,
            "acquisition_date": None,
            "cloud_cover": None,
            "thumbnail_url": None
        }

    print("Image found")

    item = planetary_computer.sign(item)

    thumbnail = None

    if "rendered_preview" in item.assets:
        thumbnail = item.assets["rendered_preview"].href

    elif "visual" in item.assets:
        thumbnail = item.assets["visual"].href

    return {
        "image_found": True,
        "collection": item.collection_id,
        "acquisition_date": item.datetime.isoformat(),
        "cloud_cover": item.properties.get("eo:cloud_cover"),
        "thumbnail_url": thumbnail
    }