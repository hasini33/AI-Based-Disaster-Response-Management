import rasterio
from rasterio.windows import Window


def read_population_raster(file_path):
    with rasterio.open(file_path) as dataset:
        print("Raster CRS:", dataset.crs)
        print("Raster Bounds:", dataset.bounds)
        print("=" * 40)
        print("Population Raster Information")
        print("=" * 40)

        print("Width :", dataset.width)
        print("Height:", dataset.height)
        print("Bands :", dataset.count)
        print("CRS   :", dataset.crs)
        print("Bounds:", dataset.bounds)

        data = dataset.read(1)

        print("\nPopulation Grid")
        print(data)

    return data


def get_population_at_location(latitude, longitude, file_path):
    """
    Returns the population value at a given latitude and longitude
    without loading the entire raster into memory.
    """

    with rasterio.open(file_path) as dataset:

        # Convert latitude/longitude to raster row and column
        row, col = dataset.index(longitude, latitude)

        # Check if the coordinates are inside the raster
        if (
            row < 0 or row >= dataset.height or
            col < 0 or col >= dataset.width
        ):
            raise ValueError("Location is outside the raster bounds.")

        # Read only one pixel
        population = dataset.read(
            1,
            window=Window(col, row, 1, 1)
        )[0, 0]

        return float(population)