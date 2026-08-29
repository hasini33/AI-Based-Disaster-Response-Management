const API_BASE_URL = "http://127.0.0.1:8000"


// ============================================================
// GET ALL MISSIONS
// ============================================================

export async function getMissions() {

  const response = await fetch(
    `${API_BASE_URL}/missions/`
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch missions (${response.status})`
    )
  }

  return await response.json()
}


// ============================================================
// GENERATE MISSIONS FROM OPTIMIZED ROUTES
// ============================================================

export async function generateMissions() {

  const response = await fetch(
    `${API_BASE_URL}/missions/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {

    let message = "Failed to generate missions"

    try {
      const errorData = await response.json()

      message =
        errorData.detail ||
        errorData.message ||
        message

    } catch {
      // Keep default message
    }

    throw new Error(message)
  }

  return await response.json()
}


// ============================================================
// UPDATE MISSION STATUS
// ============================================================

export async function updateMissionStatus(
  missionId,
  status
) {

  const response = await fetch(
    `${API_BASE_URL}/missions/${missionId}/status?status=${encodeURIComponent(status)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {

    let message = "Failed to update mission status"

    try {
      const errorData = await response.json()

      message =
        errorData.detail ||
        errorData.message ||
        message

    } catch {
      // Keep default message
    }

    throw new Error(message)
  }

  return await response.json()
}