import osmnx as ox
import pandas as pd

from geoalchemy2.shape import from_shape

from app.db.database import SessionLocal
from app.models.building import Building


db = SessionLocal()


# Delete old building records
db.query(Building).delete()
db.commit()

print("Old building records deleted.")


# ---------------------------------------------------------
# AREA COVERED BY ALL ZONES
# ---------------------------------------------------------

west = 78.40
south = 17.30
east = 78.80
north = 17.40

print("Downloading buildings for entire zone area...")
print(f"West: {west}")
print(f"East: {east}")
print(f"South: {south}")
print(f"North: {north}")


# ---------------------------------------------------------
# DOWNLOAD OSM BUILDINGS
# ---------------------------------------------------------

buildings = ox.features_from_bbox(
    bbox=(west, south, east, north),
    tags={"building": True}
)

print("Downloaded Buildings:", len(buildings))


# ---------------------------------------------------------
# INSERT INTO DATABASE
# ---------------------------------------------------------

count = 0

for index, row in buildings.iterrows():

    if row.geometry is None:
        continue

    osm_id = f"{index[0]}_{index[1]}"

    building_type = row.get("building")
    name = row.get("name")
    amenity = row.get("amenity")

    if pd.isna(building_type):
        building_type = None

    if pd.isna(name):
        name = None

    if pd.isna(amenity):
        amenity = None

    building = Building(
        osm_id=osm_id,
        building_type=building_type,
        amenity=amenity,
        name=name,
        geometry=from_shape(
            row.geometry,
            srid=4326
        )
    )

    db.add(building)

    count += 1

    if count % 500 == 0:
        db.commit()
        print(f"{count} buildings inserted...")


db.commit()

print(f"\nSuccessfully imported {count} buildings!")

db.close()