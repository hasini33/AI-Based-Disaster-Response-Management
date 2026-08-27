import os
import joblib
import pandas as pd
import json

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

DATA_PATH = "data/synthetic_disaster_dataset.csv"

df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully!")
print(f"Total records: {len(df)}")



#  Input features


features = [
    "severity_score",
    "population",
    "damage_percent",
    "buildings_affected",
    "elderly_percent",
    "children_percent",
    "medically_dependent_percent",
    "affected_population",
    "severity_damage_index",
    "building_damage_ratio",
    "vulnerability_score",
]

X = df[
    features + ["disaster_type"]
]


# 3. Resource targets
targets = [
    "food_packets",
    "water_liters",
    "medical_kits",
    "shelter_capacity",
]



# 4. Preprocessing


categorical_features = ["disaster_type"]

numeric_features = features
preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features,
        ),
        (
            "numeric",
            "passthrough",
            numeric_features,
        ),
    ]
)
# 5. Create model directory
MODEL_DIR = "ml/models"

os.makedirs(MODEL_DIR, exist_ok=True)
model_metrics = {}

# 6. Train models

for target in targets:

    print("\n" + "=" * 50)
    print(f"Training model for: {target}")
    print("=" * 50)

    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    # Fit preprocessing on training data
    X_train_processed = preprocessor.fit_transform(X_train)

    # Apply same preprocessing to test data
    X_test_processed = preprocessor.transform(X_test)

    # Create model
    model = RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        n_jobs=-1,
    )

    # Train model
    model.fit(X_train_processed, y_train)

    # Predict
    predictions = model.predict(X_test_processed)

    # Evaluation
    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = mean_squared_error(
        y_test,
        predictions
    ) ** 0.5

    r2 = r2_score(
        y_test,
        predictions
    )

    model_metrics[target] = {
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
    }

    print(f"MAE  : {mae:.2f}")
    print(f"RMSE : {rmse:.2f}")
    print(f"R²   : {r2:.4f}")

  
    # Save model and preprocessor
    


    model_path = f"{MODEL_DIR}/{target}_model.joblib"

    preprocessor_path = (
        f"{MODEL_DIR}/{target}_preprocessor.joblib"
    )

    joblib.dump(
        model,
        model_path
    )

    joblib.dump(
        preprocessor,
        preprocessor_path
    )

    print(f"Model saved: {model_path}")
    print(
        f"Preprocessor saved: {preprocessor_path}"
    )
with open(
    "ml/models/model_metrics.json",
    "w"
) as f:
    json.dump(
        model_metrics,
        f,
        indent=4
    )

print("\nModel metrics saved successfully!")
print("\nAll models trained and saved successfully!")
