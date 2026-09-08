from app.db.database import SessionLocal
from app.models.resource import Resource


MULTI_CITY_RESOURCES = [
    # --------------------------------------------------
    # Hyderabad
    # --------------------------------------------------
    {
        "resource_name": "Hyderabad Relief Supply",
        "resource_type": "Supply",
        "latitude": 17.380,
        "longitude": 78.480,
        "capacity": 5000,
    },
    {
        "resource_name": "Hyderabad Medical Supply",
        "resource_type": "Medical",
        "latitude": 17.392,
        "longitude": 78.491,
        "capacity": 2000,
    },

    # --------------------------------------------------
    # Mumbai
    # --------------------------------------------------
    {
        "resource_name": "Mumbai Relief Supply",
        "resource_type": "Supply",
        "latitude": 19.076,
        "longitude": 72.877,
        "capacity": 5000,
    },
    {
        "resource_name": "Mumbai Medical Supply",
        "resource_type": "Medical",
        "latitude": 19.055,
        "longitude": 72.865,
        "capacity": 2000,
    },

    # --------------------------------------------------
    # Chennai
    # --------------------------------------------------
    {
        "resource_name": "Chennai Relief Supply",
        "resource_type": "Supply",
        "latitude": 13.082,
        "longitude": 80.270,
        "capacity": 5000,
    },
    {
        "resource_name": "Chennai Medical Supply",
        "resource_type": "Medical",
        "latitude": 13.060,
        "longitude": 80.250,
        "capacity": 2000,
    },

    # --------------------------------------------------
    # Bhubaneswar
    # --------------------------------------------------
    {
        "resource_name": "Bhubaneswar Relief Supply",
        "resource_type": "Supply",
        "latitude": 20.296,
        "longitude": 85.824,
        "capacity": 5000,
    },
    {
        "resource_name": "Bhubaneswar Medical Supply",
        "resource_type": "Medical",
        "latitude": 20.280,
        "longitude": 85.835,
        "capacity": 2000,
    },

    # --------------------------------------------------
    # Delhi
    # --------------------------------------------------
    {
        "resource_name": "Delhi Relief Supply",
        "resource_type": "Supply",
        "latitude": 28.613,
        "longitude": 77.209,
        "capacity": 5000,
    },
    {
        "resource_name": "Delhi Medical Supply",
        "resource_type": "Medical",
        "latitude": 28.625,
        "longitude": 77.220,
        "capacity": 2000,
    },
]


def create_multicity_resources():
    db = SessionLocal()

    created = []
    skipped = []

    try:
        for data in MULTI_CITY_RESOURCES:

            existing = (
                db.query(Resource)
                .filter(
                    Resource.resource_name
                    == data["resource_name"]
                )
                .first()
            )

            if existing:
                skipped.append(data["resource_name"])
                continue

            resource = Resource(
                resource_name=data["resource_name"],
                resource_type=data["resource_type"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                capacity=data["capacity"],
                status="Available",
            )

            db.add(resource)
            created.append(data["resource_name"])

        db.commit()

        print("\n======================================")
        print("MULTI-CITY RESOURCES")
        print("======================================")
        print(f"Created : {len(created)}")
        print(f"Skipped : {len(skipped)}")
        print(f"Total   : {len(MULTI_CITY_RESOURCES)}")
        print("======================================")

        if created:
            print("\nCreated resources:")
            for name in created:
                print(f"  + {name}")

        if skipped:
            print("\nAlready existing:")
            for name in skipped:
                print(f"  - {name}")

    except Exception as e:
        db.rollback()
        print("\nERROR:", e)
        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_multicity_resources()