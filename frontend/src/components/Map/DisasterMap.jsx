import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { useNavigate } from "react-router-dom";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  getDisasterImpact,
  getDisasters,
} from "../../services/disasterService";

/* =========================================================
   MAP CONFIGURATION
   ========================================================= */

const MAP_CENTER = [28.3949, 84.124];
const MAP_ZOOM = 7;

/* =========================================================
   SEVERITY COLOR
   ========================================================= */

function getSeverityColor(severity) {
  const value = Number(severity);

  if (value >= 8) return "#c94d44";
  if (value >= 6) return "#d9674c";
  if (value >= 4) return "#d99a2b";

  return "#288b83";
}

/* =========================================================
   INCIDENT MARKER
   ========================================================= */

const incidentIcon = L.divIcon({
  className: "incident-marker",
  html: `
    <span class="incident-marker__core"></span>
    <span class="incident-marker__ring"></span>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/* =========================================================
   FIND LATEST DISASTER
   ========================================================= */

function getLatestDisaster(disasters) {
  if (!Array.isArray(disasters) || disasters.length === 0) {
    return null;
  }

  const validDisasters = disasters.filter(
    (disaster) =>
      disaster &&
      disaster.id != null
  );

  if (validDisasters.length === 0) {
    return null;
  }

  return [...validDisasters].sort(
    (a, b) =>
      Number(b.id) - Number(a.id)
  )[0];
}

/* =========================================================
   CHECK VALID COORDINATES
   ========================================================= */

function hasValidCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/* =========================================================
   MAP VIEW CONTROLLER
   ========================================================= */

function MapViewController({
  latitude,
  longitude,
  selectedDisasterId,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      !hasValidCoordinates(
        latitude,
        longitude
      )
    ) {
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    map.flyTo(
      [lat, lng],
      10,
      {
        duration: 1.2,
      }
    );
  }, [
    latitude,
    longitude,
    selectedDisasterId,
    map,
  ]);

  return null;
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function DisasterMap({
  selectedDisasterId: externalDisasterId,
}) {
  const navigate = useNavigate();

  /* -------------------------------------------------------
     BACKEND STATE
     ------------------------------------------------------- */

  const [disasters, setDisasters] = useState([]);
  const [impactData, setImpactData] = useState(null);

  const [listLoading, setListLoading] = useState(true);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState(false);

  /* -------------------------------------------------------
     SELECTED DISASTER

     The Dashboard URL is the main source of truth when an
     external disaster ID is supplied.

     If no external ID exists, the map can select the latest
     disaster automatically.
     ------------------------------------------------------- */

  const [selectedDisasterId, setSelectedDisasterId] =
    useState(
      externalDisasterId != null
        ? Number(externalDisasterId)
        : null
    );

  /* =======================================================
     SYNC URL / DASHBOARD SELECTION
     ======================================================= */

  useEffect(() => {
    if (externalDisasterId == null) {
      return;
    }

    const newId = Number(externalDisasterId);

    if (!Number.isFinite(newId)) {
      return;
    }

    setSelectedDisasterId((currentId) => {
      if (Number(currentId) === newId) {
        return currentId;
      }

      return newId;
    });
  }, [externalDisasterId]);

  /* =======================================================
     LOAD DISASTER LIST
     ======================================================= */

  async function loadDisasterList() {
    setListLoading(true);

    try {
      const data = await getDisasters();

      const disasterList =
        Array.isArray(data)
          ? data
          : [];

      setDisasters(disasterList);

      /*
       * Only automatically select the latest disaster
       * when Dashboard is NOT already controlling selection.
       */
      if (externalDisasterId == null) {
        const latest =
          getLatestDisaster(disasterList);

        if (latest?.id != null) {
          const latestId = Number(latest.id);

          setSelectedDisasterId(
            (currentId) =>
              currentId == null
                ? latestId
                : currentId
          );
        }
      }
    } catch (error) {
      console.error(
        "Unable to load disaster list:",
        error
      );
    } finally {
      setListLoading(false);
    }
  }

  /* =======================================================
     LOAD SELECTED DISASTER IMPACT
     ======================================================= */

  async function loadImpact(disasterId) {
    if (
      disasterId == null ||
      disasterId === ""
    ) {
      setImpactData(null);
      setImpactError(false);
      setImpactLoading(false);
      return;
    }

    setImpactLoading(true);
    setImpactError(false);

    try {
      const data =
        await getDisasterImpact(
          Number(disasterId)
        );

      setImpactData(data);
    } catch (error) {
      console.error(
        "Unable to load disaster impact:",
        error
      );

      setImpactData(null);
      setImpactError(true);
    } finally {
      setImpactLoading(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    loadDisasterList();
  }, []);

  /* =======================================================
     LOAD IMPACT WHEN SELECTION CHANGES
     ======================================================= */

  useEffect(() => {
    loadImpact(selectedDisasterId);
  }, [selectedDisasterId]);

  /* =======================================================
     BACKEND REFRESH
     ======================================================= */

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getDisasters();

        const updated =
          Array.isArray(data)
            ? data
            : [];

        setDisasters(updated);

        /*
         * IMPORTANT:
         *
         * Do NOT change the current selection during refresh
         * when Dashboard is controlling the disaster.
         *
         * This prevents the map from jumping back.
         */
        if (externalDisasterId == null) {
          const latest =
            getLatestDisaster(updated);

          if (latest?.id != null) {
            const latestId = Number(latest.id);

            setSelectedDisasterId(
              (currentId) =>
                currentId == null
                  ? latestId
                  : currentId
            );
          }
        }
      } catch (error) {
        console.error(
          "Disaster refresh failed:",
          error
        );
      }
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [externalDisasterId]);

  /* =======================================================
     UNIQUE DISASTERS FOR DROPDOWN
     ======================================================= */

  const visibleDisasters = useMemo(() => {
    const uniqueMap = new Map();

    disasters.forEach((disaster) => {
      if (
        disaster &&
        disaster.id != null
      ) {
        uniqueMap.set(
          String(disaster.id),
          disaster
        );
      }
    });

    return Array.from(
      uniqueMap.values()
    );
  }, [disasters]);

  /* =======================================================
     SEVERITY
     ======================================================= */

  const severity =
    Number(
      impactData?.severity || 0
    );

  const severityColor =
    getSeverityColor(severity);

  /* =======================================================
     INCIDENT LOCATION
     ======================================================= */

  const markerLatitude =
    impactData?.latitude;

  const markerLongitude =
    impactData?.longitude;

  const hasIncidentLocation =
    hasValidCoordinates(
      markerLatitude,
      markerLongitude
    );

  /* =======================================================
     HANDLE DROPDOWN CHANGE

     THIS IS THE IMPORTANT FIX.

     Instead of changing only local state, update the
     Dashboard URL too.

     Example:

     /dashboard?disasterId=5

     becomes

     /dashboard?disasterId=8
     ======================================================= */

  function handleDisasterChange(event) {
    const value = event.target.value;

    if (value === "") {
      setSelectedDisasterId(null);

      navigate("/dashboard", {
        replace: true,
      });

      return;
    }

    const nextId = Number(value);

    if (!Number.isFinite(nextId)) {
      return;
    }

    /*
     * Update local state immediately so the map responds
     * without waiting for navigation.
     */
    setSelectedDisasterId(nextId);

    /*
     * Update Dashboard URL.
     *
     * This prevents the parent Dashboard from sending the
     * old disaster ID back to this component.
     */
    navigate(
      `/dashboard?disasterId=${nextId}`,
      {
        replace: true,
      }
    );
  }

  /* =======================================================
     MAIN UI
     ======================================================= */

  return (
    <div className="space-y-3">

      {/* =================================================
          HEADER + DROPDOWN
          ================================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--ink-soft))]">

          <SlidersHorizontal
            size={14}
            className="text-[hsl(var(--teal))]"
          />

          <span className="font-bold uppercase tracking-[.1em]">
            Disaster Map
          </span>

        </div>

        <select
          value={
            selectedDisasterId ?? ""
          }
          onChange={handleDisasterChange}
          disabled={listLoading}
          data-testid="select-disaster-focus"
          className="w-full cursor-pointer rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface))] px-3 py-2 text-[10px] font-bold text-[hsl(var(--foreground))] outline-none transition focus:border-[hsl(var(--teal))] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[260px]"
        >
          <option value="">
            Select disaster
          </option>

          {visibleDisasters.map(
            (disaster) => (
              <option
                key={disaster.id}
                value={disaster.id}
              >
                {disaster.type ||
                  disaster.disaster_type ||
                  "Disaster"}

                {" / "}

                {disaster.country ||
                  "Nepal"}

                {" / ID "}

                {disaster.id}
              </option>
            )
          )}
        </select>

      </div>

      {/* =================================================
          MAP
          ================================================= */}

      <div className="map-surface relative h-[350px] w-full overflow-hidden rounded-xl border border-[hsl(var(--line))] sm:h-[390px]">

        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          minZoom={2}
          maxZoom={18}
          className="h-full w-full"
          scrollWheelZoom={true}
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewController
            latitude={markerLatitude}
            longitude={markerLongitude}
            selectedDisasterId={
              selectedDisasterId
            }
          />

          {hasIncidentLocation && (
            <Marker
              position={[
                Number(markerLatitude),
                Number(markerLongitude),
              ]}
              icon={incidentIcon}
            >
              <Popup>

                <div style={{ minWidth: 180 }}>

                  <strong>
                    {impactData?.disaster_type ||
                      impactData?.type ||
                      "Active Disaster"}
                  </strong>

                  <br />

                  Severity:{" "}
                  {impactData?.severity ??
                    "N/A"}

                  <br />

                  Zone:{" "}
                  {impactData?.zone_name ||
                    "Not assigned"}

                  <br />

                  Latitude:{" "}
                  {Number(
                    markerLatitude
                  ).toFixed(4)}

                  <br />

                  Longitude:{" "}
                  {Number(
                    markerLongitude
                  ).toFixed(4)}

                </div>

              </Popup>
            </Marker>
          )}

        </MapContainer>

        {/* =================================================
            MAP STATUS
            ================================================= */}

        <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2 rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface)/.9)] px-2.5 py-2 shadow-lg backdrop-blur">

          <span className="status-dot text-[hsl(var(--coral))]" />

          <span className="mono text-[9px] uppercase tracking-wider text-[hsl(var(--foreground))]">
            Disaster map active
          </span>

        </div>

        {/* =================================================
            API ERROR
            ================================================= */}

        {impactError && (
          <div className="absolute right-3 top-3 z-[400] flex items-center gap-2 rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface)/.95)] px-3 py-2 shadow-lg">

            <AlertTriangle
              size={13}
              className="text-[hsl(var(--coral))]"
            />

            <span className="text-[9px] font-bold uppercase tracking-wider">
              Disaster data unavailable
            </span>

            <button
              type="button"
              onClick={() =>
                loadImpact(
                  selectedDisasterId
                )
              }
              className="rounded-md p-1 transition hover:bg-[hsl(var(--teal-soft))]"
              title="Reload disaster data"
            >
              <RefreshCw size={12} />
            </button>

          </div>
        )}

        {/* =================================================
            IMPACT LOADING
            ================================================= */}

        {impactLoading && (
          <div className="absolute bottom-3 right-3 z-[400] rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface)/.9)] px-3 py-2 shadow-lg backdrop-blur">

            <span className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-soft))]">
              Loading disaster data...
            </span>

          </div>
        )}

      </div>

      {/* =================================================
          MAP LEGEND
          ================================================= */}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--ink-soft))]">

        <span className="flex items-center gap-2">
          <i className="h-2 w-2 rounded-full bg-[hsl(var(--coral))]" />
          Active Disaster
        </span>

        <span className="flex items-center gap-2">
          <i className="h-2 w-2 rounded-full bg-[hsl(var(--teal))]" />
          Backend Data
        </span>

      </div>

      {/* =================================================
          STATUS
          ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">

        <span className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
          Disasters:{" "}
          {visibleDisasters.length}
        </span>

        <span className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">

          Disaster API:{" "}

          {impactLoading
            ? "Loading"
            : impactError
            ? "Unavailable"
            : impactData
            ? "Connected"
            : "No incident selected"}

        </span>

      </div>

      {/* =================================================
          SELECTED DISASTER INFORMATION
          ================================================= */}

      {impactData && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

          {/* Disaster */}

          <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface-muted)/.45)] p-3">

            <div className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
              Disaster
            </div>

            <div className="mt-1 text-xs font-bold">
              {impactData.disaster_type ||
                impactData.type ||
                "Unknown"}
            </div>

          </div>

          {/* Severity */}

          <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface-muted)/.45)] p-3">

            <div className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
              Severity
            </div>

            <div
              className="mt-1 text-xs font-bold"
              style={{
                color: severityColor,
              }}
            >
              {impactData.severity ??
                "N/A"}
            </div>

          </div>

          {/* Zone */}

          <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface-muted)/.45)] p-3">

            <div className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
              Zone
            </div>

            <div className="mt-1 text-xs font-bold">
              {impactData.zone_name ||
                "Not assigned"}
            </div>

          </div>

          {/* Location */}

          <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface-muted)/.45)] p-3">

            <div className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
              Location
            </div>

            <div className="mt-1 text-xs font-bold">

              {hasIncidentLocation
                ? `${Number(
                    markerLatitude
                  ).toFixed(4)}, ${Number(
                    markerLongitude
                  ).toFixed(4)}`
                : "Coordinates unavailable"}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default DisasterMap;