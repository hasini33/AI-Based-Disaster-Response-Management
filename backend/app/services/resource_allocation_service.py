from app.models.zone import Zone


def allocate_resources(zone: Zone):

    if zone.severity_score >= 8:
        return {
            "ambulances": 10,
            "relief_teams": 5,
            "food_packets": 1000
        }

    elif zone.severity_score >= 5:
        return {
            "ambulances": 5,
            "relief_teams": 3,
            "food_packets": 500
        }

    else:
        return {
            "ambulances": 2,
            "relief_teams": 1,
            "food_packets": 200
        }