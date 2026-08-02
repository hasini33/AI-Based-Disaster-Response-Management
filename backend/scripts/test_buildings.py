import osmnx as ox

latitude = 17.3850
longitude = 78.4867

center_point = (latitude, longitude)

#Download all building footprints within 1000 meters 

buildings = ox.features_from_point( #here features_from_point will tell osmnx to search areound the point
    center_point,
    tags={"building": True},  #download all tagged as building
    dist=1500  #searches within this distance/radius
)

print("Total buildings:", len(buildings))
print(buildings.head())
print(type(buildings))
print("info",buildings.shape)
buildings.info()
print(buildings.isnull().sum())
print("\nUnique Building Types:")
print(buildings["building"].unique())
print("\nBuilding Type Counts:")
print(buildings["building"].value_counts())
residential_buildings = buildings[
    buildings["building"] == "residential"
]

print("\nResidential Buildings:")
print(residential_buildings.head())

print("Total Residential Buildings:", len(residential_buildings))