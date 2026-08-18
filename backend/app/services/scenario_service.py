from sqlalchemy.orm import Session

from app.models.zone import Zone
from app.services.demand_prediction_service import (
    predict_zone_demand
)


def simulate_scenario(
    db: Session,
    zone_id: int,
    damage_percent: float,
    response_delay_days: int = 0,
    resource_availability: float = 100
):
    # 1. Get zone

    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id)
        .first()
    )

    if not zone:
        return None

    # 2. Validate inputs

    if damage_percent < 0 or damage_percent > 100:
        raise ValueError(
            "damage_percent must be between 0 and 100"
        )

    if response_delay_days < 0:
        raise ValueError(
            "response_delay_days cannot be negative"
        )

    if resource_availability < 0 or resource_availability > 100:
        raise ValueError(
            "resource_availability must be between 0 and 100"
        )

    # 3. Save original damage

    original_damage = zone.damage_percent

    try:

        # 4. Temporarily change damage

        zone.damage_percent = damage_percent

        db.flush()

        # 5. Run ML prediction

        prediction = predict_zone_demand(
            db,
            zone_id
        )

        if not prediction:
            return None

        predicted_demand = prediction.get(
            "predicted_demand",
            {}
        )

        # 6. Calculate response delay factor

        delay_factor = 1 + (
            response_delay_days * 0.05
        )

        
        # 7. Calculate final scenario demand

        scenario_demand = {}

        for resource, data in predicted_demand.items():

            predicted = data["predicted"]

            lower = data["confidence_interval"]["lower"]

            upper = data["confidence_interval"]["upper"]

            # Increase demand because of delay
            adjusted_predicted = (
                predicted * delay_factor
            )

            adjusted_lower = (
                lower * delay_factor
            )

            adjusted_upper = (
                upper * delay_factor
            )

            # Account for resource availability
            availability_factor = (
                resource_availability / 100
            )

            if availability_factor > 0:

                required_predicted = (
                    adjusted_predicted /
                    availability_factor
                )

                required_lower = (
                    adjusted_lower /
                    availability_factor
                )

                required_upper = (
                    adjusted_upper /
                    availability_factor
                )

            else:

                required_predicted = adjusted_predicted

                required_lower = adjusted_lower

                required_upper = adjusted_upper

            scenario_demand[resource] = {

                "predicted": round(
                    required_predicted,
                    2
                ),

                "confidence_interval": {

                    "lower": round(
                        required_lower,
                        2
                    ),

                    "upper": round(
                        required_upper,
                        2
                    )
                }
            }

        # 8. Return scenario result

        return {

            "scenario": {

                "zone_id": zone.id,

                "zone_name": zone.zone_name,

                "damage_percent":
                    damage_percent,

                "response_delay_days":
                    response_delay_days,

                "delay_factor":
                    round(
                        delay_factor,
                        2
                    ),

                "resource_availability":
                    resource_availability
            },

            "base_prediction":
                predicted_demand,

            "scenario_adjusted_demand":
                scenario_demand,

            "input_data":
                prediction.get(
                    "input_data",
                    {}
                )
        }

    finally:

        # 9. Restore original database value

        zone.damage_percent = original_damage

        db.flush()