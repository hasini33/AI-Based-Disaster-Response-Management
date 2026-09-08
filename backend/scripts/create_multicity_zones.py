from sqlalchemy.orm import Session
from geoalchemy2.elements import WKTElement

from app.db.database import SessionLocal
from app.models.zone import Zone


# ---------------------------------------------------------
# Helper: create a small square polygon around a location
# ---------------------------------------------------------

def make_polygon(latitude, longitude, size=0.035):
    return (
        f"POLYGON(("
        f"{longitude - size} {latitude - size}, "
        f"{longitude + size} {latitude - size}, "
        f"{longitude + size} {latitude + size}, "
        f"{longitude - size} {latitude + size}, "
        f"{longitude - size} {latitude - size}"
        f"))"
    )


# ---------------------------------------------------------
# Multi-city disaster zones
# ---------------------------------------------------------

CITY_ZONES = [

    # =====================================================
    # HYDERABAD
    # =====================================================

    {
        "zone_name": "Hyderabad Flood Zone A",
        "latitude": 17.385,
        "longitude": 78.486,
        "severity": 88,
        "damage": 62,
        "elderly": 12,
        "children": 18,
        "medical": 8,
    },

    {
        "zone_name": "Hyderabad Flood Zone B",
        "latitude": 17.410,
        "longitude": 78.470,
        "severity": 76,
        "damage": 48,
        "elderly": 10,
        "children": 16,
        "medical": 6,
    },


    # =====================================================
    # MUMBAI
    # =====================================================

    {
        "zone_name": "Mumbai Flood Zone A",
        "latitude": 19.076,
        "longitude": 72.877,
        "severity": 92,
        "damage": 70,
        "elderly": 13,
        "children": 19,
        "medical": 9,
    },

    {
        "zone_name": "Mumbai Flood Zone B",
        "latitude": 19.040,
        "longitude": 72.855,
        "severity": 81,
        "damage": 55,
        "elderly": 11,
        "children": 17,
        "medical": 7,
    },


    # =====================================================
    # CHENNAI
    # =====================================================

    {
        "zone_name": "Chennai Cyclone Zone A",
        "latitude": 13.082,
        "longitude": 80.270,
        "severity": 95,
        "damage": 74,
        "elderly": 14,
        "children": 20,
        "medical": 10,
    },

    {
        "zone_name": "Chennai Flood Zone B",
        "latitude": 13.050,
        "longitude": 80.250,
        "severity": 84,
        "damage": 58,
        "elderly": 12,
        "children": 18,
        "medical": 8,
    },


    # =====================================================
    # BHUBANESWAR
    # =====================================================

    {
        "zone_name": "Bhubaneswar Cyclone Zone A",
        "latitude": 20.296,
        "longitude": 85.824,
        "severity": 90,
        "damage": 65,
        "elderly": 11,
        "children": 19,
        "medical": 8,
    },

    {
        "zone_name": "Bhubaneswar Cyclone Zone B",
        "latitude": 20.270,
        "longitude": 85.835,
        "severity": 78,
        "damage": 50,
        "elderly": 10,
        "children": 17,
        "medical": 6,
    },


    # =====================================================
    # DELHI
    # =====================================================

    {
        "zone_name": "Delhi Earthquake Zone A",
        "latitude": 28.613,
        "longitude": 77.209,
        "severity": 93,
        "damage": 72,
        "elderly": 13,
        "children": 18,
        "medical": 9,
    },

    {
        "zone_name": "Delhi Earthquake Zone B",
        "latitude": 28.640,
        "longitude": 77.225,
        "severity": 80,
        "damage": 56,
        "elderly": 11,
        "children": 16,
        "medical": 7,
    },
]


def create_multicity_zones():

    db: Session = SessionLocal()

    created = []
    skipped = []

    try:

        for data in CITY_ZONES:

            # ---------------------------------------------
            # Prevent duplicates
            # ---------------------------------------------

            existing = (
                db.query(Zone)
                .filter(
                    Zone.zone_name == data["zone_name"]
                )
                .first()
            )

            if existing:

                skipped.append(
                    data["zone_name"]
                )

                continue

            # ---------------------------------------------
            # Create polygon
            # ---------------------------------------------

            polygon = make_polygon(
                data["latitude"],
                data["longitude"]
            )

            zone = Zone(
                zone_name=data["zone_name"],

                geometry=WKTElement(
                    polygon,
                    srid=4326
                ),

                # Initial population estimate.
                # These values can later be replaced by
                # the population raster calculation.
                estimated_population=25000,

                building_count=5000,

                disaster_count=1,

                severity_score=data["severity"],

                damage_percent=data["damage"],

                elderly_percent=data["elderly"],

                children_percent=data["children"],

                medically_dependent_percent=data["medical"],

                priority_override=None
            )

            db.add(zone)

            created.append(
                data["zone_name"]
            )

        db.commit()

        print("\n======================================")
        print("MULTI-CITY ZONE CREATION")
        print("======================================")

        print(
            f"Created zones : {len(created)}"
        )

        print(
            f"Skipped zones : {len(skipped)}"
        )

        if created:

            print("\nCreated:")

            for name in created:
                print(f"  ✓ {name}")

        if skipped:

            print("\nAlready existed:")

            for name in skipped:
                print(f"  - {name}")

        print("\n======================================")

    except Exception as e:

        db.rollback()

        print(
            "\nERROR while creating zones:"
        )

        print(e)

        raise

    finally:

        db.close()


if __name__ == "__main__":
    create_multicity_zones()