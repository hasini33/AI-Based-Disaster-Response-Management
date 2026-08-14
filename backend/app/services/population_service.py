import rasterio
import numpy as np

from shapely.geometry import mapping
from shapely.ops import transform
from pyproj import Transformer
from rasterio.mask import mask


def get_population_at_location(latitude, longitude, file_path):
    """
    Get population value at a single latitude/longitude.
    Existing function used by Module 1.
    """

    with rasterio.open(file_path) as dataset:

        row, col = dataset.index(longitude, latitude)

        if (
            row < 0 or row >= dataset.height or
            col < 0 or col >= dataset.width
        ):
            raise ValueError(
                "Location is outside the raster bounds."
            )

        population = dataset.read(
            1,
            window=rasterio.windows.Window(
                col, row, 1, 1
            )
        )[0, 0]

        return float(population)


def get_population_in_zone(zone_geometry, raster_path):
    """
    Calculate total population inside a zone polygon.
    """

    with rasterio.open(raster_path) as dataset:

        zone_crs = "EPSG:4326"

        if dataset.crs.to_string() != zone_crs:

            transformer = Transformer.from_crs(
                zone_crs,
                dataset.crs,
                always_xy=True
            )

            zone_geometry = transform(
                transformer.transform,
                zone_geometry
            )

        shapes = [mapping(zone_geometry)]

        try:

            image, _ = mask(
                dataset,
                shapes,
                crop=True,
                filled=True,
                nodata=0
            )

        except ValueError:
            return 0

        population = image[0]

        population = population[
            np.isfinite(population)
        ]

        population = population[
            population >= 0
        ]

        total_population = float(
            population.sum()
        )

        return round(total_population)