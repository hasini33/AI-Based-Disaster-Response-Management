from sqlalchemy.orm import Session

from app.models.zone import Zone
from app.services.demand_prediction_service import predict_zone_demand


def update_dynamic_demand(
    db: Session,
    zone_id: int,
    damage_percent: float
):
    # Get zone
    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id)
        .first()
    )

    if not zone:
        return None

    # Validate damage percentage
    if damage_percent < 0 or damage_percent > 100:
        raise ValueError(
            "damage_percent must be between 0 and 100"
        )

    # Update current damage
    zone.damage_percent = damage_percent

    db.commit()
    db.refresh(zone)

    # Recalculate demand using updated zone data
    prediction = predict_zone_demand(
        db,
        zone_id
    )

    return {
        "message": "Demand updated successfully",
        "zone_id": zone.id,
        "zone_name": zone.zone_name,
        "damage_percent": damage_percent,
        "updated_demand": prediction
    }