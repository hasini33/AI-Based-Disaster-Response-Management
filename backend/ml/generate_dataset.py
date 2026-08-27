import numpy as np
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

NUM_RECORDS = 1000

# Reproducible results
np.random.seed(42)


# ============================================================
# 1. BASIC DISASTER INFORMATION
# ============================================================

disaster_ids = [
    f"D{i:04d}"
    for i in range(1, NUM_RECORDS + 1)
]

zone_ids = np.random.randint(
    1,
    21,
    NUM_RECORDS
)

disaster_types = np.random.choice(
    [
        "Flood",
        "Earthquake",
        "Cyclone",
        "Landslide"
    ],
    NUM_RECORDS
)


# ============================================================
# 2. DISASTER SEVERITY AND DAMAGE
# ============================================================

severity_score = np.random.uniform(
    10,
    100,
    NUM_RECORDS
)

# Damage is related to severity, but not completely dependent
damage_percent = (
    severity_score * 0.65
    + np.random.normal(0, 15, NUM_RECORDS)
)

damage_percent = np.clip(
    damage_percent,
    5,
    100
)


# ============================================================
# 3. POPULATION
# ============================================================

population = np.random.randint(
    500,
    15000,
    NUM_RECORDS
)


# ============================================================
# 4. BUILDINGS AFFECTED
# ============================================================

building_damage_ratio = np.random.uniform(
    0.03,
    0.15,
    NUM_RECORDS
)

buildings_affected = (
    population
    * building_damage_ratio
    * (damage_percent / 100)
)

buildings_affected = np.maximum(
    buildings_affected.astype(int),
    1
)


# ============================================================
# 5. VULNERABILITY INFORMATION
# ============================================================

elderly_percent = np.random.uniform(
    5,
    25,
    NUM_RECORDS
)

children_percent = np.random.uniform(
    10,
    30,
    NUM_RECORDS
)

medically_dependent_percent = np.random.uniform(
    2,
    10,
    NUM_RECORDS
)


# ============================================================
# 6. ENGINEERED FEATURES
# ============================================================

# Population affected by disaster
affected_population = (
    population
    * damage_percent
    / 100
)


# Severity + damage interaction
severity_damage_index = (
    severity_score
    * damage_percent
    / 100
)


# Actual building damage ratio
building_damage_ratio = (
    buildings_affected
    / population
)


# Same weighted vulnerability formula
# used by the backend service
vulnerability_score = (
    0.4 * elderly_percent
    + 0.3 * children_percent
    + 0.3 * medically_dependent_percent
)

vulnerability_score = np.clip(
    vulnerability_score,
    0,
    100
)


# Normalized vulnerability
vulnerability_factor = (
    vulnerability_score / 100
)


# ============================================================
# 7. DISASTER TYPE EFFECT
# ============================================================

food_type_factor = np.select(
    [
        disaster_types == "Flood",
        disaster_types == "Earthquake",
        disaster_types == "Cyclone",
        disaster_types == "Landslide"
    ],
    [
        1.10,
        1.00,
        1.05,
        0.95
    ],
    default=1.0
)


water_type_factor = np.select(
    [
        disaster_types == "Flood",
        disaster_types == "Earthquake",
        disaster_types == "Cyclone",
        disaster_types == "Landslide"
    ],
    [
        1.20,
        1.00,
        1.10,
        0.95
    ],
    default=1.0
)


medical_type_factor = np.select(
    [
        disaster_types == "Flood",
        disaster_types == "Earthquake",
        disaster_types == "Cyclone",
        disaster_types == "Landslide"
    ],
    [
        1.00,
        1.25,
        1.10,
        1.15
    ],
    default=1.0
)


shelter_type_factor = np.select(
    [
        disaster_types == "Flood",
        disaster_types == "Earthquake",
        disaster_types == "Cyclone",
        disaster_types == "Landslide"
    ],
    [
        1.15,
        1.20,
        1.25,
        1.05
    ],
    default=1.0
)


# ============================================================
# 8. RESOURCE DEMAND
# ============================================================

# ------------------------------------------------------------
# FOOD
# ------------------------------------------------------------

food_packets = (
    affected_population * 0.85
    + severity_score * 8
    + damage_percent * 4
    + buildings_affected * 0.08
    + vulnerability_score * 8
)

food_packets = (
    food_packets
    * food_type_factor
    + np.random.normal(
        0,
        80,
        NUM_RECORDS
    )
)

food_packets = np.maximum(
    food_packets.astype(int),
    0
)


# ------------------------------------------------------------
# WATER
# ------------------------------------------------------------

water_liters = (
    affected_population * 2.2
    + severity_score * 15
    + damage_percent * 8
    + buildings_affected * 0.12
    + vulnerability_score * 12
)

water_liters = (
    water_liters
    * water_type_factor
    + np.random.normal(
        0,
        200,
        NUM_RECORDS
    )
)

water_liters = np.maximum(
    water_liters.astype(int),
    0
)


# ------------------------------------------------------------
# MEDICAL KITS
# ------------------------------------------------------------

medical_kits = (
    affected_population * 0.025
    + severity_score * 0.8
    + damage_percent * 0.35
    + buildings_affected * 0.01
    + medically_dependent_percent * 12
    + vulnerability_score * 1.5
)

medical_kits = (
    medical_kits
    * medical_type_factor
    + np.random.normal(
        0,
        5,
        NUM_RECORDS
    )
)

medical_kits = np.maximum(
    medical_kits.astype(int),
    0
)


# ------------------------------------------------------------
# SHELTER CAPACITY
# ------------------------------------------------------------

shelter_capacity = (
    affected_population * 0.25
    + severity_score * 4
    + damage_percent * 2
    + buildings_affected * 0.03
    + children_percent * 4
    + elderly_percent * 5
    + vulnerability_score * 3
)

shelter_capacity = (
    shelter_capacity
    * shelter_type_factor
    + np.random.normal(
        0,
        30,
        NUM_RECORDS
    )
)

shelter_capacity = np.maximum(
    shelter_capacity.astype(int),
    0
)


# ============================================================
# 9. CREATE DATAFRAME
# ============================================================

data = pd.DataFrame({

    "disaster_id": disaster_ids,

    "zone_id": zone_ids,

    "disaster_type": disaster_types,

    "severity_score": np.round(
        severity_score,
        2
    ),

    "population": population,

    "damage_percent": np.round(
        damage_percent,
        2
    ),

    "buildings_affected": buildings_affected,

    "elderly_percent": np.round(
        elderly_percent,
        2
    ),

    "children_percent": np.round(
        children_percent,
        2
    ),

    "medically_dependent_percent": np.round(
        medically_dependent_percent,
        2
    ),

    "affected_population": np.round(
        affected_population,
        2
    ),

    "severity_damage_index": np.round(
        severity_damage_index,
        2
    ),

    "building_damage_ratio": np.round(
        building_damage_ratio,
        4
    ),

    "vulnerability_score": np.round(
        vulnerability_score,
        2
    ),

    "food_packets": food_packets,

    "water_liters": water_liters,

    "medical_kits": medical_kits,

    "shelter_capacity": shelter_capacity
})


# ============================================================
# 10. SAVE DATASET
# ============================================================

output_file = (
    "data/synthetic_disaster_dataset.csv"
)

data.to_csv(
    output_file,
    index=False
)


# ============================================================
# 11. OUTPUT INFORMATION
# ============================================================

print(
    "Synthetic dataset generated successfully!"
)

print(
    f"Records generated: {len(data)}"
)

print(
    f"Saved to: {output_file}"
)

print("\nFirst 5 records:")

print(
    data.head()
)


print("\nCorrelation with damage_percent:")

print(
    data[
        [
            "damage_percent",
            "food_packets",
            "water_liters",
            "medical_kits",
            "shelter_capacity"
        ]
    ].corr()["damage_percent"]
)