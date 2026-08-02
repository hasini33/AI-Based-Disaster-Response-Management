def calculate_severity(magnitude, population, buildings):
    """
    Calculate severity score based on
    earthquake magnitude,
    population,
    and building density.
    """

    # Normalize values to 0-100
    magnitude_score = magnitude * 10
    population_score = min(population / 10, 100)
    building_score = min(buildings, 100)

    severity_score = (
        0.4 * magnitude_score +
        0.3 * population_score +
        0.3 * building_score
    )

    if severity_score >= 75:
        level = "Very High"
    elif severity_score >= 50:
        level = "High"
    elif severity_score >= 25:
        level = "Medium"
    else:
        level = "Low"

    return severity_score, level