# ============================================================
# OPTIMIZED SATELLITE SERVICE
# Sentinel-2 / Microsoft Planetary Computer
# ============================================================

import os

# ============================================================
# IMPORTANT:
# Set PROJ paths BEFORE importing rasterio.
#
# PostgreSQL installs another proj.db on Windows.
# That older database was causing:
#
# "DATABASE.LAYOUT.VERSION.MINOR = 2 whereas >= 4 expected"
#
# ============================================================

import pyproj

PROJ_DIR = pyproj.datadir.get_data_dir()

os.environ["PROJ_DATA"] = PROJ_DIR
os.environ["PROJ_LIB"] = PROJ_DIR

# Also remove possible PostgreSQL PROJ override.
for key in [
    "PROJ_DATA",
    "PROJ_LIB",
]:
    os.environ[key] = PROJ_DIR


# ============================================================
# IMPORTS
# ============================================================

from datetime import datetime, timedelta, timezone
from typing import Optional

import numpy as np

from pystac_client import Client
import planetary_computer
import os
import pyproj

PROJ_PATH = pyproj.datadir.get_data_dir()

os.environ["PROJ_DATA"] = PROJ_PATH
os.environ["PROJ_LIB"] = PROJ_PATH
import rasterio
from rasterio.windows import from_bounds
from rasterio.warp import transform_bounds
from rasterio.enums import Resampling

from shapely.geometry import Point


# ============================================================
# CONFIGURATION
# ============================================================

CATALOG = "https://planetarycomputer.microsoft.com/api/stac/v1"

COLLECTION = "sentinel-2-l2a"

MAX_CLOUD_COVER = 20.0

BEFORE_DAYS = 60
AFTER_DAYS = 60

# Smaller analysis radius improves performance.
# Your original disaster impact radius is still returned
# separately.
ANALYSIS_RADIUS_LIMIT_KM = 10


# ============================================================
# SENTINEL BANDS
# ============================================================

BAND_ASSETS = {
    "green": "B03",
    "red": "B04",
    "nir": "B08",
    "swir": "B11",
}


# ============================================================
# CATALOG CACHE
# ============================================================

_catalog = None


def get_catalog():
    """
    Return cached Planetary Computer STAC catalog.
    """

    global _catalog

    if _catalog is None:

        _catalog = Client.open(
            CATALOG
        )

    return _catalog


# ============================================================
# IMPACT RADIUS
# ============================================================

def get_impact_radius(
    disaster_type: str,
    severity: float
) -> float:

    disaster_type = (
        disaster_type or ""
    ).upper()

    # Your severity values can be much larger
    # than conventional earthquake magnitude.
    # Therefore clamp safely.

    if disaster_type in [
        "EARTHQUAKE",
        "EQ"
    ]:

        if severity >= 7:
            return 50

        if severity >= 6:
            return 30

        if severity >= 5:
            return 15

        return 5

    if disaster_type in [
        "FLOOD",
        "FL"
    ]:
        return 20

    if disaster_type in [
        "CYCLONE",
        "TC"
    ]:
        return 50

    if disaster_type in [
        "WILDFIRE",
        "WF"
    ]:
        return 15

    if disaster_type in [
        "VOLCANO",
        "VO"
    ]:
        return 10

    return 20


# ============================================================
# IMPACT EXTENT
# ============================================================

def calculate_impact_extent(
    latitude: float,
    longitude: float,
    disaster_type: str,
    severity: float
):

    radius_km = get_impact_radius(
        disaster_type,
        severity
    )

    radius_deg = radius_km / 111.0

    point = Point(
        longitude,
        latitude
    )

    polygon = point.buffer(
        radius_deg
    )

    return {
        "radius_km": radius_km,
        "geometry": polygon.wkt
    }


# ============================================================
# BBOX
# ============================================================

def get_bbox(
    latitude: float,
    longitude: float,
    radius_km: float
):

    lat_radius = radius_km / 111.0

    cos_lat = np.cos(
        np.radians(latitude)
    )

    # Avoid division by zero near poles.
    cos_lat = max(
        float(cos_lat),
        0.01
    )

    lon_radius = (
        radius_km /
        (111.0 * cos_lat)
    )

    return (
        longitude - lon_radius,
        latitude - lat_radius,
        longitude + lon_radius,
        latitude + lat_radius
    )


# ============================================================
# SENTINEL IMAGE SEARCH
# ============================================================

def search_sentinel_images(
    latitude: float,
    longitude: float,
    start_date: datetime,
    end_date: datetime,
    max_cloud_cover: float = MAX_CLOUD_COVER,
    max_items: int = 20
):

    catalog = get_catalog()

    search = catalog.search(

        collections=[
            COLLECTION
        ],

        intersects={
            "type": "Point",
            "coordinates": [
                longitude,
                latitude
            ]
        },

        datetime=(
            f"{start_date.strftime('%Y-%m-%d')}/"
            f"{end_date.strftime('%Y-%m-%d')}"
        ),

        query={
            "eo:cloud_cover": {
                "lte": max_cloud_cover
            }
        },

        max_items=max_items
    )

    return list(
        search.items()
    )


# ============================================================
# BEST IMAGE
# ============================================================

def select_best_image(
    items
):

    if not items:
        return None

    return min(
        items,
        key=lambda item: item.properties.get(
            "eo:cloud_cover",
            100
        )
    )


# ============================================================
# IMAGE METADATA
# ============================================================

def get_image_metadata(
    item
):

    if item is None:

        return {
            "image_found": False,
            "collection": None,
            "acquisition_date": None,
            "cloud_cover": None,
            "thumbnail_url": None,
            "item_id": None
        }

    signed_item = planetary_computer.sign(
        item
    )

    thumbnail = None

    if (
        "rendered_preview"
        in signed_item.assets
    ):

        thumbnail = signed_item.assets[
            "rendered_preview"
        ].href

    elif (
        "visual"
        in signed_item.assets
    ):

        thumbnail = signed_item.assets[
            "visual"
        ].href

    acquisition_date = None

    if signed_item.datetime:

        acquisition_date = (
            signed_item.datetime.isoformat()
        )

    return {
        "image_found": True,

        "collection":
            signed_item.collection_id,

        "acquisition_date":
            acquisition_date,

        "cloud_cover":
            signed_item.properties.get(
                "eo:cloud_cover"
            ),

        "thumbnail_url":
            thumbnail,

        "item_id":
            signed_item.id
    }


# ============================================================
# FIND BEFORE IMAGE
# ============================================================

def find_before_image(
    latitude: float,
    longitude: float,
    disaster_date: datetime
):

    start_date = (
        disaster_date -
        timedelta(
            days=BEFORE_DAYS
        )
    )

    end_date = (
        disaster_date -
        timedelta(days=1)
    )

    items = search_sentinel_images(
        latitude,
        longitude,
        start_date,
        end_date
    )

    return select_best_image(
        items
    )


# ============================================================
# FIND AFTER IMAGE
# ============================================================

def find_after_image(
    latitude: float,
    longitude: float,
    disaster_date: datetime
):

    start_date = (
        disaster_date +
        timedelta(days=1)
    )

    end_date = (
        disaster_date +
        timedelta(
            days=AFTER_DAYS
        )
    )

    items = search_sentinel_images(
        latitude,
        longitude,
        start_date,
        end_date
    )

    return select_best_image(
        items
    )


# ============================================================
# SAFE WINDOW
# ============================================================

def get_safe_window(
    src,
    bbox
):

    # Sentinel rasters are generally UTM.
    # Our bbox is WGS84.
    #
    # Convert WGS84 bbox -> raster CRS.

    requested_bbox = transform_bounds(
        "EPSG:4326",
        src.crs,
        bbox[0],
        bbox[1],
        bbox[2],
        bbox[3],
        densify_pts=21
    )

    raster_bounds = src.bounds

    left = max(
        requested_bbox[0],
        raster_bounds.left
    )

    bottom = max(
        requested_bbox[1],
        raster_bounds.bottom
    )

    right = min(
        requested_bbox[2],
        raster_bounds.right
    )

    top = min(
        requested_bbox[3],
        raster_bounds.top
    )

    if (
        left >= right
        or bottom >= top
    ):

        raise RuntimeError(
            "Requested area does not overlap "
            "Sentinel-2 raster. "
            f"Raster bounds={raster_bounds}, "
            f"requested={requested_bbox}"
        )

    window = from_bounds(
        left,
        bottom,
        right,
        top,
        src.transform
    )

    # Round safely to integer pixels.

    window = window.round_offsets().round_lengths()

    return window


# ============================================================
# READ BAND
# ============================================================

def read_band(
    item,
    band_name: str,
    bbox,
    target_shape=None
):

    if band_name not in item.assets:

        raise RuntimeError(
            f"Sentinel-2 asset {band_name} "
            f"not available for item "
            f"{item.id}"
        )

    signed_item = planetary_computer.sign(
        item
    )

    href = signed_item.assets[
        band_name
    ].href

    with rasterio.Env(
        PROJ_DATA=PROJ_DIR,
        PROJ_LIB=PROJ_DIR
    ):

        with rasterio.open(
            href
        ) as src:

            window = get_safe_window(
                src,
                bbox
            )

            # --------------------------------------------
            # Determine output size
            # --------------------------------------------

            if target_shape is None:

                out_height = int(
                    window.height
                )

                out_width = int(
                    window.width
                )

            else:

                out_height = int(
                    target_shape[0]
                )

                out_width = int(
                    target_shape[1]
                )

            # --------------------------------------------
            # Read only requested window
            # --------------------------------------------

            data = src.read(
                1,

                window=window,

                out_shape=(
                    out_height,
                    out_width
                ),

                resampling=(
                    Resampling.bilinear
                    if target_shape is not None
                    else Resampling.nearest
                ),

                masked=True
            )

            # --------------------------------------------
            # Convert to float32
            # --------------------------------------------

            data = data.astype(
                np.float32
            )

            # Sentinel-2 L2A scaling.
            data /= 10000.0

            # Convert invalid values to NaN.
            if np.ma.isMaskedArray(data):

                data = data.filled(
                    np.nan
                )

            data = np.asarray(
                data,
                dtype=np.float32
            )

            return data


# ============================================================
# READ ALL REQUIRED BANDS
# ============================================================

def read_required_bands(
    item,
    latitude: float,
    longitude: float,
    radius_km: float
):

    # --------------------------------------------------------
    # PERFORMANCE LIMIT
    # --------------------------------------------------------
    #
    # Do not download/process a 50 km cyclone area.
    # Sentinel-2 analysis is performed on a smaller
    # representative area around the disaster point.
    #

    analysis_radius = min(
        radius_km,
        ANALYSIS_RADIUS_LIMIT_KM
    )

    bbox = get_bbox(
        latitude,
        longitude,
        analysis_radius
    )

    # --------------------------------------------------------
    # Read 10m bands first.
    #
    # B03, B04 and B08 are 10m.
    # --------------------------------------------------------

    red = read_band(
        item,
        "B04",
        bbox
    )

    target_shape = red.shape

    green = read_band(
        item,
        "B03",
        bbox,
        target_shape=target_shape
    )

    nir = read_band(
        item,
        "B08",
        bbox,
        target_shape=target_shape
    )

    # --------------------------------------------------------
    # B11 is 20m.
    #
    # Resample it directly to B04 dimensions.
    # This avoids expensive array alignment later.
    # --------------------------------------------------------

    swir = read_band(
        item,
        "B11",
        bbox,
        target_shape=target_shape
    )

    return {
        "green": green,
        "red": red,
        "nir": nir,
        "swir": swir
    }


# ============================================================
# ALIGN ARRAYS
# ============================================================

def align_arrays(
    arrays
):

    if not arrays:
        return []

    min_rows = min(
        a.shape[0]
        for a in arrays
    )

    min_cols = min(
        a.shape[1]
        for a in arrays
    )

    return [
        a[
            :min_rows,
            :min_cols
        ]
        for a in arrays
    ]


# ============================================================
# NORMALIZED DIFFERENCE
# ============================================================

def normalized_difference(
    a,
    b
):

    denominator = a + b

    result = np.divide(
        a - b,
        denominator,

        out=np.zeros_like(
            a,
            dtype=np.float32
        ),

        where=(
            np.abs(denominator)
            > 1e-6
        )
    )

    return result


# ============================================================
# NDVI
# ============================================================

def calculate_ndvi(
    red,
    nir
):

    return normalized_difference(
        nir,
        red
    )


# ============================================================
# NDWI
# ============================================================

def calculate_ndwi(
    green,
    nir
):

    return normalized_difference(
        green,
        nir
    )


# ============================================================
# NDBI
# ============================================================

def calculate_ndbi(
    nir,
    swir
):

    return normalized_difference(
        swir,
        nir
    )


# ============================================================
# STATISTICS
# ============================================================

def calculate_statistics(
    array
):

    array = np.asarray(
        array,
        dtype=np.float32
    )

    valid = array[
        np.isfinite(array)
    ]

    if valid.size == 0:

        return {
            "mean": None,
            "median": None,
            "min": None,
            "max": None
        }

    return {
        "mean": float(
            np.mean(valid)
        ),

        "median": float(
            np.median(valid)
        ),

        "min": float(
            np.min(valid)
        ),

        "max": float(
            np.max(valid)
        )
    }


# ============================================================
# CHANGE
# ============================================================

def calculate_change(
    before,
    after
):

    before = np.asarray(
        before,
        dtype=np.float32
    )

    after = np.asarray(
        after,
        dtype=np.float32
    )

    before, after = align_arrays(
        [
            before,
            after
        ]
    )

    change = (
        after -
        before
    )

    valid = change[
        np.isfinite(change)
    ]

    if valid.size == 0:

        return {
            "mean_change": None,
            "median_change": None,
            "min_change": None,
            "max_change": None
        }

    return {
        "mean_change": float(
            np.mean(valid)
        ),

        "median_change": float(
            np.median(valid)
        ),

        "min_change": float(
            np.min(valid)
        ),

        "max_change": float(
            np.max(valid)
        )
    }


# ============================================================
# DAMAGE SCORE
# ============================================================

def calculate_damage_score(
    ndvi_change,
    ndwi_change,
    ndbi_change,
    disaster_type
):

    ndvi = float(
        ndvi_change
        if ndvi_change is not None
        else 0
    )

    ndwi = float(
        ndwi_change
        if ndwi_change is not None
        else 0
    )

    ndbi = float(
        ndbi_change
        if ndbi_change is not None
        else 0
    )

    disaster_type = (
        disaster_type or ""
    ).upper()

    # FLOOD

    if disaster_type in [
        "FLOOD",
        "FL"
    ]:

        score = (
            max(0, ndwi) * 150
            +
            max(0, -ndvi) * 100
            +
            max(0, ndbi) * 50
        )

    # CYCLONE

    elif disaster_type in [
        "CYCLONE",
        "TC"
    ]:

        score = (
            max(0, -ndvi) * 100
            +
            max(0, ndwi) * 70
            +
            max(0, ndbi) * 80
        )

    # WILDFIRE

    elif disaster_type in [
        "WILDFIRE",
        "WF"
    ]:

        score = (
            max(0, -ndvi) * 150
            +
            max(0, -ndwi) * 50
            +
            max(0, ndbi) * 50
        )

    # EARTHQUAKE

    elif disaster_type in [
        "EARTHQUAKE",
        "EQ"
    ]:

        score = (
            max(0, -ndvi) * 70
            +
            max(0, ndbi) * 150
            +
            abs(ndwi) * 30
        )

    # DEFAULT

    else:

        score = (
            max(0, -ndvi) * 100
            +
            abs(ndwi) * 50
            +
            max(0, ndbi) * 100
        )

    score = min(
        100,
        max(
            0,
            score
        )
    )

    return round(
        float(score),
        2
    )


# ============================================================
# DAMAGE LEVEL
# ============================================================

def get_damage_level(
    score
):

    if score >= 75:
        return "Extreme"

    if score >= 50:
        return "High"

    if score >= 25:
        return "Moderate"

    if score >= 10:
        return "Low"

    return "Minimal"


# ============================================================
# CHANGE DETECTION
# ============================================================

def perform_change_detection(
    before_item,
    after_item,
    latitude,
    longitude,
    radius_km,
    disaster_type
):

    # --------------------------------------------------------
    # READ BEFORE
    # --------------------------------------------------------

    before = read_required_bands(
        before_item,
        latitude,
        longitude,
        radius_km
    )

    # --------------------------------------------------------
    # READ AFTER
    # --------------------------------------------------------

    after = read_required_bands(
        after_item,
        latitude,
        longitude,
        radius_km
    )

    # --------------------------------------------------------
    # Align before/after
    # --------------------------------------------------------

    arrays = align_arrays(
        [
            before["green"],
            before["red"],
            before["nir"],
            before["swir"],

            after["green"],
            after["red"],
            after["nir"],
            after["swir"]
        ]
    )

    (
        before_green,
        before_red,
        before_nir,
        before_swir,

        after_green,
        after_red,
        after_nir,
        after_swir
    ) = arrays

    # --------------------------------------------------------
    # INDICES
    # --------------------------------------------------------

    ndvi_before = calculate_ndvi(
        before_red,
        before_nir
    )

    ndwi_before = calculate_ndwi(
        before_green,
        before_nir
    )

    ndbi_before = calculate_ndbi(
        before_nir,
        before_swir
    )

    ndvi_after = calculate_ndvi(
        after_red,
        after_nir
    )

    ndwi_after = calculate_ndwi(
        after_green,
        after_nir
    )

    ndbi_after = calculate_ndbi(
        after_nir,
        after_swir
    )

    # --------------------------------------------------------
    # CHANGES
    # --------------------------------------------------------

    ndvi_change = calculate_change(
        ndvi_before,
        ndvi_after
    )

    ndwi_change = calculate_change(
        ndwi_before,
        ndwi_after
    )

    ndbi_change = calculate_change(
        ndbi_before,
        ndbi_after
    )

    # --------------------------------------------------------
    # DAMAGE
    # --------------------------------------------------------

    damage_score = calculate_damage_score(
        ndvi_change["mean_change"],
        ndwi_change["mean_change"],
        ndbi_change["mean_change"],
        disaster_type
    )

    damage_level = get_damage_level(
        damage_score
    )

    return {

        "method":
            "sentinel_2_change_detection",

        "satellite_derived":
            True,

        "indices": {

            "NDVI": {

                "before":
                    calculate_statistics(
                        ndvi_before
                    ),

                "after":
                    calculate_statistics(
                        ndvi_after
                    ),

                "change":
                    ndvi_change
            },

            "NDWI": {

                "before":
                    calculate_statistics(
                        ndwi_before
                    ),

                "after":
                    calculate_statistics(
                        ndwi_after
                    ),

                "change":
                    ndwi_change
            },

            "NDBI": {

                "before":
                    calculate_statistics(
                        ndbi_before
                    ),

                "after":
                    calculate_statistics(
                        ndbi_after
                    ),

                "change":
                    ndbi_change
            }
        },

        "damage_score":
            damage_score,

        "damage_level":
            damage_level,

        "impact_radius_km":
            radius_km
    }


# ============================================================
# MAIN DAMAGE ASSESSMENT
# ============================================================

# ============================================================
# OPTIMIZED SATELLITE SERVICE
# Sentinel-2 / Microsoft Planetary Computer
# ============================================================

import os

# ============================================================
# IMPORTANT:
# Set PROJ paths BEFORE importing rasterio.
#
# PostgreSQL installs another proj.db on Windows.
# That older database was causing:
#
# "DATABASE.LAYOUT.VERSION.MINOR = 2 whereas >= 4 expected"
#
# ============================================================

import pyproj

PROJ_DIR = pyproj.datadir.get_data_dir()

os.environ["PROJ_DATA"] = PROJ_DIR
os.environ["PROJ_LIB"] = PROJ_DIR

# Also remove possible PostgreSQL PROJ override.
for key in [
    "PROJ_DATA",
    "PROJ_LIB",
]:
    os.environ[key] = PROJ_DIR


# ============================================================
# IMPORTS
# ============================================================

from datetime import datetime, timedelta, timezone
from typing import Optional

import numpy as np

from pystac_client import Client
import planetary_computer

import rasterio
from rasterio.windows import from_bounds
from rasterio.warp import transform_bounds
from rasterio.enums import Resampling

from shapely.geometry import Point


# ============================================================
# CONFIGURATION
# ============================================================

CATALOG = "https://planetarycomputer.microsoft.com/api/stac/v1"

COLLECTION = "sentinel-2-l2a"

MAX_CLOUD_COVER = 20.0

BEFORE_DAYS = 60
AFTER_DAYS = 60

# Smaller analysis radius improves performance.
# Your original disaster impact radius is still returned
# separately.
ANALYSIS_RADIUS_LIMIT_KM = 10


# ============================================================
# SENTINEL BANDS
# ============================================================

BAND_ASSETS = {
    "green": "B03",
    "red": "B04",
    "nir": "B08",
    "swir": "B11",
}


# ============================================================
# CATALOG CACHE
# ============================================================

_catalog = None


def get_catalog():
    """
    Return cached Planetary Computer STAC catalog.
    """

    global _catalog

    if _catalog is None:

        _catalog = Client.open(
            CATALOG
        )

    return _catalog


# ============================================================
# IMPACT RADIUS
# ============================================================

def get_impact_radius(
    disaster_type: str,
    severity: float
) -> float:

    disaster_type = (
        disaster_type or ""
    ).upper()

    # Your severity values can be much larger
    # than conventional earthquake magnitude.
    # Therefore clamp safely.

    if disaster_type in [
        "EARTHQUAKE",
        "EQ"
    ]:

        if severity >= 7:
            return 50

        if severity >= 6:
            return 30

        if severity >= 5:
            return 15

        return 5

    if disaster_type in [
        "FLOOD",
        "FL"
    ]:
        return 20

    if disaster_type in [
        "CYCLONE",
        "TC"
    ]:
        return 50

    if disaster_type in [
        "WILDFIRE",
        "WF"
    ]:
        return 15

    if disaster_type in [
        "VOLCANO",
        "VO"
    ]:
        return 10

    return 20


# ============================================================
# IMPACT EXTENT
# ============================================================

def calculate_impact_extent(
    latitude: float,
    longitude: float,
    disaster_type: str,
    severity: float
):

    radius_km = get_impact_radius(
        disaster_type,
        severity
    )

    radius_deg = radius_km / 111.0

    point = Point(
        longitude,
        latitude
    )

    polygon = point.buffer(
        radius_deg
    )

    return {
        "radius_km": radius_km,
        "geometry": polygon.wkt
    }


# ============================================================
# BBOX
# ============================================================

def get_bbox(
    latitude: float,
    longitude: float,
    radius_km: float
):

    lat_radius = radius_km / 111.0

    cos_lat = np.cos(
        np.radians(latitude)
    )

    # Avoid division by zero near poles.
    cos_lat = max(
        float(cos_lat),
        0.01
    )

    lon_radius = (
        radius_km /
        (111.0 * cos_lat)
    )

    return (
        longitude - lon_radius,
        latitude - lat_radius,
        longitude + lon_radius,
        latitude + lat_radius
    )


# ============================================================
# SENTINEL IMAGE SEARCH
# ============================================================

def search_sentinel_images(
    latitude: float,
    longitude: float,
    start_date: datetime,
    end_date: datetime,
    max_cloud_cover: float = MAX_CLOUD_COVER,
    max_items: int = 20
):

    catalog = get_catalog()

    search = catalog.search(

        collections=[
            COLLECTION
        ],

        intersects={
            "type": "Point",
            "coordinates": [
                longitude,
                latitude
            ]
        },

        datetime=(
            f"{start_date.strftime('%Y-%m-%d')}/"
            f"{end_date.strftime('%Y-%m-%d')}"
        ),

        query={
            "eo:cloud_cover": {
                "lte": max_cloud_cover
            }
        },

        max_items=max_items
    )

    return list(
        search.items()
    )


# ============================================================
# BEST IMAGE
# ============================================================

def select_best_image(
    items
):

    if not items:
        return None

    return min(
        items,
        key=lambda item: item.properties.get(
            "eo:cloud_cover",
            100
        )
    )


# ============================================================
# IMAGE METADATA
# ============================================================

def get_image_metadata(
    item
):

    if item is None:

        return {
            "image_found": False,
            "collection": None,
            "acquisition_date": None,
            "cloud_cover": None,
            "thumbnail_url": None,
            "item_id": None
        }

    signed_item = planetary_computer.sign(
        item
    )

    thumbnail = None

    if (
        "rendered_preview"
        in signed_item.assets
    ):

        thumbnail = signed_item.assets[
            "rendered_preview"
        ].href

    elif (
        "visual"
        in signed_item.assets
    ):

        thumbnail = signed_item.assets[
            "visual"
        ].href

    acquisition_date = None

    if signed_item.datetime:

        acquisition_date = (
            signed_item.datetime.isoformat()
        )

    return {
        "image_found": True,

        "collection":
            signed_item.collection_id,

        "acquisition_date":
            acquisition_date,

        "cloud_cover":
            signed_item.properties.get(
                "eo:cloud_cover"
            ),

        "thumbnail_url":
            thumbnail,

        "item_id":
            signed_item.id
    }


# ============================================================
# FIND BEFORE IMAGE
# ============================================================

def find_before_image(
    latitude: float,
    longitude: float,
    disaster_date: datetime
):

    start_date = (
        disaster_date -
        timedelta(
            days=BEFORE_DAYS
        )
    )

    end_date = (
        disaster_date -
        timedelta(days=1)
    )

    items = search_sentinel_images(
        latitude,
        longitude,
        start_date,
        end_date
    )

    return select_best_image(
        items
    )


# ============================================================
# FIND AFTER IMAGE
# ============================================================

def find_after_image(
    latitude: float,
    longitude: float,
    disaster_date: datetime
):

    start_date = (
        disaster_date +
        timedelta(days=1)
    )

    end_date = (
        disaster_date +
        timedelta(
            days=AFTER_DAYS
        )
    )

    items = search_sentinel_images(
        latitude,
        longitude,
        start_date,
        end_date
    )

    return select_best_image(
        items
    )


# ============================================================
# SAFE WINDOW
# ============================================================

def get_safe_window(
    src,
    bbox
):

    # Sentinel rasters are generally UTM.
    # Our bbox is WGS84.
    #
    # Convert WGS84 bbox -> raster CRS.

    requested_bbox = transform_bounds(
        "EPSG:4326",
        src.crs,
        bbox[0],
        bbox[1],
        bbox[2],
        bbox[3],
        densify_pts=21
    )

    raster_bounds = src.bounds

    left = max(
        requested_bbox[0],
        raster_bounds.left
    )

    bottom = max(
        requested_bbox[1],
        raster_bounds.bottom
    )

    right = min(
        requested_bbox[2],
        raster_bounds.right
    )

    top = min(
        requested_bbox[3],
        raster_bounds.top
    )

    if (
        left >= right
        or bottom >= top
    ):

        raise RuntimeError(
            "Requested area does not overlap "
            "Sentinel-2 raster. "
            f"Raster bounds={raster_bounds}, "
            f"requested={requested_bbox}"
        )

    window = from_bounds(
        left,
        bottom,
        right,
        top,
        src.transform
    )

    # Round safely to integer pixels.

    window = window.round_offsets().round_lengths()

    return window


# ============================================================
# READ BAND
# ============================================================

def read_band(
    item,
    band_name: str,
    bbox,
    target_shape=None
):

    if band_name not in item.assets:

        raise RuntimeError(
            f"Sentinel-2 asset {band_name} "
            f"not available for item "
            f"{item.id}"
        )

    signed_item = planetary_computer.sign(
        item
    )

    href = signed_item.assets[
        band_name
    ].href

    with rasterio.Env(
        PROJ_DATA=PROJ_DIR,
        PROJ_LIB=PROJ_DIR
    ):

        with rasterio.open(
            href
        ) as src:

            window = get_safe_window(
                src,
                bbox
            )

            # --------------------------------------------
            # Determine output size
            # --------------------------------------------

            if target_shape is None:

                out_height = int(
                    window.height
                )

                out_width = int(
                    window.width
                )

            else:

                out_height = int(
                    target_shape[0]
                )

                out_width = int(
                    target_shape[1]
                )

            # --------------------------------------------
            # Read only requested window
            # --------------------------------------------

            data = src.read(
                1,

                window=window,

                out_shape=(
                    out_height,
                    out_width
                ),

                resampling=(
                    Resampling.bilinear
                    if target_shape is not None
                    else Resampling.nearest
                ),

                masked=True
            )

            # --------------------------------------------
            # Convert to float32
            # --------------------------------------------

            data = data.astype(
                np.float32
            )

            # Sentinel-2 L2A scaling.
            data /= 10000.0

            # Convert invalid values to NaN.
            if np.ma.isMaskedArray(data):

                data = data.filled(
                    np.nan
                )

            data = np.asarray(
                data,
                dtype=np.float32
            )

            return data


# ============================================================
# READ ALL REQUIRED BANDS
# ============================================================

def read_required_bands(
    item,
    latitude: float,
    longitude: float,
    radius_km: float
):

    # --------------------------------------------------------
    # PERFORMANCE LIMIT
    # --------------------------------------------------------
    #
    # Do not download/process a 50 km cyclone area.
    # Sentinel-2 analysis is performed on a smaller
    # representative area around the disaster point.
    #

    analysis_radius = min(
        radius_km,
        ANALYSIS_RADIUS_LIMIT_KM
    )

    bbox = get_bbox(
        latitude,
        longitude,
        analysis_radius
    )

    # --------------------------------------------------------
    # Read 10m bands first.
    #
    # B03, B04 and B08 are 10m.
    # --------------------------------------------------------

    red = read_band(
        item,
        "B04",
        bbox
    )

    target_shape = red.shape

    green = read_band(
        item,
        "B03",
        bbox,
        target_shape=target_shape
    )

    nir = read_band(
        item,
        "B08",
        bbox,
        target_shape=target_shape
    )

    # --------------------------------------------------------
    # B11 is 20m.
    #
    # Resample it directly to B04 dimensions.
    # This avoids expensive array alignment later.
    # --------------------------------------------------------

    swir = read_band(
        item,
        "B11",
        bbox,
        target_shape=target_shape
    )

    return {
        "green": green,
        "red": red,
        "nir": nir,
        "swir": swir
    }


# ============================================================
# ALIGN ARRAYS
# ============================================================

def align_arrays(
    arrays
):

    if not arrays:
        return []

    min_rows = min(
        a.shape[0]
        for a in arrays
    )

    min_cols = min(
        a.shape[1]
        for a in arrays
    )

    return [
        a[
            :min_rows,
            :min_cols
        ]
        for a in arrays
    ]


# ============================================================
# NORMALIZED DIFFERENCE
# ============================================================

def normalized_difference(
    a,
    b
):

    denominator = a + b

    result = np.divide(
        a - b,
        denominator,

        out=np.zeros_like(
            a,
            dtype=np.float32
        ),

        where=(
            np.abs(denominator)
            > 1e-6
        )
    )

    return result


# ============================================================
# NDVI
# ============================================================

def calculate_ndvi(
    red,
    nir
):

    return normalized_difference(
        nir,
        red
    )


# ============================================================
# NDWI
# ============================================================

def calculate_ndwi(
    green,
    nir
):

    return normalized_difference(
        green,
        nir
    )


# ============================================================
# NDBI
# ============================================================

def calculate_ndbi(
    nir,
    swir
):

    return normalized_difference(
        swir,
        nir
    )


# ============================================================
# STATISTICS
# ============================================================

def calculate_statistics(
    array
):

    array = np.asarray(
        array,
        dtype=np.float32
    )

    valid = array[
        np.isfinite(array)
    ]

    if valid.size == 0:

        return {
            "mean": None,
            "median": None,
            "min": None,
            "max": None
        }

    return {
        "mean": float(
            np.mean(valid)
        ),

        "median": float(
            np.median(valid)
        ),

        "min": float(
            np.min(valid)
        ),

        "max": float(
            np.max(valid)
        )
    }


# ============================================================
# CHANGE
# ============================================================

def calculate_change(
    before,
    after
):

    before = np.asarray(
        before,
        dtype=np.float32
    )

    after = np.asarray(
        after,
        dtype=np.float32
    )

    before, after = align_arrays(
        [
            before,
            after
        ]
    )

    change = (
        after -
        before
    )

    valid = change[
        np.isfinite(change)
    ]

    if valid.size == 0:

        return {
            "mean_change": None,
            "median_change": None,
            "min_change": None,
            "max_change": None
        }

    return {
        "mean_change": float(
            np.mean(valid)
        ),

        "median_change": float(
            np.median(valid)
        ),

        "min_change": float(
            np.min(valid)
        ),

        "max_change": float(
            np.max(valid)
        )
    }


# ============================================================
# DAMAGE SCORE
# ============================================================

def calculate_damage_score(
    ndvi_change,
    ndwi_change,
    ndbi_change,
    disaster_type
):

    ndvi = float(
        ndvi_change
        if ndvi_change is not None
        else 0
    )

    ndwi = float(
        ndwi_change
        if ndwi_change is not None
        else 0
    )

    ndbi = float(
        ndbi_change
        if ndbi_change is not None
        else 0
    )

    disaster_type = (
        disaster_type or ""
    ).upper()

    # FLOOD

    if disaster_type in [
        "FLOOD",
        "FL"
    ]:

        score = (
            max(0, ndwi) * 150
            +
            max(0, -ndvi) * 100
            +
            max(0, ndbi) * 50
        )

    # CYCLONE

    elif disaster_type in [
        "CYCLONE",
        "TC"
    ]:

        score = (
            max(0, -ndvi) * 100
            +
            max(0, ndwi) * 70
            +
            max(0, ndbi) * 80
        )

    # WILDFIRE

    elif disaster_type in [
        "WILDFIRE",
        "WF"
    ]:

        score = (
            max(0, -ndvi) * 150
            +
            max(0, -ndwi) * 50
            +
            max(0, ndbi) * 50
        )

    # EARTHQUAKE

    elif disaster_type in [
        "EARTHQUAKE",
        "EQ"
    ]:

        score = (
            max(0, -ndvi) * 70
            +
            max(0, ndbi) * 150
            +
            abs(ndwi) * 30
        )

    # DEFAULT

    else:

        score = (
            max(0, -ndvi) * 100
            +
            abs(ndwi) * 50
            +
            max(0, ndbi) * 100
        )

    score = min(
        100,
        max(
            0,
            score
        )
    )

    return round(
        float(score),
        2
    )


# ============================================================
# DAMAGE LEVEL
# ============================================================

def get_damage_level(
    score
):

    if score >= 75:
        return "Extreme"

    if score >= 50:
        return "High"

    if score >= 25:
        return "Moderate"

    if score >= 10:
        return "Low"

    return "Minimal"


# ============================================================
# CHANGE DETECTION
# ============================================================

def perform_change_detection(
    before_item,
    after_item,
    latitude,
    longitude,
    radius_km,
    disaster_type
):

    # --------------------------------------------------------
    # READ BEFORE
    # --------------------------------------------------------

    before = read_required_bands(
        before_item,
        latitude,
        longitude,
        radius_km
    )

    # --------------------------------------------------------
    # READ AFTER
    # --------------------------------------------------------

    after = read_required_bands(
        after_item,
        latitude,
        longitude,
        radius_km
    )

    # --------------------------------------------------------
    # Align before/after
    # --------------------------------------------------------

    arrays = align_arrays(
        [
            before["green"],
            before["red"],
            before["nir"],
            before["swir"],

            after["green"],
            after["red"],
            after["nir"],
            after["swir"]
        ]
    )

    (
        before_green,
        before_red,
        before_nir,
        before_swir,

        after_green,
        after_red,
        after_nir,
        after_swir
    ) = arrays

    # --------------------------------------------------------
    # INDICES
    # --------------------------------------------------------

    ndvi_before = calculate_ndvi(
        before_red,
        before_nir
    )

    ndwi_before = calculate_ndwi(
        before_green,
        before_nir
    )

    ndbi_before = calculate_ndbi(
        before_nir,
        before_swir
    )

    ndvi_after = calculate_ndvi(
        after_red,
        after_nir
    )

    ndwi_after = calculate_ndwi(
        after_green,
        after_nir
    )

    ndbi_after = calculate_ndbi(
        after_nir,
        after_swir
    )

    # --------------------------------------------------------
    # CHANGES
    # --------------------------------------------------------

    ndvi_change = calculate_change(
        ndvi_before,
        ndvi_after
    )

    ndwi_change = calculate_change(
        ndwi_before,
        ndwi_after
    )

    ndbi_change = calculate_change(
        ndbi_before,
        ndbi_after
    )

    # --------------------------------------------------------
    # DAMAGE
    # --------------------------------------------------------

    damage_score = calculate_damage_score(
        ndvi_change["mean_change"],
        ndwi_change["mean_change"],
        ndbi_change["mean_change"],
        disaster_type
    )

    damage_level = get_damage_level(
        damage_score
    )

    return {

        "method":
            "sentinel_2_change_detection",

        "satellite_derived":
            True,

        "indices": {

            "NDVI": {

                "before":
                    calculate_statistics(
                        ndvi_before
                    ),

                "after":
                    calculate_statistics(
                        ndvi_after
                    ),

                "change":
                    ndvi_change
            },

            "NDWI": {

                "before":
                    calculate_statistics(
                        ndwi_before
                    ),

                "after":
                    calculate_statistics(
                        ndwi_after
                    ),

                "change":
                    ndwi_change
            },

            "NDBI": {

                "before":
                    calculate_statistics(
                        ndbi_before
                    ),

                "after":
                    calculate_statistics(
                        ndbi_after
                    ),

                "change":
                    ndbi_change
            }
        },

        "damage_score":
            damage_score,

        "damage_level":
            damage_level,

        "impact_radius_km":
            radius_km
    }


# ============================================================
# MAIN DAMAGE ASSESSMENT
# ============================================================

def assess_satellite_damage(
    latitude: float,
    longitude: float,
    disaster_type: str,
    severity: float,
    disaster_date: Optional[datetime] = None
):

    # --------------------------------------------------------
    # IMPACT
    # --------------------------------------------------------

    impact = calculate_impact_extent(
        latitude,
        longitude,
        disaster_type,
        severity
    )

    radius_km = impact[
        "radius_km"
    ]

    # --------------------------------------------------------
    # NO DATE
    # --------------------------------------------------------

    if disaster_date is None:

        now = datetime.now(
            timezone.utc
        )

        start_date = (
            now -
            timedelta(days=180)
        )

        items = search_sentinel_images(
            latitude,
            longitude,
            start_date,
            now
        )

        best_item = select_best_image(
            items
        )

        metadata = get_image_metadata(
            best_item
        )

        return {

            "satellite_available":
                metadata["image_found"],

            "satellite":
                metadata,

            "damage_assessment": {

                "method":
                    "estimated_extent",

                "satellite_derived":
                    False,

                "reason":
                    "Disaster date is not available; "
                    "before/after change detection "
                    "cannot be performed",

                "impact_radius_km":
                    radius_km,

                "geometry":
                    impact["geometry"]
            }
        }

    # --------------------------------------------------------
    # NORMALIZE DATE
    # --------------------------------------------------------

    if disaster_date.tzinfo is None:

        disaster_date = (
            disaster_date.replace(
                tzinfo=timezone.utc
            )
        )

    else:

        disaster_date = (
            disaster_date.astimezone(
                timezone.utc
            )
        )

    # --------------------------------------------------------
    # SEARCH BEFORE
    # --------------------------------------------------------

    before_item = find_before_image(
        latitude,
        longitude,
        disaster_date
    )

    # --------------------------------------------------------
    # SEARCH AFTER
    # --------------------------------------------------------

    after_item = find_after_image(
        latitude,
        longitude,
        disaster_date
    )

    # --------------------------------------------------------
    # BOTH FOUND
    # --------------------------------------------------------

    if (
        before_item is not None
        and
        after_item is not None
    ):

        before_metadata = (
            get_image_metadata(
                before_item
            )
        )

        after_metadata = (
            get_image_metadata(
                after_item
            )
        )

        try:

            detection = (
                perform_change_detection(
                    before_item,
                    after_item,
                    latitude,
                    longitude,
                    radius_km,
                    disaster_type
                )
            )

            return {

                "satellite_available":
                    True,

                "satellite": {

                    "image_found":
                        True,

                    "collection":
                        COLLECTION,

                    "before":
                        before_metadata,

                    "after":
                        after_metadata
                },

                "damage_assessment": {

                    **detection,

                    "before_date":
                        before_metadata[
                            "acquisition_date"
                        ],

                    "after_date":
                        after_metadata[
                            "acquisition_date"
                        ],

                    "geometry":
                        impact["geometry"]
                }
            }

        except Exception as exc:

            return {

                "satellite_available":
                    True,

                "satellite": {

                    "image_found":
                        True,

                    "collection":
                        COLLECTION,

                    "before":
                        before_metadata,

                    "after":
                        after_metadata
                },

                "damage_assessment": {

                    "method":
                        "estimated_extent",

                    "satellite_derived":
                        False,

                    "reason":
                        "Sentinel-2 images were found, "
                        "but raster processing failed",

                    "processing_error":
                        str(exc),

                    "impact_radius_km":
                        radius_km,

                    "geometry":
                        impact["geometry"]
                }
            }

    # --------------------------------------------------------
    # ONE OR ZERO IMAGES
    # --------------------------------------------------------

    before_metadata = (
        get_image_metadata(
            before_item
        )
    )

    after_metadata = (
        get_image_metadata(
            after_item
        )
    )

    return {

        "satellite_available":
            (
                before_item is not None
                or
                after_item is not None
            ),

        "satellite": {

            "image_found":
                (
                    before_item is not None
                    or
                    after_item is not None
                ),

            "collection":
                COLLECTION,

            "before":
                before_metadata,

            "after":
                after_metadata
        },

        "damage_assessment": {

            "method":
                "estimated_extent",

            "satellite_derived":
                False,

            "reason":
                "Suitable before/after "
                "Sentinel-2 images were not found",

            "impact_radius_km":
                radius_km,

            "geometry":
                impact["geometry"]
        }
    }


# ============================================================
# BACKWARD COMPATIBILITY
# ============================================================

def get_satellite_imagery(
    latitude: float,
    longitude: float
):

    now = datetime.now(
        timezone.utc
    )

    start_date = (
        now -
        timedelta(days=180)
    )

    items = search_sentinel_images(
        latitude,
        longitude,
        start_date,
        now
    )

    item = select_best_image(
        items
    )

    return get_image_metadata(
        item
    )

    # --------------------------------------------------------
    # NORMALIZE DATE
    # --------------------------------------------------------

    if disaster_date.tzinfo is None:

        disaster_date = (
            disaster_date.replace(
                tzinfo=timezone.utc
            )
        )

    else:

        disaster_date = (
            disaster_date.astimezone(
                timezone.utc
            )
        )

    # --------------------------------------------------------
    # SEARCH BEFORE
    # --------------------------------------------------------

    before_item = find_before_image(
        latitude,
        longitude,
        disaster_date
    )

    # --------------------------------------------------------
    # SEARCH AFTER
    # --------------------------------------------------------

    after_item = find_after_image(
        latitude,
        longitude,
        disaster_date
    )

    # --------------------------------------------------------
    # BOTH FOUND
    # --------------------------------------------------------

    if (
        before_item is not None
        and
        after_item is not None
    ):

        before_metadata = (
            get_image_metadata(
                before_item
            )
        )

        after_metadata = (
            get_image_metadata(
                after_item
            )
        )

        try:

            detection = (
                perform_change_detection(
                    before_item,
                    after_item,
                    latitude,
                    longitude,
                    radius_km,
                    disaster_type
                )
            )

            return {

                "satellite_available":
                    True,

                "satellite": {

                    "image_found":
                        True,

                    "collection":
                        COLLECTION,

                    "before":
                        before_metadata,

                    "after":
                        after_metadata
                },

                "damage_assessment": {

                    **detection,

                    "before_date":
                        before_metadata[
                            "acquisition_date"
                        ],

                    "after_date":
                        after_metadata[
                            "acquisition_date"
                        ],

                    "geometry":
                        impact["geometry"]
                }
            }

        except Exception as exc:

            return {

                "satellite_available":
                    True,

                "satellite": {

                    "image_found":
                        True,

                    "collection":
                        COLLECTION,

                    "before":
                        before_metadata,

                    "after":
                        after_metadata
                },

                "damage_assessment": {

                    "method":
                        "estimated_extent",

                    "satellite_derived":
                        False,

                    "reason":
                        "Sentinel-2 images were found, "
                        "but raster processing failed",

                    "processing_error":
                        str(exc),

                    "impact_radius_km":
                        radius_km,

                    "geometry":
                        impact["geometry"]
                }
            }

    # --------------------------------------------------------
    # ONE OR ZERO IMAGES
    # --------------------------------------------------------

    before_metadata = (
        get_image_metadata(
            before_item
        )
    )

    after_metadata = (
        get_image_metadata(
            after_item
        )
    )

    return {

        "satellite_available":
            (
                before_item is not None
                or
                after_item is not None
            ),

        "satellite": {

            "image_found":
                (
                    before_item is not None
                    or
                    after_item is not None
                ),

            "collection":
                COLLECTION,

            "before":
                before_metadata,

            "after":
                after_metadata
        },

        "damage_assessment": {

            "method":
                "estimated_extent",

            "satellite_derived":
                False,

            "reason":
                "Suitable before/after "
                "Sentinel-2 images were not found",

            "impact_radius_km":
                radius_km,

            "geometry":
                impact["geometry"]
        }
    }


# ============================================================
# BACKWARD COMPATIBILITY
# ============================================================

def get_satellite_imagery(
    latitude: float,
    longitude: float
):

    now = datetime.now(
        timezone.utc
    )

    start_date = (
        now -
        timedelta(days=180)
    )

    items = search_sentinel_images(
        latitude,
        longitude,
        start_date,
        now
    )

    item = select_best_image(
        items
    )

    return get_image_metadata(
        item
    )