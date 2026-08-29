const API_BASE_URL = "http://127.0.0.1:8000"


export async function optimizeRoutes() {

  const response = await fetch(
    `${API_BASE_URL}/route-optimization/optimize`
  )

  if (!response.ok) {

    let message =
      "Failed to optimize vehicle routes"

    try {

      const errorData =
        await response.json()

      message =
        errorData.detail ||
        errorData.message ||
        message

    } catch {
      // Keep default error message
    }

    throw new Error(message)
  }

  return response.json()
}