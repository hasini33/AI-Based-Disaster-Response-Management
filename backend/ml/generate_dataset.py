import numpy as np
import pandas as pd


# Number of synthetic historical records
NUM_RECORDS = 1000

# For reproducible results
np.random.seed(42)


# ---------------------------------------------------
# 1. Basic disaster information
# ---------------------------------------------------

disaster_ids = [f"D{i:04d}" for i in range(1, NUM_RECORDS + 1)]

zone_ids = np.random.randint(1, 21, NUM_RECORDS)

disaster_types = np.random.choice(
    ["Flood", "Earthquake", "Cyclone", "Landslide"],
    NUM_RECORDS
)


# ---------------------------------------------------
# 2. Disaster severity and damage
# ---------------------------------------------------

severity_score = np.random.uniform(10, 100, NUM_RECORDS)

damage_percent = (
    severity_score * 0.75
    + np.random.normal(0, 10, NUM_RECORDS)
)

damage_percent = np.clip(damage_percent, 5, 100)


# ---------------------------------------------------
# 3. Population and buildings
# ---------------------------------------------------

population = np.random.randint(500, 15000, NUM_RECORDS)

buildings_affected = (
    population * np.random.uniform(0.03, 0.12, NUM_RECORDS)
    * (damage_percent / 100)
)

buildings_affected = np.maximum(
    buildings_affected.astype(int),
    1
)


# ---------------------------------------------------
# 4. Vulnerability information
# ---------------------------------------------------

elderly_percent = np.random.uniform(5, 25, NUM_RECORDS)

children_percent = np.random.uniform(10, 30, NUM_RECORDS)

medically_dependent_percent = np.random.uniform(2, 10, NUM_RECORDS)


# ---------------------------------------------------
# 5. Resource demand
# ---------------------------------------------------

affected_population = population * (damage_percent / 100)


# Food packets
food_packets = (
    affected_population * 1.2
    + severity_score * 5
    + np.random.normal(0, 100, NUM_RECORDS)
)

food_packets = np.maximum(
    food_packets.astype(int),
    0
)


# Water requirement
water_liters = (
    affected_population * 3
    + severity_score * 10
    + np.random.normal(0, 300, NUM_RECORDS)
)

water_liters = np.maximum(
    water_liters.astype(int),
    0
)


# Medical kits
medical_kits = (
    affected_population * 0.04
    + medically_dependent_percent * 5
    + severity_score * 0.5
    + np.random.normal(0, 10, NUM_RECORDS)
)

medical_kits = np.maximum(
    medical_kits.astype(int),
    0
)


# Shelter capacity
shelter_capacity = (
    affected_population * 0.30
    + children_percent * 5
    + elderly_percent * 4
    + np.random.normal(0, 50, NUM_RECORDS)
)

shelter_capacity = np.maximum(
    shelter_capacity.astype(int),
    0
)


# ---------------------------------------------------
# 6. Create the dataset
# ---------------------------------------------------

# ---------------------------------------------------
# 6. Feature engineering
# ---------------------------------------------------

affected_population = (
    population * damage_percent / 100
)

severity_damage_index = (
    severity_score * damage_percent / 100
)

building_damage_ratio = (
    buildings_affected / population
)

vulnerability_score = (
    elderly_percent
    + children_percent
    + medically_dependent_percent
)


# ---------------------------------------------------
# 7. Create the dataset
# ---------------------------------------------------

data = pd.DataFrame({
    "disaster_id": disaster_ids,
    "zone_id": zone_ids,
    "disaster_type": disaster_types,

    "severity_score": np.round(
        severity_score, 2
    ),

    "population": population,

    "damage_percent": np.round(
        damage_percent, 2
    ),

    "buildings_affected": buildings_affected,

    "elderly_percent": np.round(
        elderly_percent, 2
    ),

    "children_percent": np.round(
        children_percent, 2
    ),

    "medically_dependent_percent": np.round(
        medically_dependent_percent, 2
    ),

    # New engineered features
    "affected_population": np.round(
        affected_population, 2
    ),

    "severity_damage_index": np.round(
        severity_damage_index, 2
    ),

    "building_damage_ratio": np.round(
        building_damage_ratio, 4
    ),

    "vulnerability_score": np.round(
        vulnerability_score, 2
    ),

    # Targets
    "food_packets": food_packets,
    "water_liters": water_liters,
    "medical_kits": medical_kits,
    "shelter_capacity": shelter_capacity
})

# ---------------------------------------------------
# 7. Save CSV
# ---------------------------------------------------

output_file = "data/synthetic_disaster_dataset.csv"

data.to_csv(output_file, index=False)

print("Synthetic dataset generated successfully!")
print(f"Records generated: {len(data)}")
print(f"Saved to: {output_file}")

print("\nFirst 5 records:")
print(data.head())