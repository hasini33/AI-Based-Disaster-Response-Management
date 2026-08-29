from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle


def create_sample_vehicles(db: Session):

    existing = db.query(Vehicle).count()

    if existing > 0:
        return {
            "message": "Vehicles already exist",
            "count": existing
        }

    vehicles = [
        Vehicle(
            vehicle_name="Relief Truck 1",
            vehicle_type="Truck",
            capacity=3000,
            status="Available",
            latitude=17.38,
            longitude=78.48
        ),

        Vehicle(
            vehicle_name="Relief Truck 2",
            vehicle_type="Truck",
            capacity=2000,
            status="Available",
            latitude=17.325,
            longitude=78.425
        ),

        Vehicle(
            vehicle_name="Medical Vehicle 1",
            vehicle_type="Medical",
            capacity=1000,
            status="Available",
            latitude=17.325,
            longitude=78.525
        ),

        Vehicle(
            vehicle_name="Emergency Vehicle 1",
            vehicle_type="Emergency",
            capacity=1500,
            status="Available",
            latitude=17.392,
            longitude=78.491
        )
    ]

    db.add_all(vehicles)
    db.commit()

    return {
        "message": "Sample vehicles created",
        "count": len(vehicles)
    }