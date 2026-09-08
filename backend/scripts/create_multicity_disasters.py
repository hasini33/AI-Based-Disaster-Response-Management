from datetime import datetime

from app.db.database import SessionLocal
from app.models.zone import Zone
from app.models.disaster import Disaster
from geoalchemy2.elements import WKTElement


# ============================================================
# MULTI-CITY DISASTER DATA
# ============================================================

DISASTERS = [
    {
        "zone_name": "Hyderabad Flood Zone A",
        "disaster_type": "Flood",
        "severity": 88,
        "damage_percent": 62,
        "latitude": 17.385,
        "longitude": 78.486,
    },
    {
        "zone_name": "Hyderabad Flood Zone B",
        "disaster_type": "Flood",
        "severity": 76,
        "damage_percent": 48,
        "latitude": 17.410,
        "longitude": 78.470,
    },

    {
        "zone_name": "Mumbai Flood Zone A",
        "disaster_type": "Flood",
        "severity": 92,
        "damage_percent": 70,
        "latitude": 19.076,
        "longitude": 72.877,
    },
    {
        "zone_name": "Mumbai Flood Zone B",
        "disaster_type": "Flood",
        "severity": 81,
        "damage_percent": 55,
        "latitude": 19.040,
        "longitude": 72.855,
    },

    {
        "zone_name": "Chennai Cyclone Zone A",
        "disaster_type": "Cyclone",
        "severity": 95,
        "damage_percent": 74,
        "latitude": 13.082,
        "longitude": 80.270,
    },
    {
        "zone_name": "Chennai Flood Zone B",
        "disaster_type": "Flood",
        "severity": 84,
        "damage_percent": 58,
        "latitude": 13.050,
        "longitude": 80.250,
    },

    {
        "zone_name": "Bhubaneswar Cyclone Zone A",
        "disaster_type": "Cyclone",
        "severity": 90,
        "damage_percent": 65,
        "latitude": 20.296,
        "longitude": 85.824,
    },
    {
        "zone_name": "Bhubaneswar Cyclone Zone B",
        "disaster_type": "Cyclone",
        "severity": 78,
        "damage_percent": 50,
        "latitude": 20.270,
        "longitude": 85.835,
    },

    {
        "zone_name": "Delhi Earthquake Zone A",
        "disaster_type": "Earthquake",
        "severity": 93,
        "damage_percent": 72,
        "latitude": 28.613,
        "longitude": 77.209,
    },
    {
        "zone_name": "Delhi Earthquake Zone B",
        "disaster_type": "Earthquake",
        "severity": 80,
        "damage_percent": 56,
        "latitude": 28.640,
        "longitude": 77.225,
    },
]


# ============================================================
# CREATE DISASTERS
# ============================================================

def create_multicity_disasters():

    db = SessionLocal()

    created = 0
    skipped = 0

    try:

        print()
        print("MULTI-CITY DISASTER CREATION")
        print("=" * 50)

        for item in DISASTERS:

            # --------------------------------------------
            # FIND ZONE
            # --------------------------------------------

            zone = (
                db.query(Zone)
                .filter(
                    Zone.zone_name
                    == item["zone_name"]
                )
                .first()
            )

            if not zone:

                print(
                    f"SKIPPED: Zone not found -> "
                    f"{item['zone_name']}"
                )

                skipped += 1
                continue

            # --------------------------------------------
            # CHECK EXISTING DISASTER
            # --------------------------------------------

            existing = (
                db.query(Disaster)
                .filter(
                    Disaster.zone_id == zone.id,
                    Disaster.disaster_type
                    == item["disaster_type"]
                )
                .first()
            )

            if existing:

                print(
                    f"SKIPPED: Already exists -> "
                    f"{item['zone_name']}"
                )

                skipped += 1
                continue

            # --------------------------------------------
            # CREATE DISASTER
            # --------------------------------------------

            disaster = Disaster(

                disaster_type=item[
                    "disaster_type"
                ],

                country="India",

                alert_level=(
                    "Critical"
                    if item["severity"] >= 80
                    else "High"
                ),

                severity=item[
                    "severity"
                ],

                latitude=item[
                    "latitude"
                ],

                longitude=item[
                    "longitude"
                ],

                satellite_damage_percent=item[
                    "damage_percent"
                ],

                event_date=datetime.now(),

                zone_id=zone.id,

                location=WKTElement(
                    f"POINT("
                    f"{item['longitude']} "
                    f"{item['latitude']}"
                    f")",
                    srid=4326
                )
            )

            db.add(disaster)

            # --------------------------------------------
            # UPDATE ZONE VALUES
            # --------------------------------------------

            zone.severity_score = item[
                "severity"
            ]

            zone.damage_percent = item[
                "damage_percent"
            ]

            zone.disaster_count = 1

            created += 1

            print(
                f"CREATED: "
                f"{item['zone_name']} | "
                f"{item['disaster_type']} | "
                f"Severity: {item['severity']}"
            )

        # --------------------------------------------
        # COMMIT
        # --------------------------------------------

        db.commit()

        print("=" * 50)
        print(f"Created : {created}")
        print(f"Skipped : {skipped}")
        print("=" * 50)
        print()

    except Exception as e:

        db.rollback()

        print()
        print("ERROR")
        print("=" * 50)
        print(str(e))
        print("=" * 50)

        raise

    finally:

        db.close()


if __name__ == "__main__":
    create_multicity_disasters()