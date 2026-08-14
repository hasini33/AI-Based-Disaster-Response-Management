import joblib
import pandas as pd

from ml.vulnerability import (
    calculate_vulnerability_score,
    get_vulnerability_weight,
    adjust_resource_demand,
)


MODEL_DIR = "ml/models"

resources = [
    "food_packets",
    "water_liters",
    "medical_kits",
    "shelter_capacity",
]

models = {}
preprocessors = {}

for resource in resources:

    models[resource] = joblib.load(
        f"{MODEL_DIR}/{resource}_model.joblib"
    )

    preprocessors[resource] = joblib.load(
        f"{MODEL_DIR}/{resource}_preprocessor.joblib"
    )


def predict_demand(
    disaster_type,
    severity_score,
    population,
    damage_percent,
    buildings_affected,
    elderly_percent,
    children_percent,
    medically_dependent_percent,
):

    # -----------------------------------------------
    # Feature engineering
    # -----------------------------------------------

    affected_population = (
        population * damage_percent / 100
    )

    severity_damage_index = (
        severity_score * damage_percent / 100
    )

    building_damage_ratio = (
        buildings_affected / population
        if population > 0
        else 0
    )

    vulnerability_score = (
        elderly_percent
        + children_percent
        + medically_dependent_percent
    )

    input_data = pd.DataFrame([
        {
            "severity_score": severity_score,
            "population": population,
            "damage_percent": damage_percent,
            "buildings_affected": buildings_affected,
            "elderly_percent": elderly_percent,
            "children_percent": children_percent,
            "medically_dependent_percent": medically_dependent_percent,
            "affected_population": affected_population,
            "severity_damage_index": severity_damage_index,
            "building_damage_ratio": building_damage_ratio,
            "vulnerability_score": vulnerability_score,
            "disaster_type": disaster_type,
        }
    ])

    # -----------------------------------------------
    # ML predictions
    # -----------------------------------------------

    base_predictions = {}

    for resource in resources:

        preprocessor = preprocessors[resource]
        model = models[resource]

        processed_data = preprocessor.transform(
            input_data
        )

        prediction = model.predict(
            processed_data
        )[0]

        prediction = max(0, prediction)

        base_predictions[resource] = round(
            float(prediction),
            2
        )

    # -----------------------------------------------
    # Vulnerability adjustment
    # -----------------------------------------------

    vulnerability_score = calculate_vulnerability_score(
        elderly_percent,
        children_percent,
        medically_dependent_percent,
    )

    vulnerability_weight = get_vulnerability_weight(
        vulnerability_score
    )

    adjusted_predictions = adjust_resource_demand(
        base_predictions,
        vulnerability_weight,
    )

    return {
        "base_demand": base_predictions,
        "vulnerability_score": vulnerability_score,
        "vulnerability_weight": vulnerability_weight,
        "adjusted_demand": adjusted_predictions,
    }


# ---------------------------------------------------
# Test
# ---------------------------------------------------

if __name__ == "__main__":

    result = predict_demand(
        disaster_type="Flood",
        severity_score=75,
        population=8000,
        damage_percent=60,
        buildings_affected=350,
        elderly_percent=18,
        children_percent=25,
        medically_dependent_percent=6,
    )

    print("\nBASE ML DEMAND")
    print("-------------------------")

    for resource, value in result["base_demand"].items():
        print(f"{resource}: {value}")

    print("\nVULNERABILITY")
    print("-------------------------")
    print(
        f"Score: {result['vulnerability_score']}"
    )
    print(
        f"Weight: {result['vulnerability_weight']}"
    )

    print("\nADJUSTED DEMAND")
    print("-------------------------")

    for resource, value in result["adjusted_demand"].items():
        print(f"{resource}: {value}")