def calculate_severity(severity, population, buildings):
    """
    Calculate disaster severity score using
    disaster severity, population, and buildings.
    """

    # Normalize values to 0-100
    severity_score_input = min(severity / 5, 100)
    population_score = min(population / 10, 100)
    building_score = min(buildings, 100)

    score = (
        0.4 * severity_score_input +
        0.3 * population_score +
        0.3 * building_score
    )

    if score >= 75:
        level = "Very High"
    elif score >= 50:
        level = "High"
    elif score >= 25:
        level = "Medium"
    else:
        level = "Low"

    return round(score, 2), level