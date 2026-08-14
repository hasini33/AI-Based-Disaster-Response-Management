from sqlalchemy.orm import Session

from app.models.resource import Resource
from app.services.demand_prediction_service import (
    predict_zone_demand
)


RESOURCE_MAP = {
    "food_packets": "Food",
    "water_liters": "Water",
    "medical_kits": "Medical",
    "shelter_capacity": "Shelter",
}


def allocate_resources(
    db: Session,
    zone_id: int
):

    prediction = predict_zone_demand(
        db,
        zone_id
    )

    if not prediction:
        return None

    if "predicted_demand" not in prediction:
        return prediction

    demand = prediction["predicted_demand"]

    allocation = {}

    for resource, data in demand.items():

        if isinstance(data, dict):
            required = float(
                data["predicted"]
            )
        else:
            required = float(data)

        resource_type = RESOURCE_MAP.get(
            resource
        )

        resources = (
            db.query(Resource)
            .filter(
                Resource.resource_type
                == resource_type,
                Resource.status
                == "Available"
            )
            .all()
        )

        total_available = sum(
            float(r.capacity or 0)
            for r in resources
        )

        allocated = min(
            required,
            total_available
        )

        shortage = max(
            required - total_available,
            0
        )

        # Deduct allocated amount
        remaining = allocated

        for r in resources:

            if remaining <= 0:
                break

            stock = float(
                r.capacity or 0
            )

            deduction = min(
                stock,
                remaining
            )

            r.capacity = int(
                stock - deduction
            )

            remaining -= deduction

        allocation[resource] = {
            "required": round(
                required,
                2
            ),
            "available": round(
                total_available,
                2
            ),
            "allocated": round(
                allocated,
                2
            ),
            "shortage": round(
                shortage,
                2
            )
        }

    db.commit()

    return {
        "zone_id": prediction["zone_id"],
        "zone_name": prediction["zone_name"],
        "disaster_id": prediction["disaster_id"],
        "allocation": allocation
    }