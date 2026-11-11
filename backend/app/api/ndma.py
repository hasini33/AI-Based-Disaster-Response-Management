
from datetime import datetime
import xml.etree.ElementTree as ET

import httpx
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.disaster import Disaster
from app.services.zone_mapping_service import assign_disaster_to_zone


router = APIRouter()

RSS_URL = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml"

CAP_NAMESPACE = {
    "cap": "urn:oasis:names:tc:emergency:cap:1.2"
}

# Convert CAP severity categories into numeric values
SEVERITY_MAPPING = {
    "extreme": ("Critical", 100.0),
    "severe": ("High", 75.0),
    "moderate": ("Medium", 50.0),
    "minor": ("Low", 25.0),
    "unknown": ("NDMA", None)
}


def get_cap_text(root, field):
    """Read a CAP XML field, with or without its namespace."""
    return (
        root.findtext(f"cap:{field}", namespaces=CAP_NAMESPACE)
        or root.findtext(field)
    )


def parse_cap_date(value):
    """Convert a CAP date into a Python datetime."""
    if not value:
        return None

    try:
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        ).replace(tzinfo=None)
    except (ValueError, TypeError):
        return None


@router.get("/ndma")
async def fetch_ndma():

    # 1. Fetch the NDMA RSS feed
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            rss_response = await client.get(RSS_URL)
            rss_response.raise_for_status()
            rss_root = ET.fromstring(rss_response.content)

        except (httpx.HTTPError, ET.ParseError) as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Unable to fetch NDMA RSS feed: {exc}"
            )

        channel = rss_root.find("channel")

        if channel is None:
            return {
                "message": "No NDMA alerts found",
                "records_inserted": 0
            }

        db: Session = SessionLocal()

        inserted = 0
        updated = 0
        skipped = 0
        errors = 0
        zone_assignment_errors = 0

        try:
            # 2. Process all RSS alerts
            for item in channel.findall("item"):

                link = item.findtext("link")

                if not link:
                    skipped += 1
                    continue

                try:
                    cap_response = await client.get(link)
                    cap_response.raise_for_status()
                    cap_root = ET.fromstring(cap_response.content)

                    # 3. Extract the unique CAP identifier
                    source_event_id = get_cap_text(
                        cap_root,
                        "identifier"
                    )

                    # RSS link is a fallback if CAP identifier is absent
                    source_event_id = source_event_id or link

                    if not source_event_id:
                        skipped += 1
                        continue

                    info = (
                        cap_root.find("cap:info", CAP_NAMESPACE)
                        or cap_root.find("info")
                    )

                    if info is None:
                        skipped += 1
                        continue

                    event = (
                        info.findtext("cap:event", namespaces=CAP_NAMESPACE)
                        or info.findtext("event")
                        or "Unknown"
                    )

                    cap_severity = (
                        info.findtext(
                            "cap:severity",
                            namespaces=CAP_NAMESPACE
                        )
                        or info.findtext("severity")
                        or "Unknown"
                    ).strip().lower()

                    alert_level, severity_value = SEVERITY_MAPPING.get(
                        cap_severity,
                        ("NDMA", None)
                    )

                    sent_date = get_cap_text(cap_root, "sent")

                    # 4. Check whether this alert already exists
                    existing = (
                        db.query(Disaster)
                        .filter(
                            Disaster.source == "NDMA",
                            Disaster.source_event_id == source_event_id
                        )
                        .first()
                    )

                    event_values = {
                        "source": "NDMA",
                        "source_event_id": source_event_id,
                        "disaster_type": event,
                        "country": "India",
                        "alert_level": alert_level,
                        "severity": severity_value,
                        "latitude": None,
                        "longitude": None,
                        "location": None,
                        "event_date": parse_cap_date(sent_date)
                    }

                    # 5. Insert new alert or update existing alert
                    if existing:
                        for key, value in event_values.items():
                            setattr(existing, key, value)
                        was_existing = True

                    else:
                        db.add(Disaster(**event_values))
                        was_existing = False

                    db.commit()

                    if was_existing:
                        inserted_or_updated = "updated"
                        updated += 1
                    else:
                        inserted_or_updated = "inserted"
                        inserted += 1

                    # 6. Assign to a zone only when coordinates exist
                    saved_disaster = (
                        db.query(Disaster)
                        .filter(
                            Disaster.source == "NDMA",
                            Disaster.source_event_id == source_event_id
                        )
                        .first()
                    )

                    if (
                        saved_disaster
                        and saved_disaster.latitude is not None
                        and saved_disaster.longitude is not None
                    ):
                        try:
                            assign_disaster_to_zone(
                                db,
                                saved_disaster.id
                            )
                        except Exception as exc:
                            db.rollback()
                            zone_assignment_errors += 1
                            print(
                                f"NDMA zone assignment failed for "
                                f"{source_event_id}: {exc}"
                            )

                except Exception as exc:
                    db.rollback()
                    errors += 1
                    print(
                        f"NDMA alert processing failed for {link}: {exc}"
                    )

            return {
                "message": "NDMA synchronization completed",
                "records_found": len(channel.findall("item")),
                "records_inserted": inserted,
                "records_updated": updated,
                "duplicates_prevented": updated,
                "records_skipped": skipped,
                "processing_errors": errors,
                "zone_assignment_errors": zone_assignment_errors
            }

        finally:
            db.close()
