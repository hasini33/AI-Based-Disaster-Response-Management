
def normalize_gdacs(disaster):
    """
    Convert one GDACS GeoJSON feature into a common format.
    """
    properties = disaster.get("properties") or {}
    geometry = disaster.get("geometry") or {}
    coordinates = geometry.get("coordinates") or []

    event_id = properties.get("eventid")
    episode_id = properties.get("episodeid")

    # An event ID without an episode ID is still identifiable,
    # but use both whenever GDACS provides them.
    if event_id is not None:
        source_event_id = (
            f"{event_id}:{episode_id}"
            if episode_id is not None
            else str(event_id)
        )
    else:
        source_event_id = None

    severity_data = properties.get("severitydata") or {}

    latitude = coordinates[1] if len(coordinates) >= 2 else None
    longitude = coordinates[0] if len(coordinates) >= 2 else None

    return {
        "source": "GDACS",
        "source_event_id": source_event_id,
        "disaster_type": properties.get("eventtype"),
        "country": properties.get("country"),
        "alert_level": properties.get("alertlevel"),
        "severity": severity_data.get("severity"),
        "latitude": latitude,
        "longitude": longitude,
        "event_date": properties.get("fromdate")
    }


def normalize_usgs(earthquake):
    """
    Convert one USGS GeoJSON feature into a common format.
    """
    properties = earthquake.get("properties") or {}
    geometry = earthquake.get("geometry") or {}
    coordinates = geometry.get("coordinates") or []

    latitude = coordinates[1] if len(coordinates) >= 2 else None
    longitude = coordinates[0] if len(coordinates) >= 2 else None

    return {
        "source": "USGS",
        "source_event_id": earthquake.get("id"),
        "magnitude": properties.get("mag"),
        "place": properties.get("place"),
        "time": properties.get("time"),
        "latitude": latitude,
        "longitude": longitude
    }


def normalize_ndma(entry):
    """
    Normalize an NDMA RSS entry.
    CAP identifiers will be extracted from the CAP XML
    when the NDMA ingestion route is updated.
    """
    return {
        "title": entry.get("title", ""),
        "summary": entry.get("summary", ""),
        "published": entry.get("published", ""),
        "link": entry.get("link", "")
    }
