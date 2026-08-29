const API_BASE_URL = "http://127.0.0.1:8000";

// Get global optimized allocation
export async function getOptimizedAllocation() {
  const response = await fetch(
    `${API_BASE_URL}/allocation/optimize`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch optimized allocation");
  }

  return response.json();
}


// Get allocation details for one zone
export async function getZoneAllocation(zoneId) {
  const response = await fetch(
    `${API_BASE_URL}/allocation/${zoneId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch zone allocation");
  }

  return response.json();
}


// Create optimized allocation request
export async function requestAllocation(zoneId) {
  const response = await fetch(
    `${API_BASE_URL}/allocation/${zoneId}/request`,
    {
      method: "POST",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to create allocation request"
    );
  }

  return data;
}


// Approve an allocation
export async function approveAllocation(allocationId) {
  const response = await fetch(
    `${API_BASE_URL}/allocation/${allocationId}/approve`,
    {
      method: "PUT",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to approve allocation"
    );
  }

  return data;
}


// Reject an allocation
export async function rejectAllocation(allocationId) {
  const response = await fetch(
    `${API_BASE_URL}/allocation/${allocationId}/reject`,
    {
      method: "PUT",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to reject allocation"
    );
  }

  return data;
}


// Complete an approved allocation
export async function completeAllocation(allocationId) {
  const response = await fetch(
    `${API_BASE_URL}/allocation/${allocationId}/complete`,
    {
      method: "PUT",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to complete allocation"
    );
  }

  return data;
}


// Get allocation history
export async function getAllocationHistory() {
  const response = await fetch(
    `${API_BASE_URL}/allocation/history`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch allocation history");
  }

  return response.json();
}