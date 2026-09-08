import { useEffect } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet"

import L from "leaflet"
import "leaflet/dist/leaflet.css"


// =========================================================
// INDIA DEFAULT CENTER
// =========================================================

const INDIA_CENTER = [20.5937, 78.9629]


// =========================================================
// FIX DEFAULT LEAFLET MARKER ICON
// =========================================================

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})


// =========================================================
// CUSTOM MARKERS
// =========================================================

function createMarkerIcon(color) {

  return L.divIcon({

    className: "",

    html: `
      <div
        style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        "
      ></div>
    `,

    iconSize: [24, 24],

    iconAnchor: [12, 12],

    popupAnchor: [0, -12],

  })
}


const vehicleIcon =
  createMarkerIcon("#f97316")


const criticalIcon =
  createMarkerIcon("#ef4444")


const highIcon =
  createMarkerIcon("#eab308")


const normalIcon =
  createMarkerIcon("#3b82f6")


// =========================================================
// MAP AUTO FIT
// =========================================================

function MapAutoFit({
  points,
}) {

  const map = useMap()


  useEffect(() => {

    if (!points.length) {
      return
    }


    const validPoints =
      points.filter(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          Number.isFinite(point[0]) &&
          Number.isFinite(point[1])
      )


    if (!validPoints.length) {
      return
    }


    const bounds =
      L.latLngBounds(validPoints)


    map.fitBounds(
      bounds,
      {
        padding: [50, 50],
        maxZoom: 7,
      }
    )

  }, [map, points])


  return null
}


// =========================================================
// HELPERS
// =========================================================

function getZoneSeverity(route) {

  const severity =
    Number(route?.severity || 0)

  return severity
}


function getZoneIcon(route) {

  const severity =
    getZoneSeverity(route)


  if (severity >= 80) {
    return criticalIcon
  }


  if (severity >= 60) {
    return highIcon
  }


  return normalIcon
}


function getRouteColor(index) {

  const colors = [
    "#f97316",
    "#3b82f6",
    "#22c55e",
    "#a855f7",
    "#ec4899",
    "#14b8a6",
  ]


  return colors[
    index % colors.length
  ]
}


// =========================================================
// ROUTE MAP
// =========================================================

function RouteMap({
  routeData,
}) {

  const routeDetails =
    Array.isArray(
      routeData?.route_details
    )
      ? routeData.route_details
      : []


  const routes =
    Array.isArray(
      routeData?.routes
    )
      ? routeData.routes
      : []


  // =======================================================
  // VEHICLES
  // =======================================================

  const vehicles = []


  if (
    Array.isArray(
      routeData?.vehicle_starts
    )
  ) {

    routeData.vehicle_starts.forEach(
      (vehicle) => {

        if (
          vehicle.latitude != null &&
          vehicle.longitude != null
        ) {

          vehicles.push(
            vehicle
          )

        }

      }
    )

  }


  // =======================================================
  // ZONES
  // =======================================================

  const zones = []


  const seenZones =
    new Set()


  routeDetails.forEach(
    (detail) => {

      const zone =
        detail?.to


      if (
        !zone ||
        zone.latitude == null ||
        zone.longitude == null
      ) {

        return

      }


      const key =
        detail.zone_id ??
        `${zone.latitude}-${zone.longitude}`


      if (
        seenZones.has(key)
      ) {

        return

      }


      seenZones.add(key)


      zones.push({
        ...detail,
        severity:
          detail.severity ||
          0,
      })

    }
  )


  // =======================================================
  // MAP POINTS FOR AUTO FIT
  // =======================================================

  const mapPoints = []


  vehicles.forEach(
    (vehicle) => {

      mapPoints.push([
        Number(vehicle.latitude),
        Number(vehicle.longitude),
      ])

    }
  )


  zones.forEach(
    (zone) => {

      mapPoints.push([
        Number(zone.to.latitude),
        Number(zone.to.longitude),
      ])

    }
  )


  // =======================================================
  // ROUTE PATHS
  // =======================================================

  const visibleRoutes =
    routeDetails.filter(
      (detail) =>
        detail.route_available &&
        Array.isArray(
          detail.route_path
        ) &&
        detail.route_path.length >= 2
    )


  return (

    <div
      className="
        w-full
        h-[520px]
        rounded-2xl
        overflow-hidden
        border
        border-slate-200
        dark:border-slate-700
        shadow-sm
      "
    >

      <MapContainer

        center={INDIA_CENTER}

        zoom={5}

        scrollWheelZoom={true}

        style={{
          width: "100%",
          height: "100%",
        }}

      >

        {/* =================================================
            MAP TILES
        ================================================= */}

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        {/* =================================================
            AUTO FIT
        ================================================= */}

        <MapAutoFit
          points={mapPoints}
        />


        {/* =================================================
            VEHICLE MARKERS
        ================================================= */}

        {vehicles.map(
          (vehicle) => (

            <Marker

              key={`vehicle-${vehicle.vehicle_id}`}

              position={[
                Number(vehicle.latitude),
                Number(vehicle.longitude),
              ]}

              icon={vehicleIcon}

            >

              <Popup>

                <div className="min-w-[180px]">

                  <h3 className="
                    font-bold
                    text-slate-900
                    mb-2
                  ">

                    🚚 {vehicle.vehicle_name}

                  </h3>


                  <p className="text-sm">

                    <strong>Status:</strong>{" "}

                    {vehicle.route_status ||
                      "Available"}

                  </p>


                  {vehicle.nearest_road_node && (

                    <p className="text-sm mt-1">

                      Connected to open road

                    </p>

                  )}

                </div>

              </Popup>

            </Marker>

          )
        )}


        {/* =================================================
            ZONE MARKERS
        ================================================= */}

        {zones.map(
          (zone, index) => (

            <Marker

              key={
                `zone-${zone.zone_id ?? index}`
              }

              position={[
                Number(zone.to.latitude),
                Number(zone.to.longitude),
              ]}

              icon={getZoneIcon(zone)}

            >

              <Popup>

                <div className="min-w-[200px]">

                  <h3 className="
                    font-bold
                    text-slate-900
                    mb-2
                  ">

                    📍 {zone.zone_name}

                  </h3>


                  <p className="text-sm">

                    <strong>Severity:</strong>{" "}

                    {Number(
                      zone.severity || 0
                    ).toFixed(2)}

                  </p>


                  <p className="text-sm">

                    <strong>Allocated:</strong>{" "}

                    {Number(
                      zone.allocated || 0
                    ).toFixed(2)}

                  </p>


                  <p className="text-sm">

                    <strong>Distance:</strong>{" "}

                    {zone.distance_km != null
                      ? `${zone.distance_km} km`
                      : "N/A"}

                  </p>


                  <p className="text-sm">

                    <strong>Travel:</strong>{" "}

                    {zone.travel_time_minutes != null
                      ? `${zone.travel_time_minutes} min`
                      : "N/A"}

                  </p>


                  <p className="text-sm mt-1">

                    <strong>Route:</strong>{" "}

                    {zone.route_status ||
                      "Unknown"}

                  </p>

                </div>

              </Popup>

            </Marker>

          )
        )}


        {/* =================================================
            ACTUAL OPTIMIZED ROUTES
        ================================================= */}

        {visibleRoutes.map(
          (detail, index) => {

            const path =
              detail.route_path
                .map(
                  (point) => [

                    Number(
                      point.latitude
                    ),

                    Number(
                      point.longitude
                    ),

                  ]
                )
                .filter(
                  (point) =>
                    Number.isFinite(point[0]) &&
                    Number.isFinite(point[1])
                )


            if (path.length < 2) {
              return null
            }


            return (

              <Polyline

                key={
                  `route-${detail.vehicle_id}-${detail.zone_id}-${index}`
                }

                positions={path}

                pathOptions={{
                  color:
                    getRouteColor(index),

                  weight: 5,

                  opacity: 0.85,

                  dashArray: "10 8",
                }}

              >

                <Popup>

                  <div className="min-w-[210px]">

                    <h3 className="
                      font-bold
                      text-slate-900
                      mb-2
                    ">

                      🚚 Optimized Route

                    </h3>


                    <p className="text-sm">

                      <strong>Vehicle:</strong>{" "}

                      {detail.vehicle_name}

                    </p>


                    <p className="text-sm">

                      <strong>Destination:</strong>{" "}

                      {detail.zone_name}

                    </p>


                    <p className="text-sm">

                      <strong>Distance:</strong>{" "}

                      {detail.distance_km != null
                        ? `${detail.distance_km} km`
                        : "N/A"}

                    </p>


                    <p className="text-sm">

                      <strong>Travel Time:</strong>{" "}

                      {detail.travel_time_minutes != null
                        ? `${detail.travel_time_minutes} min`
                        : "N/A"}

                    </p>


                    <p className="text-sm">

                      <strong>Status:</strong>{" "}

                      {detail.route_status ||
                        "Available"}

                    </p>

                  </div>

                </Popup>

              </Polyline>

            )

          }
        )}

      </MapContainer>


      {/* ===================================================
          LEGEND
      =================================================== */}

      <div className="
        absolute
        mt-[-120px]
        ml-4
        z-[1000]
        bg-white/95
        dark:bg-slate-900/95
        rounded-xl
        shadow-lg
        px-4
        py-3
        text-xs
        space-y-2
      ">

        <div className="font-bold mb-2">

          Route Map

        </div>


        <div className="flex items-center gap-2">

          <span className="
            w-3
            h-3
            rounded-full
            bg-orange-500"
          />

          Vehicle / Depot

        </div>


        <div className="flex items-center gap-2">

          <span className="
            w-3
            h-3
            rounded-full
            bg-red-500"
          />

          Critical Zone

        </div>


        <div className="flex items-center gap-2">

          <span className="
            w-3
            h-3
            rounded-full
            bg-yellow-500"
          />

          High Priority"

        </div>


        <div className="flex items-center gap-2">

          <span className="
            w-3
            h-3
            rounded-full
            bg-blue-500"
          />

          Normal Zone

        </div>


        <div className="flex items-center gap-2">

          <span className="
            w-5
            border-t-2
            border-dashed
            border-orange-500"
          />

          Optimized Route

        </div>

      </div>

    </div>

  )
}


export default RouteMap