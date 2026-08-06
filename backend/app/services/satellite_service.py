from pystac_client import Client
import planetary_computer

CATALOG = "https://planetarycomputer.microsoft.com/api/stac/v1"


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
        max_items=1,
    )

    print("Search created")

    try:
        item = next(search.items())

    except StopIteration:
        print("No satellite image found")
        return None

    print("Image found")

    item = planetary_computer.sign(item)

    thumbnail = None

    if "rendered_preview" in item.assets:
        thumbnail = item.assets["rendered_preview"].href

    elif "visual" in item.assets:
        thumbnail = item.assets["visual"].href

    return {
        "collection": item.collection_id,
        "acquisition_date": item.datetime.isoformat(),
        "cloud_cover": item.properties.get("eo:cloud_cover"),
        "thumbnail_url": thumbnail,
    }