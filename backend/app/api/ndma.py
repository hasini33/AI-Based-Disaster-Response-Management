from fastapi import APIRouter
import httpx
import feedparser

from app.services.normalization_service import normalize_ndma

router = APIRouter()

NDMA_URL = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml"


@router.get("/ndma")
async def get_ndma_alerts():

    async with httpx.AsyncClient() as client:
        response = await client.get(NDMA_URL)

    feed = feedparser.parse(response.text)

    alerts = []

    for entry in feed.entries:
        alerts.append(normalize_ndma(entry))

    return {
        "total_alerts": len(alerts),
        "alerts": alerts
    }