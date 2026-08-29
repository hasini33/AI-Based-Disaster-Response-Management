const API_BASE_URL = "http://127.0.0.1:8000";


// Get all zones
export async function getZones() {
  const response = await fetch(`${API_BASE_URL}/zones/`);

  if (!response.ok) {
    throw new Error("Failed to fetch zones");
  }

  return response.json();
}


// Get single zone
export async function getZoneById(zoneId) {
  const response = await fetch(`${API_BASE_URL}/zones/${zoneId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch zone");
  }

  return response.json();
}


// Override zone priority
export async function overrideZonePriority(zoneId, priority) {
  const response = await fetch(
    `${API_BASE_URL}/zones/${zoneId}/priority?priority=${priority}`,
    {
      method: "PUT",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.detail || "Failed to update zone priority"
    );
  }

  return response.json();
}