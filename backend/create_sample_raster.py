import numpy as np
import rasterio
from rasterio.transform import from_origin

# Sample population values
population = np.array([
    [120, 200, 300],
    [400, 500, 600],
    [700, 800, 900]
], dtype=rasterio.float32)

# Define raster transform
transform = from_origin(78.0, 18.0, 0.1, 0.1)

# Create GeoTIFF
with rasterio.open(
    "data/population/sample_population.tif",
    "w",
    driver="GTiff",
    height=population.shape[0],
    width=population.shape[1],
    count=1,
    dtype=population.dtype,
    crs="EPSG:4326",
    transform=transform,
) as dst:
    dst.write(population, 1)

print("Sample population raster created successfully!")