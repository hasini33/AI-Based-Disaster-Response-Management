from sqlalchemy.orm import Session

from app.models.resource import Resource
from app.services.demand_prediction_service import (
    predict_zone_demand
)


RESOURCE_MAP = {
    "food_packets": "Food",
    "water_liters": "Water",
    "medical_kits": "medical_kits",
    "shelter_capacity": "Shelter",
}


def allocate_resources(
    db: Session,
    zone_id: int
):
    """
    Calculate current resource availability.

    READ-ONLY:
    This function does NOT deduct inventory.
    Inventory is deducted only when allocation
    is approved.
    """

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
                data.get("predicted", 0)
            )
        else:
            required = float(data)

        resource_type = RESOURCE_MAP.get(resource)

        if not resource_type:
            continue

        # Case-insensitive matching for both
        # resource type and availability status.
        resources = (
            db.query(Resource)
            .filter(
                Resource.resource_type.ilike(
                    resource_type
                ),
                Resource.status.ilike(
                    "Available"
                )
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

    return {
        "zone_id": prediction["zone_id"],
        "zone_name": prediction["zone_name"],
        "disaster_id": prediction["disaster_id"],
        "allocation": allocation
    }