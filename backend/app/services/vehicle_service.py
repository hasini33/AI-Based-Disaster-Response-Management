from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle


# ---------------------------------------------------------
# Multi-city emergency response vehicles
# ---------------------------------------------------------

CITY_VEHICLES = [

    # =====================================================
    # HYDERABAD
    # =====================================================

    {
        "vehicle_name": "Hyderabad Relief Truck 1",
        "vehicle_type": "Truck",
        "capacity": 3000,
        "latitude": 17.380,
        "longitude": 78.480,
    },

    {
        "vehicle_name": "Hyderabad Medical Vehicle",
        "vehicle_type": "Medical",
        "capacity": 1000,
        "latitude": 17.392,
        "longitude": 78.491,
    },


    # =====================================================
    # MUMBAI
    # =====================================================

    {
        "vehicle_name": "Mumbai Relief Truck 1",
        "vehicle_type": "Truck",
        "capacity": 3000,
        "latitude": 19.076,
        "longitude": 72.877,
    },

    {
        "vehicle_name": "Mumbai Emergency Vehicle",
        "vehicle_type": "Emergency",
        "capacity": 1500,
        "latitude": 19.055,
        "longitude": 72.865,
    },


    # =====================================================
    # CHENNAI
    # =====================================================

    {
        "vehicle_name": "Chennai Relief Truck 1",
        "vehicle_type": "Truck",
        "capacity": 3000,
        "latitude": 13.082,
        "longitude": 80.270,
    },

    {
        "vehicle_name": "Chennai Medical Vehicle",
        "vehicle_type": "Medical",
        "capacity": 1000,
        "latitude": 13.060,
        "longitude": 80.250,
    },


    # =====================================================
    # BHUBANESWAR
    # =====================================================

    {
        "vehicle_name": "Bhubaneswar Relief Truck",
        "vehicle_type": "Truck",
        "capacity": 3000,
        "latitude": 20.296,
        "longitude": 85.824,
    },

    {
        "vehicle_name": "Bhubaneswar Emergency Vehicle",
        "vehicle_type": "Emergency",
        "capacity": 1500,
        "latitude": 20.280,
        "longitude": 85.835,
    },


    # =====================================================
    # DELHI
    # =====================================================

    {
        "vehicle_name": "Delhi Relief Truck",
        "vehicle_type": "Truck",
        "capacity": 3000,
        "latitude": 28.613,
        "longitude": 77.209,
    },

    {
        "vehicle_name": "Delhi Medical Vehicle",
        "vehicle_type": "Medical",
        "capacity": 1000,
        "latitude": 28.625,
        "longitude": 77.220,
    },
]


def create_sample_vehicles(db: Session):

    created = []
    skipped = []

    for data in CITY_VEHICLES:

        # -------------------------------------------------
        # Don't duplicate vehicles
        # -------------------------------------------------

        existing = (
            db.query(Vehicle)
            .filter(
                Vehicle.vehicle_name
                == data["vehicle_name"]
            )
            .first()
        )

        if existing:

            skipped.append(
                data["vehicle_name"]
            )

            continue

        # -------------------------------------------------
        # Create vehicle
        # -------------------------------------------------

        vehicle = Vehicle(
            vehicle_name=data["vehicle_name"],
            vehicle_type=data["vehicle_type"],
            capacity=data["capacity"],
            status="Available",
            latitude=data["latitude"],
            longitude=data["longitude"],
        )

        db.add(vehicle)

        created.append(
            data["vehicle_name"]
        )

    # -----------------------------------------------------
    # Save
    # -----------------------------------------------------

    if created:
        db.commit()

    total = db.query(Vehicle).count()

    return {
        "message": "Multi-city vehicles created",
        "created": len(created),
        "skipped": len(skipped),
        "total": total,
        "vehicles": created,
    }