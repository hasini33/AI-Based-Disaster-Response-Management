from fastapi import APIRouter
import httpx
import xml.etree.ElementTree as ET

from app.db.database import SessionLocal
from app.models.disaster import Disaster
from app.services.zone_mapping_service import assign_disaster_to_zone

from geoalchemy2.elements import WKTElement

router = APIRouter()

RSS_URL = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml"

CAP_NAMESPACE = {
    "cap": "urn:oasis:names:tc:emergency:cap:1.2"
}


def extract_state(area_desc):
    if not area_desc:
        return "India"

    area_desc = area_desc.strip()

    if " of " in area_desc:
        return area_desc.split(" of ")[-1].strip()

    if "," in area_desc:
        return area_desc.split(",")[-1].strip()

    return area_desc


@router.get("/ndma")
async def fetch_ndma():

    async with httpx.AsyncClient(timeout=30) as client:

        rss_response = await client.get(RSS_URL)

        rss_root = ET.fromstring(rss_response.content)

        channel = rss_root.find("channel")

        if channel is None:
            return {"message": "No alerts found"}

        db = SessionLocal()

        inserted = 0

        try:

            for item in channel.findall("item")[:5]:

                link = item.findtext("link")

                if not link:
                    continue

                cap_response = await client.get(link)

                cap_root = ET.fromstring(cap_response.content)

                info = cap_root.find("cap:info", CAP_NAMESPACE)

                if info is None:
                    continue

                event = info.findtext(
                    "cap:event",
                    default="Unknown",
                    namespaces=CAP_NAMESPACE
                )

                severity = info.findtext(
                    "cap:severity",
                    default="Unknown",
                    namespaces=CAP_NAMESPACE
                )

                headline = info.findtext(
                    "cap:headline",
                    default=event,
                    namespaces=CAP_NAMESPACE
                )

                area = info.find("cap:area", CAP_NAMESPACE)

                area_desc = None

                if area is not None:
                    area_desc = area.findtext(
                        "cap:areaDesc",
                        default="India",
                        namespaces=CAP_NAMESPACE
                    )

                country = "India"

                disaster = Disaster(
                    disaster_type=event,
                    country="India",
                    alert_level="NDMA",
                    severity=0,
                    latitude=None,
                    longitude=None,
                    location=None
                )

                db.add(disaster)

                db.commit()

                db.refresh(disaster)

                assign_disaster_to_zone(
                    db,
                    disaster.id
                )

                inserted += 1

        finally:
            db.close()

    return {
        "message": "NDMA alerts imported successfully",
        "records_inserted": inserted
    }