import { useEffect, useState } from "react"
import {
  getDisasterImpact,
  getDisasters,
} from "../../services/disasterService"

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet"

import "leaflet/dist/leaflet.css"


// Convert Polygon WKT into Leaflet coordinates
function parsePolygonWKT(wkt) {
  if (!wkt) {
    return null
  }

  const coordinates = wkt
    .replace("POLYGON ((", "")
    .replace("))", "")
    .split(",")
    .map((point) => {
      const [longitude, latitude] = point.trim().split(" ").map(Number)

      return [latitude, longitude]
    })

  return coordinates
}


// Update map position when disaster changes
function MapUpdater({ latitude, longitude }) {
  const map = useMap()

  useEffect(() => {
    if (latitude != null && longitude != null) {
      map.setView([latitude, longitude], 7)
    }
  }, [latitude, longitude, map])

  return null
}


// Decide polygon color based on severity
function getSeverityColor(severity) {
  if (severity >= 8) {
    return "darkred"
  }

  if (severity >= 6) {
    return "red"
  }

  if (severity >= 4) {
    return "orange"
  }

  return "green"
}


function DisasterMap() {

  const [impactData, setImpactData] = useState(null)
  const [disasters, setDisasters] = useState([])
  const [selectedDisasterId, setSelectedDisasterId] = useState(1500)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)


  // Get disaster list
  useEffect(() => {

    getDisasters()
      .then((data) => {
        console.log("Disasters:", data)
        setDisasters(data)
      })
      .catch((error) => {
        console.error("Failed to fetch disasters:", error)
        setError(true)
      })

  }, [])


  // Get selected disaster information
  useEffect(() => {

    setLoading(true)
    setError(false)

    getDisasterImpact(selectedDisasterId)
      .then((data) => {
        console.log("Selected disaster impact:", data)
        setImpactData(data)
      })
      .catch((error) => {
        console.error("Failed to fetch selected disaster impact:", error)
        setError(true)
      })
      .finally(() => {
        setLoading(false)
      })

  }, [selectedDisasterId])


  // Loading state
  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-500">

        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>

        <p className="font-medium">
          Loading disaster data...
        </p>

        <p className="text-sm mt-1">
          Connecting to disaster services
        </p>

      </div>
    )
  }


  // Error state
  if (error || !impactData) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-500">

        <div className="text-4xl mb-3">
          🗺️
        </div>

        <p className="font-semibold text-gray-700">
          Unable to load disaster data
        </p>

        <p className="text-sm mt-1">
          Please make sure the FastAPI backend is running.
        </p>

      </div>
    )
  }


  const polygonPositions = parsePolygonWKT(
    impactData.impact_area
  )


  return (
    <div>

      {/* Disaster Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">

        <div>
          <p className="text-sm font-medium text-gray-700">
            Select Disaster
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Choose an event to view its location and impact
          </p>
        </div>


        <select
          value={selectedDisasterId}
          onChange={(e) =>
            setSelectedDisasterId(Number(e.target.value))
          }
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >

          {disasters
            .filter(
              (disaster) =>
                disaster.latitude !== null &&
                disaster.longitude !== null
            )
            .map((disaster) => (

              <option
                key={disaster.id}
                value={disaster.id}
              >
                {disaster.type} - {disaster.country} - ID {disaster.id}
              </option>

            ))}

        </select>

      </div>


      {/* Map */}
      <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200">

        <MapContainer
          center={[17.34, 78.44]}
          zoom={10}
          className="h-full w-full"
        >

          <MapUpdater
            latitude={impactData?.latitude}
            longitude={impactData?.longitude}
          />


          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {/* Disaster Marker */}
          <Marker
            position={[
              impactData.latitude,
              impactData.longitude,
            ]}
          >

            <Popup>

              <strong>
                {impactData.disaster_type}
              </strong>

              <br />

              Severity: {impactData.severity}

              <br />

              Zone: {impactData.zone_name || "Not assigned"}

            </Popup>

          </Marker>


          {/* Impact Polygon */}
          {polygonPositions && (

            <Polygon
              positions={polygonPositions}
              pathOptions={{
                color: getSeverityColor(
                  impactData.severity
                ),

                fillColor: getSeverityColor(
                  impactData.severity
                ),

                fillOpacity: 0.25,
                weight: 3,
              }}
            />

          )}

        </MapContainer>

      </div>


      {/* Map Information */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          Low Severity
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          Medium Severity
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          High Severity
        </div>

      </div>

    </div>
  )
}


export default DisasterMap