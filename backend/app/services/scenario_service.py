
from sqlalchemy.orm import Session

from app.models.zone import Zone
from app.services.demand_prediction_service import (
    predict_zone_demand
)


def simulate_scenario(
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

    # Save original value
    original_damage = zone.damage_percent

    try:
        # Temporarily change damage
        zone.damage_percent = damage_percent

        # Flush so prediction can use updated value
        db.flush()

        # Run ML prediction
        prediction = predict_zone_demand(
            db,
            zone_id
        )

        return {
            "scenario": {
                "zone_id": zone.id,
                "zone_name": zone.zone_name,
                "damage_percent": damage_percent
            },
            "predicted_demand": (
                prediction.get(
                    "predicted_demand",
                    {}
                )
                if prediction
                else {}
            ),
            "input_data": (
                prediction.get(
                    "input_data",
                    {}
                )
                if prediction
                else {}
            )
        }

    finally:
        # Restore original database value
        zone.damage_percent = original_damage
        db.flush()