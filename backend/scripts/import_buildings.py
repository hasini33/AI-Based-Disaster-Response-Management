import osmnx as ox
import pandas as pd

from geoalchemy2.shape import from_shape

from app.db.database import SessionLocal
from app.models.building import Building

# Connect to database
db = SessionLocal()

# Delete old records
db.query(Building).delete()
db.commit()

print("Old building records deleted.")

# Hyderabad coordinates
latitude = 17.3850
longitude = 78.4867

# Download buildings
buildings = ox.features_from_point(
    (latitude, longitude),
    tags={"building": True},
    dist=2000
)

print("Downloaded Buildings:", len(buildings))

count = 0

for index, row in buildings.iterrows():

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

    #print(osm_id, building_type, amenity, name)

    building = Building(
        osm_id=osm_id,
        building_type=building_type,
        amenity=amenity,
        name=name,
        geometry=from_shape(row.geometry, srid=4326)
    )

    db.add(building)

    count += 1

    if count % 500 == 0:
        db.commit()
        print(f"{count} buildings inserted...")


db.commit()


print(f"\nSuccessfully imported {count} buildings!")

db.close()