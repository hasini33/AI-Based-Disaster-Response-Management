const API_BASE_URL = "http://127.0.0.1:8000";

export async function getDisasterImpact(disasterId){
    const response = await fetch(
        `${API_BASE_URL}/impact/${disasterId}`

    );

    if (!response.ok) {
        throw new Error("Failed to fetch disaster impact");
    }
    return response.json();
}

export async function getDisasters() {
  const response = await fetch(`${API_BASE_URL}/disasters`);

  if (!response.ok) {
    throw new Error("Failed to fetch disasters");
  }

  return response.json();
}