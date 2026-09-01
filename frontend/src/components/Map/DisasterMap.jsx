import { useEffect, useState } from "react"

import { divIcon } from "leaflet"

import {
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react"

import {
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet"

import "leaflet/dist/leaflet.css"

import {
  getDisasterImpact,
  getDisasters,
} from "../../services/disasterService"


/* =========================================================
   POLYGON PARSER
   ========================================================= */

function parsePolygonWKT(wkt) {
  if (!wkt || typeof wkt !== "string") {
    return null
  }

  try {
    return wkt
      .replace(/^POLYGON\s*\(\(/i, "")
      .replace(/\)\)\s*$/, "")
      .split(",")
      .map((point) => {
        const [longitude, latitude] = point
          .trim()
          .split(/\s+/)
          .map(Number)

        return [latitude, longitude]
      })
      .filter(
        ([latitude, longitude]) =>
          Number.isFinite(latitude) &&
          Number.isFinite(longitude)
      )
  } catch {
    return null
  }
}


/* =========================================================
   MAP POSITION UPDATER
   ========================================================= */

function MapUpdater({
  latitude,
  longitude,
}) {
  const map = useMap()

  useEffect(() => {
    if (
      latitude != null &&
      longitude != null &&
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude))
    ) {
      map.setView(
        [
          Number(latitude),
          Number(longitude),
        ],
        7,
        {
          animate: true,
        }
      )
    }
  }, [
    latitude,
    longitude,
    map,
  ])

  return null
}


/* =========================================================
   SEVERITY COLOR
   ========================================================= */

function getSeverityColor(severity) {
  if (severity >= 8) {
    return "#c94d44"
  }

  if (severity >= 6) {
    return "#d9674c"
  }

  if (severity >= 4) {
    return "#d99a2b"
  }

  return "#288b83"
}


/* =========================================================
   INCIDENT MARKER
   ========================================================= */

const incidentIcon = divIcon({
  className: "incident-marker",
  html:
    '<span class="incident-marker__core"></span>' +
    '<span class="incident-marker__ring"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})


/* =========================================================
   FIND LATEST DISASTER
   ========================================================= */

function getLatestDisaster(disasters) {
  if (
    !Array.isArray(disasters) ||
    disasters.length === 0
  ) {
    return null
  }

  const validDisasters = disasters.filter(
    (disaster) =>
      disaster &&
      disaster.id != null
  )

  if (validDisasters.length === 0) {
    return null
  }

  return [...validDisasters].sort(
    (a, b) =>
      Number(b.id) - Number(a.id)
  )[0]
}


/* =========================================================
   DISASTER MAP
   ========================================================= */

function DisasterMap({
  selectedDisasterId: externalDisasterId,
}) {

  const [impactData, setImpactData] = useState(null)

  const [disasters, setDisasters] = useState([])

  /*
   * No hardcoded disaster ID anymore.
   */
  const [
    selectedDisasterId,
    setSelectedDisasterId,
  ] = useState(
    externalDisasterId != null
      ? Number(externalDisasterId)
      : null
  )

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(false)

  const [listLoading, setListLoading] = useState(true)


  /* =======================================================
     LOAD DISASTER LIST
     ======================================================= */

  const loadDisasterList = async (
    shouldSelectLatest = true
  ) => {

    setListLoading(true)

    try {

      const data = await getDisasters()

      const disasterList =
        Array.isArray(data)
          ? data
          : []

      setDisasters(disasterList)

      /*
       * When Dashboard has not supplied a selected ID,
       * automatically use the latest disaster.
       */
      if (
        shouldSelectLatest &&
        externalDisasterId == null
      ) {

        const latestDisaster =
          getLatestDisaster(
            disasterList
          )

        if (latestDisaster?.id) {

          setSelectedDisasterId(
            Number(latestDisaster.id)
          )
        }
      }

    } catch (loadError) {

      console.error(
        "Unable to load disaster list:",
        loadError
      )

      setError(true)

    } finally {

      setListLoading(false)

    }
  }


  /* =======================================================
     LOAD SELECTED IMPACT
     ======================================================= */

  const loadImpact = async (
    disasterId = selectedDisasterId
  ) => {

    if (!disasterId) {
      setImpactData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)

    try {

      const data =
        await getDisasterImpact(
          Number(disasterId)
        )

      setImpactData(data)

    } catch (loadError) {

      console.error(
        "Unable to load disaster impact:",
        loadError
      )

      setImpactData(null)
      setError(true)

    } finally {

      setLoading(false)

    }
  }


  /* =======================================================
     INITIAL DISASTER LIST
     ======================================================= */

  useEffect(() => {

    loadDisasterList(
      externalDisasterId == null
    )

  }, [])


  /* =======================================================
     SYNC WITH DASHBOARD
     ======================================================= */

  useEffect(() => {

    if (
      externalDisasterId != null &&
      Number(externalDisasterId) !==
        Number(selectedDisasterId)
    ) {

      setSelectedDisasterId(
        Number(externalDisasterId)
      )

    }

  }, [
    externalDisasterId,
  ])


  /* =======================================================
     LOAD IMPACT WHEN SELECTED DISASTER CHANGES
     ======================================================= */

  useEffect(() => {

    if (selectedDisasterId != null) {
      loadImpact(
        selectedDisasterId
      )
    }

  }, [
    selectedDisasterId,
  ])


  /* =======================================================
     AUTOMATIC REFRESH
     ======================================================= */

  useEffect(() => {

    const refreshInterval =
      setInterval(async () => {

        try {

          const data =
            await getDisasters()

          const updatedDisasters =
            Array.isArray(data)
              ? data
              : []

          setDisasters(
            updatedDisasters
          )


          /*
           * Find the newest disaster.
           */
          const latestDisaster =
            getLatestDisaster(
              updatedDisasters
            )

          if (!latestDisaster?.id) {
            return
          }

          const latestId =
            Number(latestDisaster.id)


          /*
           * If Dashboard is not controlling
           * the selection, use latest disaster.
           */
          if (
            externalDisasterId == null
          ) {

            setSelectedDisasterId(
              (currentId) => {

                if (
                  Number(currentId) !==
                  latestId
                ) {
                  return latestId
                }

                return currentId
              }
            )

          }

        } catch (refreshError) {

          console.error(
            "Unable to refresh disaster list:",
            refreshError
          )

        }

      }, 30000)


    return () => {
      clearInterval(
        refreshInterval
      )
    }

  }, [
    externalDisasterId,
  ])


  /* =======================================================
     DERIVED MAP DATA
     ======================================================= */

  const polygonPositions =
    parsePolygonWKT(
      impactData?.impact_area
    )

  const severityColor =
    getSeverityColor(
      Number(
        impactData?.severity || 0
      )
    )


  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {

    return (

      <div className="flex h-full min-h-[380px] flex-col justify-between rounded-xl bg-[hsl(var(--surface-muted)/.55)] p-4">

        <div className="h-9 w-56 animate-pulse rounded-lg bg-[hsl(var(--line))]" />

        <div className="space-y-3">

          <div className="h-32 animate-pulse rounded-xl bg-[hsl(var(--line)/.7)]" />

          <div className="h-3 w-2/3 animate-pulse rounded bg-[hsl(var(--line))]" />

          <div className="h-3 w-1/2 animate-pulse rounded bg-[hsl(var(--line))]" />

        </div>

        <p className="mono text-[9px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
          Syncing incident layer
        </p>

      </div>

    )

  }


  /* =======================================================
     ERROR
     ======================================================= */

  if (error || !impactData) {

    return (

      <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-xl bg-[hsl(var(--surface-muted)/.5)] px-6 text-center">

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--coral-soft))] text-[hsl(var(--coral))]">

          <AlertTriangle size={21} />

        </div>

        <p className="mt-4 text-sm font-extrabold text-[hsl(var(--foreground))]">
          Incident layer unavailable
        </p>

        <p className="mt-2 max-w-xs text-[11px] leading-5 text-[hsl(var(--ink-soft))]">
          The operations service did not return a live impact record.
        </p>

        <button
          type="button"
          data-testid="button-retry-disaster-map"
          onClick={() =>
            loadImpact()
          }
          className="mt-5 flex items-center gap-2 rounded-lg border border-[hsl(var(--line))] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--teal)/.4)] hover:bg-[hsl(var(--teal-soft))]"
        >

          <RefreshCw size={13} />

          Retry connection

        </button>

      </div>

    )

  }


  /* =======================================================
     UNIQUE VISIBLE DISASTERS
     ======================================================= */

  const visibleDisasters =
    Array.from(

      new Map(

        disasters

          .filter(
            (disaster) =>
              disaster.latitude != null &&
              disaster.longitude != null
          )

          .map(
            (disaster) => [

              `${disaster.type}|${disaster.country}|${Number(
                disaster.latitude
              ).toFixed(3)}|${Number(
                disaster.longitude
              ).toFixed(3)}`,

              disaster,

            ]
          )

      ).values()

    )


  /* =======================================================
     MAP UI
     ======================================================= */

  return (

    <div className="space-y-3">

      {/* MAP CONTROLS */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--ink-soft))]">

          <SlidersHorizontal
            size={14}
            className="text-[hsl(var(--teal))]"
          />

          <span className="font-bold uppercase tracking-[.1em]">
            Incident focus
          </span>

        </div>


        <select
          value={
            selectedDisasterId ?? ""
          }
          onChange={(event) => {

            const nextId =
              Number(
                event.target.value
              )

            if (
              Number.isFinite(nextId) &&
              nextId > 0
            ) {

              setSelectedDisasterId(
                nextId
              )

            }

          }}
          disabled={
            listLoading ||
            visibleDisasters.length === 0
          }
          data-testid="select-disaster-focus"
          className="w-full rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface))] px-3 py-2 text-[10px] font-bold text-[hsl(var(--foreground))] outline-none transition focus:border-[hsl(var(--teal))] sm:w-auto sm:min-w-[240px]"
        >

          {visibleDisasters.length === 0 && (

            <option
              value={
                selectedDisasterId ?? ""
              }
            >
              Primary incident /{" "}
              {selectedDisasterId ?? "—"}
            </option>

          )}


          {visibleDisasters.map(
            (disaster) => (

              <option
                key={disaster.id}
                value={disaster.id}
              >

                {disaster.type} /{" "}
                {disaster.country} /{" "}
                {disaster.id}

              </option>

            )
          )}

        </select>

      </div>


      {/* MAP */}

      <div className="map-surface relative h-[350px] w-full overflow-hidden rounded-xl border border-[hsl(var(--line))] sm:h-[390px]">

        <MapContainer
          center={[
            17.34,
            78.44,
          ]}
          zoom={10}
          className="h-full w-full"
          scrollWheelZoom
        >

          <MapUpdater
            latitude={
              impactData.latitude
            }
            longitude={
              impactData.longitude
            }
          />


          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {/* CURRENT DISASTER POINTER */}

          <Marker
            position={[
              Number(
                impactData.latitude
              ),
              Number(
                impactData.longitude
              ),
            ]}
            icon={incidentIcon}
          >

            <Popup>

              <strong>
                {impactData.disaster_type}
              </strong>

              <br />

              Severity:{" "}
              {impactData.severity}

              <br />

              Zone:{" "}
              {impactData.zone_name ||
                "Not assigned"}

            </Popup>

          </Marker>


          {/* IMPACT AREA */}

          {polygonPositions && (

            <Polygon
              positions={
                polygonPositions
              }
              pathOptions={{
                color: severityColor,
                fillColor: severityColor,
                fillOpacity: 0.2,
                weight: 2.5,
              }}
            />

          )}

        </MapContainer>


        {/* MAP STATUS */}

        <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2 rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface)/.9)] px-2.5 py-2 shadow-lg backdrop-blur">

          <span className="status-dot text-[hsl(var(--coral))]" />

          <span className="mono text-[9px] uppercase tracking-wider text-[hsl(var(--foreground))]">
            Active perimeter
          </span>

        </div>

      </div>


      {/* LEGEND */}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--ink-soft))]">

        <span className="flex items-center gap-2">

          <i className="h-2 w-2 rounded-full bg-[hsl(var(--teal))]" />

          Low / monitor

        </span>

        <span className="flex items-center gap-2">

          <i className="h-2 w-2 rounded-full bg-[hsl(var(--amber))]" />

          Elevated / prepare

        </span>

        <span className="flex items-center gap-2">

          <i className="h-2 w-2 rounded-full bg-[hsl(var(--coral))]" />

          Critical / act

        </span>

      </div>

    </div>

  )
}


export default DisasterMap