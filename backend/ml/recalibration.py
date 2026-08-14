import os
from datetime import datetime

import pandas as pd

from ml.predict_demand import predict_demand


HISTORY_FILE = "data/demand_prediction_history.csv"


def save_prediction_history(
    zone_id,
    source,
    input_data,
    prediction_result,
):
    """
    Save a prediction to the prediction history CSV.
    """

    record = {
        "timestamp": datetime.now().isoformat(),
        "zone_id": zone_id,
        "source": source,

        "disaster_type": input_data["disaster_type"],
        "severity_score": input_data["severity_score"],
        "population": input_data["population"],
        "damage_percent": input_data["damage_percent"],
        "buildings_affected": input_data["buildings_affected"],

        "elderly_percent": input_data["elderly_percent"],
        "children_percent": input_data["children_percent"],
        "medically_dependent_percent": input_data[
            "medically_dependent_percent"
        ],

        "food_packets": prediction_result[
            "adjusted_demand"
        ]["food_packets"],

        "water_liters": prediction_result[
            "adjusted_demand"
        ]["water_liters"],

        "medical_kits": prediction_result[
            "adjusted_demand"
        ]["medical_kits"],

        "shelter_capacity": prediction_result[
            "adjusted_demand"
        ]["shelter_capacity"],

        "vulnerability_score": prediction_result[
            "vulnerability_score"
        ],

        "vulnerability_weight": prediction_result[
            "vulnerability_weight"
        ],
    }

    new_record = pd.DataFrame([record])

    if os.path.exists(HISTORY_FILE):

        existing_data = pd.read_csv(
            HISTORY_FILE
        )

        updated_data = pd.concat(
            [existing_data, new_record],
            ignore_index=True,
        )

    else:

        updated_data = new_record

    updated_data.to_csv(
        HISTORY_FILE,
        index=False,
    )


def recalibrate_demand(
    zone_id,
    source,
    disaster_type,
    severity_score,
    population,
    damage_percent,
    buildings_affected,
    elderly_percent,
    children_percent,
    medically_dependent_percent,
):
    """
    Recalculate resource demand using
    the latest disaster information.
    """

    input_data = {
        "disaster_type": disaster_type,
        "severity_score": severity_score,
        "population": population,
        "damage_percent": damage_percent,
        "buildings_affected": buildings_affected,
        "elderly_percent": elderly_percent,
        "children_percent": children_percent,
        "medically_dependent_percent": (
            medically_dependent_percent
        ),
    }

    # Run the complete prediction pipeline
    prediction_result = predict_demand(
        disaster_type=disaster_type,
        severity_score=severity_score,
        population=population,
        damage_percent=damage_percent,
        buildings_affected=buildings_affected,
        elderly_percent=elderly_percent,
        children_percent=children_percent,
        medically_dependent_percent=(
            medically_dependent_percent
        ),
    )

    # Save prediction history
    save_prediction_history(
        zone_id=zone_id,
        source=source,
        input_data=input_data,
        prediction_result=prediction_result,
    )

    return prediction_result


# ---------------------------------------------------
# Test dynamic recalibration
# ---------------------------------------------------

if __name__ == "__main__":

    print("\nINITIAL PREDICTION")
    print("============================")

    initial_result = recalibrate_demand(
        zone_id=7,
        source="initial_assessment",
        disaster_type="Flood",
        severity_score=75,
        population=8000,
        damage_percent=60,
        buildings_affected=350,
        elderly_percent=18,
        children_percent=25,
        medically_dependent_percent=6,
    )

    print(initial_result)


    print("\nUPDATED PREDICTION")
    print("============================")

    updated_result = recalibrate_demand(
        zone_id=7,
        source="field_report",
        disaster_type="Flood",
        severity_score=80,
        population=8000,
        damage_percent=75,
        buildings_affected=500,
        elderly_percent=18,
        children_percent=25,
        medically_dependent_percent=6,
    )

    print(updated_result)


    print("\nPrediction history saved to:")
    print(HISTORY_FILE)