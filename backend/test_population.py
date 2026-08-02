from app.services.population_service import get_population_at_location

population = get_population_at_location(
    latitude=17.85,
    longitude=78.15,
    file_path="data/ind_ppp_2020.tif"
)

print("Population:", population)