from sqlalchemy.orm import Session

from app.models.zone import Zone
from app.models.disaster import Disaster


# ============================================================
# BASIC HELPERS
# ============================================================

def clamp(
    value,
    minimum=0.0,
    maximum=100.0
):
    """
    Keep a value between minimum and maximum.
    """

    try:
        value = float(value)
    except (TypeError, ValueError):
        value = 0.0

    return max(
        minimum,
        min(value, maximum)
    )


# ============================================================
# DISASTER SEVERITY NORMALIZATION
# ============================================================

def normalize_disaster_severity(
    disaster: Disaster
):
    """
    Convert different disaster severity formats
    into a common 0-100 severity score.

    GDACS severity values are not consistent across
    disaster types.

    Examples:

        Earthquake 5.0  -> moderate
        Earthquake 7.5  -> very high

        Cyclone 316     -> high

        Wildfire 47910  -> high
    """

    severity = float(
        disaster.severity or 0
    )

    disaster_type = (
        disaster.disaster_type or ""
    ).strip().upper()

    # --------------------------------------------------------
    # Earthquake
    # --------------------------------------------------------

    if disaster_type in [
        "EARTHQUAKE",
        "EQ"
    ]:

        # Richter/Magnitude style
        score = (
            (severity - 4.0)
            / 4.0
        ) * 100

        return clamp(score)

    # --------------------------------------------------------
    # Flood
    # --------------------------------------------------------

    if disaster_type in [
        "FLOOD",
        "FL"
    ]:

        # Some GDACS flood records have 0 severity.
        # If severity exists, treat it as an already
        # normalized value.
        return clamp(severity)

    # --------------------------------------------------------
    # Cyclone
    # --------------------------------------------------------

    if disaster_type in [
        "CYCLONE",
        "TC"
    ]:

        # GDACS cyclone severity values can be
        # much larger than 100.
        #
        # Use a logarithmic scale so that extremely
        # large values do not immediately become 100.

        if severity <= 0:
            return 0.0

        score = (
            severity / 300.0
        ) * 100

        return clamp(score)

    # --------------------------------------------------------
    # Wildfire
    # --------------------------------------------------------

    if disaster_type in [
        "WILDFIRE",
        "WF"
    ]:

        # Wildfire severity values can represent
        # affected area / burned area.
        #
        # Convert using a logarithmic scale.

        if severity <= 0:
            return 0.0

        import math

        score = (
            math.log10(severity + 1)
            / math.log10(100000 + 1)
        ) * 100

        return clamp(score)

    # --------------------------------------------------------
    # Volcano
    # --------------------------------------------------------

    if disaster_type in [
        "VOLCANO",
        "VO"
    ]:

        return clamp(severity)

    # --------------------------------------------------------
    # Landslide / Storm / Lightning etc.
    # --------------------------------------------------------

    if disaster_type in [
        "LANDSLIDE",
        "STORM",
        "LIGHTNING"
    ]:

        return clamp(severity)

    # --------------------------------------------------------
    # Unknown disaster type
    # --------------------------------------------------------

    return clamp(severity)


# ============================================================
# DISASTER TYPE WEIGHT
# ============================================================

def get_disaster_type_weight(
    disaster_type
):
    """
    Disaster type adjustment.

    Severity remains the primary factor.

    Currently all disaster types use neutral weighting
    so that the model does not artificially increase
    one disaster type over another.
    """

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
# NORMALIZE POPULATION
# ============================================================

def calculate_population_score(
    db: Session,
    zone: Zone
):
    """
    Convert zone population into a 0-100
    relative exposure score.
    """

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
# NORMALIZE BUILDINGS
# ============================================================

def calculate_building_score(
    db: Session,
    zone: Zone
):
    """
    Convert building count into a 0-100
    relative exposure score.
    """

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
# UPDATE ZONE SEVERITY
# ============================================================

def update_zone_severity(
    db: Session,
    disaster: Disaster,
    zone: Zone
):
    """
    Calculate and update the severity score of a zone.

    Formula:

        Disaster Impact = 50%
        Damage          = 25%
        Population      = 15%
        Buildings       = 10%

    If there are no disasters assigned to the zone,
    the disaster component becomes 0.

    Final score is always between 0 and 100.
    """

    # --------------------------------------------------------
    # 1. Get disasters assigned to this zone
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
    # 3. Calculate disaster impact
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
                base_score
                * type_weight
            )

            disaster_scores.append(
                adjusted_score
            )

        # Strongest disaster determines
        # the primary disaster impact.

        disaster_score = max(
            disaster_scores
        )

    # --------------------------------------------------------
    # 4. Damage score
    # --------------------------------------------------------

    damage_score = clamp(
        zone.damage_percent or 0
    )

    # --------------------------------------------------------
    # 5. Population exposure
    # --------------------------------------------------------

    population_score = (
        calculate_population_score(
            db,
            zone
        )
    )

    # --------------------------------------------------------
    # 6. Building exposure
    # --------------------------------------------------------

    building_score = (
        calculate_building_score(
            db,
            zone
        )
    )

    # --------------------------------------------------------
    # 7. Calculate final severity
    # --------------------------------------------------------

    severity_score = (

        0.50 * disaster_score

        + 0.25 * damage_score

        + 0.15 * population_score

        + 0.10 * building_score
    )

    # --------------------------------------------------------
    # 8. Clamp final score
    # --------------------------------------------------------

    zone.severity_score = round(
        clamp(severity_score),
        2
    )

    # --------------------------------------------------------
    # 9. Save changes
    # --------------------------------------------------------

    db.commit()

    db.refresh(
        zone
    )

    return zone