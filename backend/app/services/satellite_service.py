# ============================================================
# OPTIMIZED SATELLITE SERVICE
# Sentinel-2 / Microsoft Planetary Computer
# ============================================================

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import numpy as np
import pyproj
from pystac_client import Client
import planetary_computer

# Set PROJ paths BEFORE importing rasterio to handle PostgreSQL environment conflicts
PROJ_DIR = pyproj.datadir.get_data_dir()
os.environ["PROJ_DATA"] = PROJ_DIR
os.environ["PROJ_LIB"] = PROJ_DIR

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
ANALYSIS_RADIUS_LIMIT_KM = 10


# ============================================================
# SENTINEL BANDS & CATALOG CACHE
# ============================================================

BAND_ASSETS = {
    "green": "B03",
    "red": "B04",
    "nir": "B08",
    "swir": "B11",
}

_catalog = None


def get_catalog():
    """Return cached Planetary Computer STAC catalog."""
    global _catalog
    if _catalog is None:
        _catalog = Client.open(CATALOG)
    return _catalog


# ============================================================
# GEOSPATIAL & IMPACT EXTENT HELPERS
# ============================================================

def get_impact_radius(disaster_type: str, severity: float) -> float:
    disaster_type = (disaster_type or "").upper()

    if disaster_type in ["EARTHQUAKE", "EQ"]:
        if severity >= 7:
            return 50.0
        if severity >= 6:
            return 30.0
        if severity >= 5:
            return 15.0
        return 5.0

    if disaster_type in ["FLOOD", "FL"]:
        return 20.0

    if disaster_type in ["CYCLONE", "TC"]:
        return 50.0

    if disaster_type in ["WILDFIRE", "WF"]:
        return 15.0

    if disaster_type in ["VOLCANO", "VO"]:
        return 10.0

    return 20.0


def calculate_impact_extent(latitude: float, longitude: float, disaster_type: str, severity: float):
    radius_km = get_impact_radius(disaster_type, severity)
    radius_deg = radius_km / 111.0
    point = Point(longitude, latitude)
    polygon = point.buffer(radius_deg)

    return {
        "radius_km": radius_km,
        "geometry": polygon.wkt
    }


def get_bbox(latitude: float, longitude: float, radius_km: float):
    lat_radius = radius_km / 111.0
    cos_lat = np.cos(np.radians(latitude))
    cos_lat = max(float(cos_lat), 0.01)  # Avoid division by zero near poles
    lon_radius = radius_km / (111.0 * cos_lat)

    return (
        longitude - lon_radius,
        latitude - lat_radius,
        longitude + lon_radius,
        latitude + lat_radius
    )


# ============================================================
# STAC IMAGE SEARCH & METADATA
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
        collections=[COLLECTION],
        intersects={
            "type": "Point",
            "coordinates": [longitude, latitude]
        },
        datetime=f"{start_date.strftime('%Y-%m-%d')}/{end_date.strftime('%Y-%m-%d')}",
        query={"eo:cloud_cover": {"lte": max_cloud_cover}},
        max_items=max_items
    )
    return list(search.items())


def select_best_image(items):
    if not items:
        return None
    return min(items, key=lambda item: item.properties.get("eo:cloud_cover", 100))


def get_image_metadata(item):
    if item is None:
        return {
            "image_found": False,
            "collection": None,
            "acquisition_date": None,
            "cloud_cover": None,
            "thumbnail_url": None,
            "item_id": None
        }

    signed_item = planetary_computer.sign(item)
    thumbnail = None

    if "rendered_preview" in signed_item.assets:
        thumbnail = signed_item.assets["rendered_preview"].href
    elif "visual" in signed_item.assets:
        thumbnail = signed_item.assets["visual"].href

    acquisition_date = None
    if signed_item.datetime:
        acquisition_date = signed_item.datetime.isoformat()

    return {
        "image_found": True,
        "collection": signed_item.collection_id,
        "acquisition_date": acquisition_date,
        "cloud_cover": signed_item.properties.get("eo:cloud_cover"),
        "thumbnail_url": thumbnail,
        "item_id": signed_item.id
    }


def find_before_image(latitude: float, longitude: float, disaster_date: datetime):
    start_date = disaster_date - timedelta(days=BEFORE_DAYS)
    end_date = disaster_date - timedelta(days=1)
    items = search_sentinel_images(latitude, longitude, start_date, end_date)
    return select_best_image(items)


def find_after_image(latitude: float, longitude: float, disaster_date: datetime):
    start_date = disaster_date + timedelta(days=1)
    end_date = disaster_date + timedelta(days=AFTER_DAYS)
    items = search_sentinel_images(latitude, longitude, start_date, end_date)
    return select_best_image(items)


# ============================================================
# RASTER PROCESSING & BAND READING
# ============================================================

def get_safe_window(src, bbox):
    requested_bbox = transform_bounds(
        "EPSG:4326",
        src.crs,
        bbox[0], bbox[1], bbox[2], bbox[3],
        densify_pts=21
    )
    raster_bounds = src.bounds

    left = max(requested_bbox[0], raster_bounds.left)
    bottom = max(requested_bbox[1], raster_bounds.bottom)
    right = min(requested_bbox[2], raster_bounds.right)
    top = min(requested_bbox[3], raster_bounds.top)

    if left >= right or bottom >= top:
        raise RuntimeError(
            f"Requested area does not overlap Sentinel-2 raster. "
            f"Raster bounds={raster_bounds}, requested={requested_bbox}"
        )

    window = from_bounds(left, bottom, right, top, src.transform)
    return window.round_offsets().round_lengths()


def read_band(item, band_name: str, bbox, target_shape=None):
    if band_name not in item.assets:
        raise RuntimeError(f"Sentinel-2 asset {band_name} not available for item {item.id}")

    signed_item = planetary_computer.sign(item)
    href = signed_item.assets[band_name].href

    with rasterio.Env(PROJ_DATA=PROJ_DIR, PROJ_LIB=PROJ_DIR):
        with rasterio.open(href) as src:
            window = get_safe_window(src, bbox)

            if target_shape is None:
                out_height = int(window.height)
                out_width = int(window.width)
            else:
                out_height = int(target_shape[0])
                out_width = int(target_shape[1])

            data = src.read(
                1,
                window=window,
                out_shape=(out_height, out_width),
                resampling=(
                    Resampling.bilinear if target_shape is not None else Resampling.nearest
                ),
                masked=True
            )

            data = data.astype(np.float32)
            data /= 10000.0  # Sentinel-2 L2A scaling factor

            if np.ma.isMaskedArray(data):
                data = data.filled(np.nan)

            return np.asarray(data, dtype=np.float32)


def read_required_bands(item, latitude: float, longitude: float, radius_km: float):
    analysis_radius = min(radius_km, ANALYSIS_RADIUS_LIMIT_KM)
    bbox = get_bbox(latitude, longitude, analysis_radius)

    red = read_band(item, "B04", bbox)
    target_shape = red.shape

    green = read_band(item, "B03", bbox, target_shape=target_shape)
    nir = read_band(item, "B08", bbox, target_shape=target_shape)
    swir = read_band(item, "B11", bbox, target_shape=target_shape)

    return {
        "green": green,
        "red": red,
        "nir": nir,
        "swir": swir
    }


def align_arrays(arrays):
    if not arrays:
        return []
    min_rows = min(a.shape[0] for a in arrays)
    min_cols = min(a.shape[1] for a in arrays)
    return [a[:min_rows, :min_cols] for a in arrays]


# ============================================================
# SPECTRAL INDICES & METRICS
# ============================================================

def normalized_difference(a, b):
    denominator = a + b
    return np.divide(
        a - b,
        denominator,
        out=np.zeros_like(a, dtype=np.float32),
        where=(np.abs(denominator) > 1e-6)
    )


def calculate_ndvi(red, nir):
    return normalized_difference(nir, red)


def calculate_ndwi(green, nir):
    return normalized_difference(green, nir)


def calculate_ndbi(nir, swir):
    return normalized_difference(swir, nir)


def calculate_statistics(array):
    array = np.asarray(array, dtype=np.float32)
    valid = array[np.isfinite(array)]

    if valid.size == 0:
        return {"mean": None, "median": None, "min": None, "max": None}

    return {
        "mean": float(np.mean(valid)),
        "median": float(np.median(valid)),
        "min": float(np.min(valid)),
        "max": float(np.max(valid))
    }


def calculate_change(before, after):
    before = np.asarray(before, dtype=np.float32)
    after = np.asarray(after, dtype=np.float32)
    before, after = align_arrays([before, after])

    change = after - before
    valid = change[np.isfinite(change)]

    if valid.size == 0:
        return {
            "mean_change": None,
            "median_change": None,
            "min_change": None,
            "max_change": None
        }

    return {
        "mean_change": float(np.mean(valid)),
        "median_change": float(np.median(valid)),
        "min_change": float(np.min(valid)),
        "max_change": float(np.max(valid))
    }


def calculate_damage_score(ndvi_change, ndwi_change, ndbi_change, disaster_type):
    ndvi = float(ndvi_change if ndvi_change is not None else 0)
    ndwi = float(ndwi_change if ndwi_change is not None else 0)
    ndbi = float(ndbi_change if ndbi_change is not None else 0)

    disaster_type = (disaster_type or "").upper()

    if disaster_type in ["FLOOD", "FL"]:
        score = max(0, ndwi) * 150 + max(0, -ndvi) * 100 + max(0, ndbi) * 50
    elif disaster_type in ["CYCLONE", "TC"]:
        score = max(0, -ndvi) * 100 + max(0, ndwi) * 70 + max(0, ndbi) * 80
    elif disaster_type in ["WILDFIRE", "WF"]:
        score = max(0, -ndvi) * 150 + max(0, -ndwi) * 50 + max(0, ndbi) * 50
    elif disaster_type in ["EARTHQUAKE", "EQ"]:
        score = max(0, -ndvi) * 70 + max(0, ndbi) * 150 + abs(ndwi) * 30
    else:
        score = max(0, -ndvi) * 100 + abs(ndwi) * 50 + max(0, ndbi) * 100

    score = min(100, max(0, score))
    return round(float(score), 2)


def get_damage_level(score):
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
# CHANGE DETECTION ANALYSIS
# ============================================================

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
    # READ BEFORE IMAGE BANDS
    # --------------------------------------------------------

    before = read_required_bands(
        before_item,
        latitude,
        longitude,
        radius_km
    )

    # --------------------------------------------------------
    # READ AFTER IMAGE BANDS
    # --------------------------------------------------------

    after = read_required_bands(
        after_item,
        latitude,
        longitude,
        radius_km
    )

    # --------------------------------------------------------
    # ALIGN BEFORE/AFTER ARRAYS
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
    # CALCULATE INDICES - BEFORE
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

    # --------------------------------------------------------
    # CALCULATE INDICES - AFTER
    # --------------------------------------------------------

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
    # CALCULATE CHANGES
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
    # DAMAGE SCORE
    # --------------------------------------------------------

    damage_score = calculate_damage_score(
        ndvi_change["mean_change"],
        ndwi_change["mean_change"],
        ndbi_change["mean_change"],
        disaster_type
    )

    # --------------------------------------------------------
    # DAMAGE LEVEL
    # --------------------------------------------------------

    damage_level = get_damage_level(
        damage_score
    )

    # --------------------------------------------------------
    # DAMAGE PERCENTAGE
    #
    # IMPORTANT:
    # Calculate the percentage of valid pixels where NDVI
    # decreased significantly.
    #
    # This is satellite-derived physical change and should
    # NOT be replaced by disaster severity.
    # --------------------------------------------------------

    ndvi_change_array = (
        ndvi_after -
        ndvi_before
    )

    valid_mask = np.isfinite(
        ndvi_change_array
    )

    if valid_mask.any():

        damaged_pixels = (
            ndvi_change_array[valid_mask] < -0.15
        )

        total_valid_pixels = np.sum(
            valid_mask
        )

        total_damaged_pixels = np.sum(
            damaged_pixels
        )

        if total_valid_pixels > 0:

            damage_percentage = (
                total_damaged_pixels
                /
                total_valid_pixels
            ) * 100

        else:

            damage_percentage = 0.0

        damage_percentage = round(
            float(damage_percentage),
            2
        )

    else:

        damage_percentage = 0.0

    # --------------------------------------------------------
    # RETURN COMPLETE DAMAGE ASSESSMENT
    # --------------------------------------------------------

    return {

        "method":
            "sentinel_2_change_detection",

        "satellite_derived":
            True,

        # ----------------------------------------------------
        # SATELLITE DAMAGE PERCENTAGE
        # ----------------------------------------------------

        "damage_percentage":
            damage_percentage,

        # ----------------------------------------------------
        # SPECTRAL INDICES
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # DAMAGE SCORE
        # ----------------------------------------------------

        "damage_score":
            damage_score,

        # ----------------------------------------------------
        # DAMAGE LEVEL
        # ----------------------------------------------------

        "damage_level":
            damage_level,

        # ----------------------------------------------------
        # IMPACT RADIUS
        # ----------------------------------------------------

        "impact_radius_km":
            radius_km
    }
# ============================================================
# MAIN ASSESSMENT PIPELINE
# ============================================================

def assess_satellite_damage(
    latitude: float,
    longitude: float,
    disaster_type: str,
    severity: float,
    disaster_date: Optional[datetime] = None
):
    impact = calculate_impact_extent(latitude, longitude, disaster_type, severity)
    radius_km = impact["radius_km"]

    # Fallback if no disaster date is passed
    if disaster_date is None:
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=180)
        items = search_sentinel_images(latitude, longitude, start_date, now)
        best_item = select_best_image(items)
        metadata = get_image_metadata(best_item)

        return {
            "satellite_available": metadata["image_found"],
            "satellite": metadata,
            "damage_assessment": {
                "method": "estimated_extent",
                "satellite_derived": False,
                "reason": "Suitable before/after Sentinel-2 images were not found",
                "damage_percentage": 0.0,
                "damage_extent": {
                    "radius_km": radius_km,
                    "geometry": impact["geometry"]
                },
                "damage_score": 0.0,
                "damage_level": "Minimal",
                "impact_radius_km": radius_km,
                "geometry": impact["geometry"]
            }
        }

    # Normalize datetime timezone
    if disaster_date.tzinfo is None:
        disaster_date = disaster_date.replace(tzinfo=timezone.utc)
    else:
        disaster_date = disaster_date.astimezone(timezone.utc)

    before_item = find_before_image(latitude, longitude, disaster_date)
    after_item = find_after_image(latitude, longitude, disaster_date)

    if before_item is not None and after_item is not None:
        before_metadata = get_image_metadata(before_item)
        after_metadata = get_image_metadata(after_item)

        try:
            detection = perform_change_detection(
                before_item,
                after_item,
                latitude,
                longitude,
                radius_km,
                disaster_type
            )

            return {
                "satellite_available": True,
                "satellite": {
                    "image_found": True,
                    "collection": COLLECTION,
                    "before": before_metadata,
                    "after": after_metadata
                },
                "damage_assessment": {
                    **detection,
                    "before_date": before_metadata["acquisition_date"],
                    "after_date": after_metadata["acquisition_date"],
                    "geometry": impact["geometry"]
                }
            }

        except Exception as exc:
            return {
                "satellite_available": True,
                "satellite": {
                    "image_found": True,
                    "collection": COLLECTION,
                    "before": before_metadata,
                    "after": after_metadata
                },
                "damage_assessment": {
                    "method": "estimated_extent",
                    "satellite_derived": False,
                    "reason": "Sentinel-2 images were found, but raster processing failed",
                    "processing_error": str(exc),
                    "damage_percentage": 0.0,
                    "damage_extent": {
                        "radius_km": radius_km,
                        "geometry": impact["geometry"]
                    },
                    "damage_score": 0.0,
                    "damage_level": "Minimal",
                    "impact_radius_km": radius_km,
                    "geometry": impact["geometry"]
                }
            }

    # Handle single or missing images
    before_metadata = get_image_metadata(before_item)
    after_metadata = get_image_metadata(after_item)

    return {
        "satellite_available": (before_item is not None or after_item is not None),
        "satellite": {
            "image_found": (before_item is not None or after_item is not None),
            "collection": COLLECTION,
            "before": before_metadata,
            "after": after_metadata
        },
        "damage_assessment": {
            "method": "estimated_extent",
            "satellite_derived": False,
            "reason": "Suitable before/after Sentinel-2 images were not found",
            "impact_radius_km": radius_km,
            "geometry": impact["geometry"]
        }
    }


# ============================================================
# BACKWARD COMPATIBILITY
# ============================================================

def get_satellite_imagery(latitude: float, longitude: float):
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=180)
    items = search_sentinel_images(latitude, longitude, start_date, now)
    item = select_best_image(items)
    return get_image_metadata(item)