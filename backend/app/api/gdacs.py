
from datetime import datetime
from email.utils import parsedate_to_datetime
import re
import xml.etree.ElementTree as ET

import httpx
from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.elements import WKTElement
from sqlalchemy.orm import Session

from app.db.database import SessionLocal, get_db
from app.models.disaster import Disaster
from app.models.zone import Zone
from app.services.zone_mapping_service import assign_disaster_to_zone


router = APIRouter()

# Current GDACS RSS feed instead of the large historical archive
GDACS_URL = "https://www.gdacs.org/xml/rss.xml"

GDACS_NS = "http://www.gdacs.org"
GEO_NS = "http://www.w3.org/2003/01/geo/wgs84_pos#"

DISASTER_TYPES = {
    "EQ": "Earthquake",
    "FL": "Flood",
    "TC": "Tropical Cyclone",
    "VO": "Volcano",
    "DR": "Drought",
    "WF": "Wildfire"
}


def get_xml_text(item, namespace, tag):
    """Read a namespaced XML element as text."""
    element = item.find(f"{{{namespace}}}{tag}")

    if element is not None and element.text:
        return element.text.strip()

    return None


def parse_event_date(value):
    """Convert GDACS RSS dates into Python datetime values."""
    if not value:
        return None

    try:
        parsed = parsedate_to_datetime(value)
        return parsed.replace(tzinfo=None)
    except (ValueError, TypeError, OverflowError):
        try:
            return datetime.fromisoformat(
                value.replace("Z", "+00:00")
            ).replace(tzinfo=None)
        except (ValueError, TypeError):
            return None


def parse_country(title):
    """Extract a country name from a GDACS event title."""
    if not title:
        return None

    match = re.search(
        r"\bin\s+(.+?)(?=\s+\d{1,2}/\d{1,2}/\d{4}|,\s*\d|$)",
        title,
        re.IGNORECASE
    )

    return match.group(1).strip() if match else None



def limit_country_length(country):
    """Keep country information within the database's 100-character limit."""
    if not country:
        return None

    country = country.strip()

    if len(country) > 100:
        return "Multiple countries"

    return country


def normalize_rss_item(item):
    """Convert one GDACS RSS item into our Disaster model fields."""

    event_id = get_xml_text(item, GDACS_NS, "eventid")
    episode_id = get_xml_text(item, GDACS_NS, "episodeid")

    if not event_id:
        return None

    source_event_id = (
        f"{event_id}:{episode_id}"
        if episode_id
        else event_id
    )

    title = item.findtext("title", default="").strip()

    event_type = get_xml_text(item, GDACS_NS, "eventtype")
    alert_level = get_xml_text(item, GDACS_NS, "alertlevel")

    alert_score = get_xml_text(item, GDACS_NS, "alertscore")
    episode_score = get_xml_text(
        item, GDACS_NS, "episodealertscore"
    )

    try:
        severity = float(
            alert_score if alert_score is not None else episode_score
        )
    except (ValueError, TypeError):
        severity = None

    latitude = item.findtext(f"{{{GEO_NS}}}lat")
    longitude = item.findtext(f"{{{GEO_NS}}}long")

    try:
        latitude = float(latitude) if latitude is not None else None
        longitude = float(longitude) if longitude is not None else None
    except (ValueError, TypeError):
        latitude = longitude = None

    valid_coordinates = (
        latitude is not None
        and longitude is not None
        and -90 <= latitude <= 90
        and -180 <= longitude <= 180
    )

    return {
        "source": "GDACS",
        "source_event_id": source_event_id,
        "disaster_type": DISASTER_TYPES.get(
            event_type, event_type or "Unknown"
        ),
        "country": limit_country_length(
        get_xml_text(item, GDACS_NS, "country")
        or parse_country(title)
        ),
            "alert_level": alert_level,
        "severity": severity,
        "latitude": latitude if valid_coordinates else None,
        "longitude": longitude if valid_coordinates else None,
        "event_date": parse_event_date(
            get_xml_text(item, GDACS_NS, "fromdate")
        ),
        "location": (
            WKTElement(
                f"POINT({longitude} {latitude})",
                srid=4326
            )
            if valid_coordinates
            else None
        )
    }


@router.get("/disasters")
def get_disasters(db: Session = Depends(get_db)):
    disasters = db.query(Disaster).all()

    return [
        {
            "id": disaster.id,
            "type": disaster.disaster_type,
            "country": disaster.country,
            "severity": disaster.severity,
            "alert_level": disaster.alert_level,
            "latitude": disaster.latitude,
            "longitude": disaster.longitude,
            "zone_id": disaster.zone_id
        }
        for disaster in disasters
    ]


@router.post("/{disaster_id}/assign-zone")
def assign_zone(disaster_id: int, db: Session = Depends(get_db)):
    return assign_disaster_to_zone(db, disaster_id)


@router.get("/gdacs")
async def get_gdacs_data():

    # 1. Fetch the current GDACS RSS feed
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(GDACS_URL)
            response.raise_for_status()
            root = ET.fromstring(response.content)

        except (httpx.HTTPError, ET.ParseError) as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Unable to fetch or parse GDACS RSS feed: {exc}"
            )

    items = root.findall("./channel/item")

    # 2. Normalize valid events
    events = []
    skipped = 0

    for item in items:
        try:
            event = normalize_rss_item(item)

            if event is None:
                skipped += 1
                continue

            events.append(event)

        except Exception as exc:
            skipped += 1
            print(f"GDACS RSS item skipped: {exc}")

    db = SessionLocal()

    inserted = 0
    updated = 0
    batch_size = 50

    try:
        # 3. Fetch existing GDACS records in one query
        event_ids = [
            event["source_event_id"] for event in events
        ]

        existing_records = (
            db.query(Disaster)
            .filter(
                Disaster.source == "GDACS",
                Disaster.source_event_id.in_(event_ids)
            )
            .all()
        ) if event_ids else []

        existing_by_id = {
            record.source_event_id: record
            for record in existing_records
        }

        # 4. Insert or update records in batches
        for index, event in enumerate(events, start=1):

            source_event_id = event["source_event_id"]
            existing = existing_by_id.get(source_event_id)

            event_values = {
                key: value
                for key, value in event.items()
                if key != "source_event_id"
            }

            if existing:
                for key, value in event_values.items():
                    setattr(existing, key, value)

                updated += 1

            else:
                new_disaster = Disaster(**event)
                db.add(new_disaster)

                # Keep this event in the map to avoid adding it twice
                # if the same ID occurs again in this RSS response.
                existing_by_id[source_event_id] = new_disaster

                inserted += 1

            # Commit every 50 events
            if index % batch_size == 0:
                db.commit()

        # 5. Save remaining events
        db.commit()

        return {
            "message": "GDACS RSS synchronization completed",
            "records_found": len(items),
            "records_inserted": inserted,
            "records_updated": updated,
            "duplicates_prevented": updated,
            "records_skipped": skipped,
            "processing_errors": 0,
            "zone_assignment": "Performed separately when requested"
        }

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"GDACS database synchronization failed: {exc}"
        )

    finally:
        db.close()
