def normalize_gdacs(disaster):
    """
    Convert one GDACS disaster record into a common format.
    """

    properties = disaster["properties"]
    geometry = disaster["geometry"]

    return {
        "source": "GDACS",
        "disaster_type": properties.get("eventtype"),
        "country": properties.get("country"),
        "alert_level": properties.get("alertlevel"),
        "severity": properties.get("severitydata", {}).get("severity"),
        "latitude": geometry["coordinates"][1],
        "longitude": geometry["coordinates"][0]
    }

#USGS
def normalize_usgs(earthquake):
    
    #Convert one USGS earthquake record into a common format

    properties = earthquake["properties"]
    geometry = earthquake["geometry"]

    return {
        "source": "USGS",
        "magnitude": properties.get("mag"),
        "place": properties.get("place"),
        "time": properties.get("time"),
        "latitude": geometry["coordinates"][1],
        "longitude": geometry["coordinates"][0]
    }

def normalize_ndma(entry):
    return {
        "title": entry.get("title", ""),
        "summary": entry.get("summary", ""),
        "published": entry.get("published", ""),
        "link": entry.get("link", "")
    }