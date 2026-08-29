from sqlalchemy.orm import Session

from app.models.zone import Zone
from app.services.demand_prediction_service import predict_zone_demand
from app.services.zone_severity_service import update_zone_severity


def update_dynamic_demand(
    db: Session,
    zone_id: int,
    damage_percent: float
):

    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id)
        .first()
    )

    if not zone:
        return None

    if damage_percent < 0 or damage_percent > 100:
        raise ValueError(
            "damage_percent must be between 0 and 100"
        )

    # --------------------------------------------------------
    # This endpoint is now treated as a temporary
    # scenario/demand calculation.
    #
    # Do NOT permanently save damage_percent.
    # --------------------------------------------------------

    original_damage = zone.damage_percent

    try:

        zone.damage_percent = damage_percent

        db.flush()

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

    finally:

        zone.damage_percent = original_damage

        db.flush()