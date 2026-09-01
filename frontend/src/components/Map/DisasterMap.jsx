import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  getDisasterImpact,
  getDisasters,
} from "../../services/disasterService";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const NEPAL_GEOJSON_URL = "/data/nepal_disaster_zones.geojson";

const NEPAL_CENTER = [28.3949, 84.124];
const NEPAL_ZOOM = 7;

/* =========================================================
   FIT MAP TO NEPAL GEOJSON
   Runs only when the GeoJSON is first loaded.
   Backend data will NOT change the map position.
   ========================================================= */

function FitNepalMap({ geoJsonData }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (!geoJsonData || hasFitted.current) {
      return;
    }

    try {
      const layer = L.geoJSON(geoJsonData);
      const bounds = layer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 9,
          animate: false,
        });

        hasFitted.current = true;
      }
    } catch (error) {
      console.error("Could not fit Nepal map:", error);
    }
  }, [geoJsonData, map]);

  return null;
}

/* =========================================================
   SEVERITY COLOR
   ========================================================= */

function getSeverityColor(severity) {
  const value = Number(severity);

  if (value >= 8) {
    return "#c94d44";
  }

  if (value >= 6) {
    return "#d9674c";
  }

  if (value >= 4) {
    return "#d99a2b";
  }

  return "#288b83";
}

/* =========================================================
   GEOJSON DISASTER COLOR
   ========================================================= */

function getDisasterZoneColor(properties = {}) {
  const text = [
    properties.event_type,
    properties.obj_desc,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    text.includes("landslide") ||
    text.includes("mass movement")
  ) {
    return "#d9674c";
  }

  if (
    text.includes("flood") ||
    text.includes("water")
  ) {
    return "#288b83";
  }

  if (
    text.includes("earthquake") ||
    text.includes("seismic")
  ) {
    return "#c94d44";
  }

  if (
    text.includes("fire") ||
    text.includes("burn")
  ) {
    return "#d99a2b";
  }

  return "#7c6f64";
}

/* =========================================================
   GEOJSON STYLE
   ========================================================= */

function disasterZoneStyle(feature) {
  const color = getDisasterZoneColor(
    feature?.properties || {}
  );

  return {
    color,
    weight: 1.5,
    opacity: 0.9,
    fillColor: color,
    fillOpacity: 0.32,
  };
}

/* =========================================================
   GEOJSON POPUP
   ========================================================= */

function onEachDisasterZone(feature, layer) {
  const properties = feature?.properties || {};

  const eventType =
    properties.event_type || "Unknown";

  const description =
    properties.obj_desc || "Not available";

  const method =
    properties.det_method || "Not available";

  const area =
    properties.area != null
      ? Number(properties.area).toFixed(2)
      : "Not available";

  layer.bindPopup(`
    <div style="min-width:220px">
      <div style="
        font-size:13px;
        font-weight:800;
        margin-bottom:8px;
      ">
        Nepal Disaster Zone
      </div>

      <div style="
        font-size:11px;
        line-height:1.7;
      ">
        <strong>Event:</strong>
        ${eventType}
        <br />

        <strong>Type:</strong>
        ${description}
        <br />

        <strong>Detection:</strong>
        ${method}
        <br />

        <strong>Area:</strong>
        ${area}
      </div>
    </div>
  `);
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
   CHECK WHETHER COORDINATES ARE IN NEPAL
   ========================================================= */

function isValidNepalCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 26 &&
    lat <= 31 &&
    lng >= 80 &&
    lng <= 89
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function DisasterMap({
  selectedDisasterId: externalDisasterId,
}) {
  /* -------------------------------------------------------
     NEPAL GEOJSON STATE
     ------------------------------------------------------- */

  const [geoJsonData, setGeoJsonData] = useState(null);

  const [geoJsonLoading, setGeoJsonLoading] =
    useState(true);

  const [geoJsonError, setGeoJsonError] =
    useState(false);

  /* -------------------------------------------------------
     BACKEND STATE
     ------------------------------------------------------- */

  const [disasters, setDisasters] = useState([]);

  const [impactData, setImpactData] = useState(null);

  const [listLoading, setListLoading] =
    useState(true);

  const [impactLoading, setImpactLoading] =
    useState(false);

  const [impactError, setImpactError] =
    useState(false);

  /* -------------------------------------------------------
     SELECTED DISASTER

     IMPORTANT:
     This controls the backend information only.
     It does NOT control the Nepal map center.
     ------------------------------------------------------- */

  const [
    selectedDisasterId,
    setSelectedDisasterId,
  ] = useState(
    externalDisasterId != null
      ? Number(externalDisasterId)
      : null
  );

  /* =======================================================
     LOAD NEPAL GEOJSON
     ======================================================= */

  async function loadNepalGeoJSON() {
    setGeoJsonLoading(true);
    setGeoJsonError(false);

    try {
      const response = await fetch(
        NEPAL_GEOJSON_URL,
        {
          cache: "no-cache",
        }
      );

      if (!response.ok) {
        throw new Error(
          `GeoJSON request failed: ${response.status}`
        );
      }

      const data = await response.json();

      if (
        !data ||
        data.type !== "FeatureCollection"
      ) {
        throw new Error(
          "Invalid GeoJSON FeatureCollection"
        );
      }

      if (
        !Array.isArray(data.features)
      ) {
        throw new Error(
          "GeoJSON does not contain features"
        );
      }

      console.log(
        "Nepal GeoJSON loaded:",
        data.features.length,
        "features"
      );

      setGeoJsonData(data);
    } catch (error) {
      console.error(
        "Unable to load Nepal GeoJSON:",
        error
      );

      setGeoJsonData(null);
      setGeoJsonError(true);
    } finally {
      setGeoJsonLoading(false);
    }
  }

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
       * If Dashboard did not provide a disaster,
       * automatically select the latest backend disaster.
       *
       * This changes the selected information,
       * NOT the map location.
       */

      if (
        externalDisasterId == null
      ) {
        const latest =
          getLatestDisaster(
            disasterList
          );

        if (latest?.id != null) {
          setSelectedDisasterId(
            Number(latest.id)
          );
        }
      }
    } catch (error) {
      console.error(
        "Unable to load disaster list:",
        error
      );

      /*
       * The Nepal map continues to work even
       * when the backend is unavailable.
       */
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
    loadNepalGeoJSON();
    loadDisasterList();
  }, []);

  /* =======================================================
     SYNC WITH DASHBOARD
     ======================================================= */

  useEffect(() => {
    if (externalDisasterId == null) {
      return;
    }

    const newId =
      Number(externalDisasterId);

    if (
      Number.isFinite(newId) &&
      newId !== Number(selectedDisasterId)
    ) {
      setSelectedDisasterId(newId);
    }
  }, [
    externalDisasterId,
  ]);

  /* =======================================================
     LOAD IMPACT WHEN SELECTION CHANGES
     ======================================================= */

  useEffect(() => {
    loadImpact(selectedDisasterId);
  }, [
    selectedDisasterId,
  ]);

  /* =======================================================
     BACKEND REFRESH

     Refreshes disaster information every 30 seconds.

     IMPORTANT:
     It never changes the map center.
     ======================================================= */

  useEffect(() => {
    const interval =
      setInterval(async () => {
        try {
          const data =
            await getDisasters();

          const updated =
            Array.isArray(data)
              ? data
              : [];

          setDisasters(updated);

          /*
           * Only automatically change the selected
           * disaster when Dashboard isn't controlling it.
           */

          if (
            externalDisasterId == null
          ) {
            const latest =
              getLatestDisaster(
                updated
              );

            if (latest?.id != null) {
              const latestId =
                Number(latest.id);

              setSelectedDisasterId(
                (current) =>
                  Number(current) !==
                  latestId
                    ? latestId
                    : current
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
  }, [
    externalDisasterId,
  ]);

  /* =======================================================
     UNIQUE DISASTERS FOR DROPDOWN
     ======================================================= */

  const visibleDisasters =
    useMemo(() => {
      const map =
        new Map();

      disasters.forEach(
        (disaster) => {
          if (
            disaster &&
            disaster.id != null
          ) {
            map.set(
              String(disaster.id),
              disaster
            );
          }
        }
      );

      return Array.from(
        map.values()
      );
    }, [
      disasters,
    ]);

  /* =======================================================
     SEVERITY
     ======================================================= */

  const severity =
    Number(
      impactData?.severity || 0
    );

  const severityColor =
    getSeverityColor(
      severity
    );

  /* =======================================================
     VALID BACKEND INCIDENT LOCATION

     We intentionally do NOT use invalid coordinates.
     ======================================================= */

  const markerLatitude =
    impactData?.latitude;

  const markerLongitude =
    impactData?.longitude;

  const hasValidIncidentLocation =
    isValidNepalCoordinate(
      markerLatitude,
      markerLongitude
    );

  /* =======================================================
     LOADING SCREEN
     ======================================================= */

  if (geoJsonLoading) {
    return (
      <div className="flex h-full min-h-[380px] flex-col justify-between rounded-xl bg-[hsl(var(--surface-muted)/.55)] p-4">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-[hsl(var(--line))]" />

        <div className="space-y-3">
          <div className="h-32 animate-pulse rounded-xl bg-[hsl(var(--line)/.7)]" />

          <div className="h-3 w-2/3 animate-pulse rounded bg-[hsl(var(--line))]" />

          <div className="h-3 w-1/2 animate-pulse rounded bg-[hsl(var(--line))]" />
        </div>

        <p className="mono text-[9px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
          Loading Nepal disaster zones...
        </p>
      </div>
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
            Nepal Disaster Zones
          </span>
        </div>

        <select
          value={
            selectedDisasterId ?? ""
          }
          onChange={(event) => {
            const value =
              event.target.value;

            if (value === "") {
              setSelectedDisasterId(null);
              return;
            }

            const nextId =
              Number(value);

            if (
              Number.isFinite(nextId)
            ) {
              setSelectedDisasterId(
                nextId
              );
            }
          }}
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
                  "Disaster"}{" "}
                /{" "}
                {disaster.country ||
                  "Nepal"}{" "}
                / ID{" "}
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
          center={NEPAL_CENTER}
          zoom={NEPAL_ZOOM}
          minZoom={5}
          maxZoom={15}
          className="h-full w-full"
          scrollWheelZoom={true}
        >

          {/* OpenStreetMap */}
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fit to Nepal GeoJSON ONLY */}
          <FitNepalMap
            geoJsonData={
              geoJsonData
            }
          />

          {/* Nepal disaster polygons */}
          {geoJsonData && (
            <GeoJSON
              key="nepal-disaster-zones"
              data={geoJsonData}
              style={
                disasterZoneStyle
              }
              onEachFeature={
                onEachDisasterZone
              }
            />
          )}

          {/* Backend incident marker */}
          {hasValidIncidentLocation && (
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
            Nepal disaster layer active
          </span>
        </div>

        {/* =================================================
            GEOJSON ERROR
            ================================================= */}

        {geoJsonError && (
          <div className="absolute right-3 top-3 z-[400] flex items-center gap-2 rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface)/.95)] px-3 py-2 shadow-lg">

            <AlertTriangle
              size={13}
              className="text-[hsl(var(--coral))]"
            />

            <span className="text-[9px] font-bold uppercase tracking-wider">
              Nepal layer unavailable
            </span>

            <button
              type="button"
              onClick={
                loadNepalGeoJSON
              }
              className="rounded-md p-1 transition hover:bg-[hsl(var(--teal-soft))]"
              title="Reload Nepal disaster zones"
            >
              <RefreshCw
                size={12}
              />
            </button>
          </div>
        )}

        {/* =================================================
            IMPACT LOADING
            ================================================= */}

        {impactLoading && (
          <div className="absolute right-3 bottom-3 z-[400] rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface)/.9)] px-3 py-2 shadow-lg backdrop-blur">
            <span className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-soft))]">
              Loading disaster data...
            </span>
          </div>
        )}

      </div>

      {/* =================================================
          LEGEND
          ================================================= */}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--ink-soft))]">

        <span className="flex items-center gap-2">
          <i className="h-2 w-2 rounded-full bg-[hsl(var(--teal))]" />
          Flood / Water
        </span>

        <span className="flex items-center gap-2">
          <i className="h-2 w-2 rounded-full bg-[hsl(var(--amber))]" />
          Fire / Other
        </span>

        <span className="flex items-center gap-2">
          <i className="h-2 w-2 rounded-full bg-[hsl(var(--coral))]" />
          Landslide / Critical
        </span>

      </div>

      {/* =================================================
          STATUS
          ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">

        <span className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
          GeoJSON:{" "}
          {geoJsonData
            ? `${geoJsonData.features?.length || 0} zones loaded`
            : "Unavailable"}
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

          <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface-muted)/.45)] p-3">
            <div className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
              Zone
            </div>

            <div className="mt-1 text-xs font-bold">
              {impactData.zone_name ||
                "Not assigned"}
            </div>
          </div>

          <div className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--surface-muted)/.45)] p-3">
            <div className="mono text-[8px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
              Location
            </div>

            <div className="mt-1 text-xs font-bold">
              {hasValidIncidentLocation
                ? "Nepal"
                : "Map layer"}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default DisasterMap;