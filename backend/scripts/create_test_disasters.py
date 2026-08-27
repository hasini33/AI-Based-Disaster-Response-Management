from app.db.database import SessionLocal
from app.models.disaster import Disaster
from geoalchemy2.elements import WKTElement


db = SessionLocal()

test_disasters = [
    {
        "disaster_type": "Earthquake",
        "country": "India",
        "severity": 6.0,
        "latitude": 17.375,
        "longitude": 78.425,
    },
    {
        "disaster_type": "Flood",
        "country": "India",
        "severity": 70.0,
        "latitude": 17.325,
        "longitude": 78.525,
    },
    {
        "disaster_type": "Cyclone",
        "country": "India",
        "severity": 80.0,
        "latitude": 17.375,
        "longitude": 78.525,
    },
]


try:
    for data in test_disasters:

        disaster = Disaster(
            disaster_type=data["disaster_type"],
            country=data["country"],
            severity=data["severity"],
            latitude=data["latitude"],
            longitude=data["longitude"],
            location=WKTElement(
                f'POINT({data["longitude"]} {data["latitude"]})',
                srid=4326
            )
        )

        db.add(disaster)
        db.commit()
        db.refresh(disaster)

        print(
            f"Created Disaster {disaster.id}: "
            f"{disaster.disaster_type} "
            f"at ({disaster.latitude}, {disaster.longitude})"
        )

finally:
    db.close()