from sqlalchemy.orm import Session
from app.models.zone import Zone
from app.models.disaster import Disaster


# ============================================================
# BASIC HELPERS
# ============================================================

def clamp(value, minimum=0.0, maximum=100.0):
    try:
        value = float(value)
    except (TypeError, ValueError):
        value = 0.0

    return max(minimum, min(value, maximum))


# ============================================================
# DISASTER SEVERITY NORMALIZATION
# ============================================================

def normalize_disaster_severity(disaster: Disaster):
    """
    Convert disaster severity into a 0-100 PRIORITY score.

    IMPORTANT:
    This is NOT physical damage percentage.

    Disaster severity and satellite damage are two different
    concepts.
    """

    severity = float(disaster.severity or 0)

    disaster_type = (
        disaster.disaster_type or ""
    ).strip().upper()

    # --------------------------------------------------------
    # EARTHQUAKE
    # --------------------------------------------------------

    if disaster_type in ["EARTHQUAKE", "EQ"]:

        score = (
            (severity - 4.0) / 4.0
        ) * 100

        return clamp(score)

    # --------------------------------------------------------
    # FLOOD
    # --------------------------------------------------------

    if disaster_type in ["FLOOD", "FL"]:

        if severity <= 0:
            return 0.0

        # Flood severity can be much larger than 100.
        # Convert it to a 0-100 PRIORITY score.
        #
        # This does NOT represent physical damage.
        score = (
            severity / 200.0
        ) * 100

        return clamp(score)

    # --------------------------------------------------------
    # CYCLONE
    # --------------------------------------------------------

    if disaster_type in ["CYCLONE", "TC"]:

        if severity <= 0:
            return 0.0

        score = (
            severity / 300.0
        ) * 100

        return clamp(score)

    # --------------------------------------------------------
    # WILDFIRE
    # --------------------------------------------------------

    if disaster_type in ["WILDFIRE", "WF"]:

        if severity <= 0:
            return 0.0

        import math

        score = (
            math.log10(severity + 1)
            / math.log10(100000 + 1)
        ) * 100

        return clamp(score)

    # --------------------------------------------------------
    # VOLCANO
    # --------------------------------------------------------

    if disaster_type in ["VOLCANO", "VO"]:

        if severity <= 0:
            return 0.0

        score = (
            severity / 10.0
        ) * 100

        return clamp(score)

    # --------------------------------------------------------
    # OTHER DISASTERS
    # --------------------------------------------------------

    if disaster_type in [
        "LANDSLIDE",
        "STORM",
        "LIGHTNING",
        "TSUNAMI"
    ]:

        if severity <= 0:
            return 0.0

        score = (
            severity / 100.0
        ) * 100

        return clamp(score)

    return clamp(severity)


# ============================================================
# DISASTER TYPE WEIGHT
# ============================================================

def get_disaster_type_weight(disaster_type):

    disaster_type = (
        (disaster_type or "")
        .strip()
        .lower()
    )

    weights = {

        "flood": 1.00,
        "fl": 1.00,

        "cyclone": 1.00,
        "tc": 1.00,

        "earthquake": 1.00,
        "eq": 1.00,

        "landslide": 1.00,

        "wildfire": 1.00,
        "wf": 1.00,

        "storm": 1.00,

        "tsunami": 1.00,

        "volcano": 1.00,
        "vo": 1.00,

        "lightning": 1.00,
    }

    return weights.get(
        disaster_type,
        1.00
    )


# ============================================================
# POPULATION SCORE
# ============================================================

def calculate_population_score(
    db: Session,
    zone: Zone
):

    max_population = (
        db.query(
            Zone.estimated_population
        )
        .filter(
            Zone.estimated_population.isnot(None)
        )
        .order_by(
            Zone.estimated_population.desc()
        )
        .first()
    )

    if (
        not max_population
        or not max_population[0]
        or max_population[0] <= 0
    ):
        return 0.0

    population = float(
        zone.estimated_population or 0
    )

    score = (
        population
        / float(max_population[0])
    ) * 100

    return clamp(score)


# ============================================================
# BUILDING SCORE
# ============================================================

def calculate_building_score(
    db: Session,
    zone: Zone
):

    max_buildings = (
        db.query(
            Zone.building_count
        )
        .filter(
            Zone.building_count.isnot(None)
        )
        .order_by(
            Zone.building_count.desc()
        )
        .first()
    )

    if (
        not max_buildings
        or not max_buildings[0]
        or max_buildings[0] <= 0
    ):
        return 0.0

    buildings = float(
        zone.building_count or 0
    )

    score = (
        buildings
        / float(max_buildings[0])
    ) * 100

    return clamp(score)


# ============================================================
# AUTOMATIC DAMAGE CALCULATION
# ============================================================

def calculate_zone_damage(disasters):
    """
    Calculate zone damage percentage using
    satellite-derived damage when available.

    If satellite damage is unavailable,
    fall back to normalized disaster severity.
    """

    if not disasters:
        return 0.0

    damage_scores = []

    for disaster in disasters:

        # --------------------------------------------------
        # PRIMARY SOURCE:
        # Satellite-derived physical damage
        # --------------------------------------------------

        satellite_damage = getattr(
            disaster,
            "satellite_damage_percent",
            None
        )

        if satellite_damage is not None:

            damage = clamp(
                satellite_damage
            )

        # --------------------------------------------------
        # FALLBACK:
        # Disaster severity
        # --------------------------------------------------

        else:

            severity_score = (
                normalize_disaster_severity(
                    disaster
                )
            )

            type_weight = (
                get_disaster_type_weight(
                    disaster.disaster_type
                )
            )

            damage = clamp(
                severity_score * type_weight
            )

        damage_scores.append(
            damage
        )

    if not damage_scores:
        return 0.0

    # Strongest actual damage in the zone
    return round(
        max(damage_scores),
        2
    )


# ============================================================
# UPDATE ZONE SEVERITY
# ============================================================

def update_zone_severity(
    db: Session,
    disaster: Disaster,
    zone: Zone
):

    # --------------------------------------------------------
    # 1. Get all disasters assigned to zone
    # --------------------------------------------------------

    disasters = (
        db.query(Disaster)
        .filter(
            Disaster.zone_id == zone.id
        )
        .all()
    )

    # --------------------------------------------------------
    # 2. Update disaster count
    # --------------------------------------------------------

    zone.disaster_count = len(
        disasters
    )

    # --------------------------------------------------------
    # 3. PHYSICAL DAMAGE
    # --------------------------------------------------------

    zone.damage_percent = (
        calculate_zone_damage(
            disasters
        )
    )

    # --------------------------------------------------------
    # 4. DISASTER PRIORITY / INTENSITY
    # --------------------------------------------------------

    disaster_score = 0.0

    if disasters:

        disaster_scores = []

        for current_disaster in disasters:

            base_score = (
                normalize_disaster_severity(
                    current_disaster
                )
            )

            type_weight = (
                get_disaster_type_weight(
                    current_disaster.disaster_type
                )
            )

            adjusted_score = clamp(
                base_score * type_weight
            )

            disaster_scores.append(
                adjusted_score
            )

        if disaster_scores:

            disaster_score = max(
                disaster_scores
            )

    # --------------------------------------------------------
    # 5. DAMAGE SCORE
    # --------------------------------------------------------

    damage_score = clamp(
        zone.damage_percent
    )

    # --------------------------------------------------------
    # 6. POPULATION EXPOSURE
    # --------------------------------------------------------

    population_score = (
        calculate_population_score(
            db,
            zone
        )
    )

    # --------------------------------------------------------
    # 7. BUILDING EXPOSURE
    # --------------------------------------------------------

    building_score = (
        calculate_building_score(
            db,
            zone
        )
    )

    # --------------------------------------------------------
    # 8. FINAL SEVERITY
    # --------------------------------------------------------
    #
    # Disaster intensity:
    #     50%
    #
    # Physical damage:
    #     25%
    #
    # Population exposure:
    #     15%
    #
    # Building exposure:
    #     10%
    #
    # --------------------------------------------------------

    severity_score = (

        0.50 * disaster_score

        + 0.25 * damage_score

        + 0.15 * population_score

        + 0.10 * building_score
    )

    # --------------------------------------------------------
    # 9. SAVE
    # --------------------------------------------------------

    zone.severity_score = round(
        clamp(severity_score),
        2
    )

    db.commit()

    db.refresh(zone)

    return zone