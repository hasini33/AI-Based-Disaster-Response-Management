
const API_BASE_URL = "http://127.0.0.1:8000";

// Get AI demand prediction for a zone
export async function getZoneDemand(zoneId) {
  const response = await fetch(
    `${API_BASE_URL}/demand/${zoneId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to fetch AI demand"
    );
  }

  return data;
}


// Get all zones
export async function getZones() {
  const response = await fetch(
    `${API_BASE_URL}/zones/`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to fetch zones"
    );
  }

  return data;
}


// Update demand for one zone
export async function updateZoneDemand(
  zoneId,
  damagePercent
) {
  const response = await fetch(
    `${API_BASE_URL}/demand/${zoneId}/update?damage_percent=${damagePercent}`,
    {
      method: "POST",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to update demand"
    );
  }

  return data;
}


// Update demand for all zones
export async function updateAllDemands(
  damagePercent
) {
  const response = await fetch(
    `${API_BASE_URL}/demand/update-all?damage_percent=${damagePercent}`,
    {
      method: "POST",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to update demands"
    );
  }

  return data;
}


// Run demand scenario simulation
export async function simulateDemand(
  zoneId,
  damagePercent,
  responseDelayDays = 0,
  resourceAvailability = 100
) {
  const params = new URLSearchParams({
    damage_percent: damagePercent,
    response_delay_days: responseDelayDays,
    resource_availability: resourceAvailability,
  });

  const response = await fetch(
    `${API_BASE_URL}/demand/${zoneId}/simulate?${params}`,
    {
      method: "POST",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to simulate demand"
    );
  }

  return data;
}
