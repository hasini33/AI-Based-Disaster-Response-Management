const API_BASE_URL = "http://127.0.0.1:8000"

export async function getResources() {

  const response = await fetch(
    `${API_BASE_URL}/resources/`
  )

  if (!response.ok) {

    let message = "Failed to load resources"

    try {
      const errorData = await response.json()

      if (errorData?.detail) {
        message = errorData.detail
      }

    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(message)
  }

  return response.json()
}