import os
import joblib
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.zone import Zone
from app.models.disaster import Disaster


MODEL_DIR = "ml/models"


TARGETS = [
    "food_packets",
    "water_liters",
    "medical_kits",
    "shelter_capacity",
]


def calculate_vulnerability_score(zone: Zone):

    elderly = float(zone.elderly_percent or 0)
    children = float(zone.children_percent or 0)
    medically_dependent = float(
        zone.medically_dependent_percent or 0
    )

    score = (
        0.4 * elderly
        + 0.3 * children
        + 0.3 * medically_dependent
    )

    return round(
        min(max(score, 0), 100),
        2
    )


def predict_zone_demand(
    db: Session,
    zone_id: int
):

    # --------------------------------------------------
    # 1. Get zone
    # --------------------------------------------------

    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id)
        .first()
    )

    if not zone:
        return None


    # --------------------------------------------------
    # 2. Get latest disaster in this zone
    # --------------------------------------------------

    disaster = (
        db.query(Disaster)
        .filter(Disaster.zone_id == zone_id)
        .order_by(Disaster.id.desc())
        .first()
    )

    if not disaster:
        return {
            "zone_id": zone.id,
            "zone_name": zone.zone_name,
            "message": "No disaster assigned to this zone"
        }


    # 3. Zone values

    population = float(
        zone.estimated_population or 0
    )

    buildings = float(
        zone.building_count or 0
    )

    severity_score = float(
        zone.severity_score or 0
    )

    damage_percent = float(
        zone.damage_percent or 0
    )


    # --------------------------------------------------
    # 4. Vulnerability
    # --------------------------------------------------

    vulnerability_score = calculate_vulnerability_score(
        zone
    )


    # --------------------------------------------------
    # 5. Derived ML features
    # --------------------------------------------------

    affected_population = (
        population * damage_percent / 100
    )

    severity_damage_index = (
        severity_score * damage_percent
    )

    if buildings > 0:
        building_damage_ratio = (
            damage_percent / 100
        )
    else:
        building_damage_ratio = 0


    # 6. Prepare ML input
  

    input_data = pd.DataFrame([{

        "severity_score": severity_score,

        "population": population,

        "damage_percent": damage_percent,

        "buildings_affected": buildings,

        "elderly_percent":
            float(zone.elderly_percent or 0),

        "children_percent":
            float(zone.children_percent or 0),

        "medically_dependent_percent":
            float(
                zone.medically_dependent_percent or 0
            ),

        "affected_population":
            affected_population,

        "severity_damage_index":
            severity_damage_index,

        "building_damage_ratio":
            building_damage_ratio,

        "vulnerability_score":
            vulnerability_score,

        "disaster_type":
            disaster.disaster_type

    }])


    # 7. Predict resources
    

    predictions = {}

    for target in TARGETS:

        model_path = os.path.join(
            MODEL_DIR,
            f"{target}_model.joblib"
        )

        preprocessor_path = os.path.join(
            MODEL_DIR,
            f"{target}_preprocessor.joblib"
        )

        model = joblib.load(model_path)
        preprocessor = joblib.load(
            preprocessor_path
        )

        processed_data = preprocessor.transform(
            input_data
        )

        tree_predictions = []

        for estimator in model.estimators_:
            tree_prediction = estimator.predict(
                processed_data
            )[0]

            tree_predictions.append(
                float(tree_prediction)
            )

        prediction = float(
            sum(tree_predictions) /
            len(tree_predictions)
        )

 

        std_prediction = float(
            np.std(tree_predictions)
        )

        lower_bound = max(
            prediction - 1.96 * std_prediction,
            0
        )

        upper_bound = max(
            prediction + 1.96 * std_prediction,
            0
        )

        predictions[target] = {
            "predicted": round(
                prediction,
                2
            ),
            "confidence_interval": {
                "lower": round(
                    lower_bound,
                    2
                ),
                "upper": round(
                    upper_bound,
                    2
                )
            }
        }
    # 8. Return result
    # 

    return {

        "zone_id": zone.id,

        "zone_name": zone.zone_name,

        "disaster_id": disaster.id,

        "disaster_type":
            disaster.disaster_type,

        "input_data": {

            "severity_score":
                severity_score,

            "population":
                population,

            "damage_percent":
                damage_percent,

            "buildings_affected":
                buildings,

            "elderly_percent":
                float(
                    zone.elderly_percent or 0
                ),

            "children_percent":
                float(
                    zone.children_percent or 0
                ),

            "medically_dependent_percent":
                float(
                    zone.medically_dependent_percent or 0
                ),

            "affected_population":
                round(
                    affected_population,
                    2
                ),

            "severity_damage_index":
                round(
                    severity_damage_index,
                    2
                ),

            "building_damage_ratio":
                round(
                    building_damage_ratio,
                    4
                ),

            "vulnerability_score":
                vulnerability_score
        },

        "predicted_demand":
            predictions
    }