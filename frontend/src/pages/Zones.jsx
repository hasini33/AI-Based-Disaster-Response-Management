import { useEffect, useState } from "react"

import {
  Search,
  X,
  MapPin,
  Users,
  TriangleAlert,
  ShieldAlert,
  Activity,
  Navigation,
  ArrowUpRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react"


const API_BASE_URL = "http://127.0.0.1:8000"


function getRiskFromSeverity(severity) {

  const value = Number(severity)

  if (value >= 80) return "Critical"
  if (value >= 60) return "High"
  if (value >= 30) return "Medium"

  return "Low"
}


function getPriorityFromRisk(risk) {

  if (risk === "Critical") return "Immediate"
  if (risk === "High") return "High"
  if (risk === "Medium") return "Moderate"

  return "Monitor"
}


function getPriorityFromOverride(override, fallbackRisk) {

  const value = Number(override)

  if (!Number.isFinite(value)) {
    return getPriorityFromRisk(fallbackRisk)
  }

  if (value >= 5) return "Immediate"
  if (value >= 4) return "High"
  if (value >= 3) return "Moderate"

  return "Monitor"
}


function getCoordinatesFromGeometry(geometry) {

  if (!geometry || typeof geometry !== "string") {
    return {
      latitude: 0,
      longitude: 0,
    }
  }

  try {

    const coordinateText = geometry
      .replace("POLYGON ((", "")
      .replace("))", "")

    const firstPoint = coordinateText
      .split(",")[0]
      .trim()

    const [longitude, latitude] = firstPoint
      .split(/\s+/)
      .map(Number)

    return {
      latitude: Number.isFinite(latitude)
        ? latitude
        : 0,

      longitude: Number.isFinite(longitude)
        ? longitude
        : 0,
    }

  } catch (error) {

    console.error(
      "Failed to read zone geometry:",
      error
    )

    return {
      latitude: 0,
      longitude: 0,
    }

  }
}


function transformZone(zone) {

  const risk = getRiskFromSeverity(
    zone.severity_score
  )

  const coordinates =
    getCoordinatesFromGeometry(
      zone.geometry
    )

  return {

    id: zone.id,

    name:
      zone.zone_name ||
      `Zone ${zone.id}`,

    location:
      zone.zone_name ||
      "Unknown location",

    population:
      Number(zone.estimated_population) || 0,

    risk,

    disaster:
      Number(zone.disaster_count) > 0
        ? `${zone.disaster_count} Active Disaster${
            Number(zone.disaster_count) > 1
              ? "s"
              : ""
          }`
        : "No Active Disaster",

    priority:
      zone.priority_override != null
        ? getPriorityFromOverride(
            zone.priority_override,
            risk
          )
        : getPriorityFromRisk(risk),

    latitude: coordinates.latitude,

    longitude: coordinates.longitude,

    severity:
      Number(zone.severity_score) || 0,

    disasterCount:
      Number(zone.disaster_count) || 0,

    damagePercent:
      Number(zone.damage_percent) || 0,

    priorityOverride:
      zone.priority_override != null
        ? Number(zone.priority_override)
        : null,

  }

}


function Zones() {

  const [zonesData, setZonesData] = useState([])

  const [searchTerm, setSearchTerm] =
    useState("")

  const [riskFilter, setRiskFilter] =
    useState("All")

  const [disasterFilter, setDisasterFilter] =
    useState("All")

  const [selectedZone, setSelectedZone] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState(false)

  // COMMANDER OVERRIDE
  const [overridePriority, setOverridePriority] =
    useState("")

  const [overrideLoading, setOverrideLoading] =
    useState(false)

  const [overrideMessage, setOverrideMessage] =
    useState("")

  const [overrideError, setOverrideError] =
    useState("")


  // =====================================================
  // GET ZONES FROM BACKEND
  // =====================================================

  async function loadZones() {

    try {

      setLoading(true)
      setError(false)

      const response = await fetch(
        `${API_BASE_URL}/zones/`
      )

      if (!response.ok) {

        throw new Error(
          `Failed to load zones: ${response.status}`
        )

      }

      const data = await response.json()

      console.log(
        "Zones received from backend:",
        data
      )

      const formattedZones =
        Array.isArray(data)
          ? data.map(transformZone)
          : []

      setZonesData(formattedZones)

    } catch (error) {

      console.error(
        "Failed to fetch zones:",
        error
      )

      setError(true)

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadZones()

  }, [])


  // =====================================================
  // COMMANDER OVERRIDE
  // =====================================================

  async function handleCommanderOverride() {

    if (!selectedZone) {
      return
    }

    if (!overridePriority) {
      setOverrideError(
        "Please select a priority."
      )
      return
    }

    try {

      setOverrideLoading(true)
      setOverrideMessage("")
      setOverrideError("")

      const response = await fetch(
        `${API_BASE_URL}/zones/${selectedZone.id}/priority?priority=${overridePriority}`,
        {
          method: "PUT",
        }
      )

      const data = await response.json()

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Failed to update priority override."
        )

      }

      setOverrideMessage(
        "Commander override updated successfully."
      )

      // Refresh zones from backend
      await loadZones()

      // Update selected zone using returned backend data
      setSelectedZone((current) => {

        if (!current) {
          return current
        }

        const newPriority =
          getPriorityFromOverride(
            data.priority_override,
            current.risk
          )

        return {
          ...current,
          priorityOverride:
            Number(data.priority_override),

          priority:
            newPriority,
        }

      })

    } catch (error) {

      console.error(
        "Commander override failed:",
        error
      )

      setOverrideError(
        error.message ||
        "Failed to update commander override."
      )

    } finally {

      setOverrideLoading(false)

    }

  }


  // =====================================================
  // TOTAL POPULATION
  // =====================================================

  const totalPopulation =
    zonesData.reduce(
      (total, zone) =>
        total + zone.population,
      0
    )


  const criticalZones =
    zonesData.filter(
      (zone) =>
        zone.risk === "Critical"
    ).length


  const highRiskZones =
    zonesData.filter(
      (zone) =>
        zone.risk === "Critical" ||
        zone.risk === "High"
    ).length


  const immediateZones =
    zonesData.filter(
      (zone) =>
        zone.priority === "Immediate"
    ).length


  // =====================================================
  // FILTERS
  // =====================================================

  const filteredZones =
    zonesData.filter((zone) => {

      const search =
        searchTerm.toLowerCase()

      const matchesSearch =
        zone.name
          .toLowerCase()
          .includes(search) ||

        zone.location
          .toLowerCase()
          .includes(search) ||

        zone.disaster
          .toLowerCase()
          .includes(search)

      const matchesRisk =
        riskFilter === "All" ||
        zone.risk === riskFilter

      const matchesDisaster =
        disasterFilter === "All" ||
        (
          disasterFilter === "Flood" &&
          zone.disaster
            .toLowerCase()
            .includes("flood")
        ) ||
        (
          disasterFilter === "Cyclone" &&
          zone.disaster
            .toLowerCase()
            .includes("cyclone")
        ) ||
        (
          disasterFilter === "Landslide" &&
          zone.disaster
            .toLowerCase()
            .includes("landslide")
        ) ||
        (
          disasterFilter === "Earthquake" &&
          zone.disaster
            .toLowerCase()
            .includes("earthquake")
        )

      return (
        matchesSearch &&
        matchesRisk &&
        matchesDisaster
      )

    })


  function clearFilters() {

    setSearchTerm("")
    setRiskFilter("All")
    setDisasterFilter("All")

  }


  function getRiskStyle(risk) {

    if (risk === "Critical") {

      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-500 dark:border-red-800"

    }

    if (risk === "High") {

      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-500 dark:border-orange-800"

    }

    if (risk === "Medium") {

      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-500 dark:border-yellow-800"

    }

    return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-500 dark:border-green-800"

  }


  function getPriorityStyle(priority) {

    if (priority === "Immediate") {

      return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"

    }

    if (priority === "High") {

      return "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"

    }

    if (priority === "Moderate") {

      return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"

    }

    return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"

  }


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="min-h-[60vh] flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-blue-100 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto" />

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Loading zones...
          </p>

        </div>

      </div>

    )

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <div className="space-y-6">

        <div className="bg-blue-50 dark:bg-blue-950 border border-red-300 dark:border-red-900 rounded-xl p-8 text-center">

          <TriangleAlert className="w-10 h-10 text-red-500 mx-auto" />

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
            Unable to load zones
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Please make sure the FastAPI backend is running.
          </p>

        </div>

      </div>

    )

  }


  return (

    <div className="space-y-6">


      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">

            <MapPin className="w-4 h-4" />

            Geographic Impact

          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Affected Zones
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
            Identify high-risk areas, understand population impact,
            and prioritize emergency response operations.
          </p>

        </div>


        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-5 py-3">

          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Active Monitoring
          </p>

          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">

            {zonesData.length}

            <span className="text-sm font-medium ml-1">
              zones
            </span>

          </p>

        </div>

      </div>


      {/* OVERVIEW CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">


        {/* Population */}

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-500 dark:border-blue-900 rounded-xl p-5">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Population at Risk
              </p>

              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {totalPopulation.toLocaleString()}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Across monitored zones
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">

              <Users className="w-5 h-5 text-purple-500 dark:text-purple-400" />

            </div>

          </div>

        </div>


        {/* High Risk */}

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-500 dark:border-blue-900 rounded-xl p-5">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                High Risk
              </p>

              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {highRiskZones}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Critical + high risk
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">

              <TriangleAlert className="w-5 h-5 text-red-600 dark:text-red-400" />

            </div>

          </div>

        </div>


        {/* Critical */}

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-500 dark:border-blue-900 rounded-xl p-5">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Critical Zones
              </p>

              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {criticalZones}
              </p>

              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                Immediate attention
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">

              <ShieldAlert className="w-5 h-5 text-orange-600 dark:text-orange-400" />

            </div>

          </div>

        </div>


        {/* Response */}

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-500 dark:border-blue-900 rounded-xl p-5">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Immediate Response
              </p>

              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {immediateZones}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Zones requiring action
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">

              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />

            </div>

          </div>

        </div>

      </div>


      {/* SEARCH */}

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-500 dark:border-blue-900 rounded-xl p-5">

        <div className="flex items-center justify-between mb-4">

          <div>

            <h2 className="font-semibold text-gray-900 dark:text-white">
              Find a Zone
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Search by zone, state, or disaster type
            </p>

          </div>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search zone, location or disaster..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full border border-gray-300 dark:border-gray-600 bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>


          <select
            value={riskFilter}
            onChange={(e) =>
              setRiskFilter(e.target.value)
            }
            className="border border-gray-300 dark:border-gray-600 bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="All">
              All Risk Levels
            </option>

            <option value="Critical">
              Critical
            </option>

            <option value="High">
              High
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="Low">
              Low
            </option>

          </select>


          <select
            value={disasterFilter}
            onChange={(e) =>
              setDisasterFilter(e.target.value)
            }
            className="border border-gray-300 dark:border-gray-600 bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="All">
              All Disaster Types
            </option>

            <option value="Flood">
              Flood
            </option>

            <option value="Cyclone">
              Cyclone
            </option>

            <option value="Landslide">
              Landslide
            </option>

            <option value="Earthquake">
              Earthquake
            </option>

          </select>

        </div>


        {(searchTerm ||
          riskFilter !== "All" ||
          disasterFilter !== "All") && (

          <button
            onClick={clearFilters}
            className="flex items-center gap-2 mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300"
          >

            <X className="w-4 h-4" />

            Clear filters

          </button>

        )}

      </div>


      {/* ZONES */}

      <div>

        <div className="flex items-center justify-between mb-4">

          <div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Zone Monitoring
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredZones.length} zones currently matching your filters
            </p>

          </div>

        </div>


        {filteredZones.length > 0 ? (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {filteredZones.map((zone) => (

              <div
                key={zone.id}
                className="bg-blue-50 dark:bg-blue-950 border border-blue-500 dark:border-blue-900 rounded-xl p-5 hover:shadow-md transition"
              >

                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">

                      <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                    </div>

                    <div>

                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {zone.name}
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {zone.location}
                      </p>

                    </div>

                  </div>


                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getRiskStyle(zone.risk)}`}
                  >
                    {zone.risk}
                  </span>

                </div>


                <div className="mt-5 flex items-center justify-between">

                  <div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Active Disaster
                    </p>

                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                      {zone.disaster}
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Population
                    </p>

                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                      {zone.population.toLocaleString()}
                    </p>

                  </div>

                </div>


                <div className="mt-4">

                  <div className="flex items-center justify-between">

                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Response Priority
                    </span>

                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${getPriorityStyle(zone.priority)}`}
                    >
                      {zone.priority}
                    </span>

                  </div>

                </div>


                <div className="border-t border-gray-100 dark:border-gray-700 mt-5 pt-4">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">

                      <MapPin className="w-3.5 h-3.5" />

                      {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}

                    </div>


                    <button
                      onClick={() => {

                        setSelectedZone(zone)

                        setOverridePriority(
                          zone.priorityOverride != null
                            ? String(zone.priorityOverride)
                            : ""
                        )

                        setOverrideMessage("")
                        setOverrideError("")

                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >

                      View details

                      <ArrowUpRight className="w-4 h-4" />

                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-500 dark:border-blue-900 rounded-xl py-14 text-center">

            <AlertCircle className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto" />

            <p className="text-gray-500 dark:text-gray-400 mt-3">
              No zones match your filters.
            </p>

            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-2 hover:underline"
            >
              Clear filters
            </button>

          </div>

        )}

      </div>


      {/* =====================================================
          ZONE DETAILS MODAL
          + COMMANDER OVERRIDE
         ===================================================== */}

      {selectedZone && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">

          <div className="bg-blue-50 dark:bg-blue-950 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden">

            <div className="px-6 py-5 border-b border-blue-500 dark:border-blue-900 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">

                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                </div>

                <div>

                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedZone.name}
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedZone.location}
                  </p>

                </div>

              </div>


              <button
                onClick={() =>
                  setSelectedZone(null)
                }
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
              >

                <X className="w-5 h-5" />

              </button>

            </div>


            <div className="p-6 space-y-5">


              {/* CURRENT RISK */}

              <div
                className={`rounded-xl border p-4 ${getRiskStyle(selectedZone.risk)}`}
              >

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <ShieldAlert className="w-5 h-5" />

                    <div>

                      <p className="text-xs font-medium opacity-80">
                        Current Risk Level
                      </p>

                      <p className="font-bold mt-1">
                        {selectedZone.risk}
                      </p>

                    </div>

                  </div>


                  <span className="text-sm font-semibold">
                    {selectedZone.priority}
                  </span>

                </div>

              </div>


              {/* POPULATION + DISASTER */}

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-xl bg-blue-100 dark:bg-blue-900 p-4">

                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Affected Population
                  </p>

                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {selectedZone.population.toLocaleString()}
                  </p>

                </div>


                <div className="rounded-xl bg-blue-100 dark:bg-blue-900 p-4">

                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Disaster
                  </p>

                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {selectedZone.disaster}
                  </p>

                </div>

              </div>


              {/* GEOGRAPHIC LOCATION */}

              <div className="rounded-xl border border-blue-500 dark:border-blue-900 p-4">

                <div className="flex items-center gap-2 mb-4">

                  <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />

                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Geographic Location
                  </p>

                </div>


                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Latitude
                    </p>

                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                      {selectedZone.latitude}
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Longitude
                    </p>

                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                      {selectedZone.longitude}
                    </p>

                  </div>

                </div>

              </div>


              {/* =====================================================
                  COMMANDER OVERRIDE
                 ===================================================== */}

              <div className="rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-4">

                <div className="flex items-center gap-3 mb-4">

                  <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">

                    <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Commander Override
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Manually override the system priority for this zone.
                    </p>

                  </div>

                </div>


                <div className="flex flex-col sm:flex-row gap-3">

                  <select
                    value={overridePriority}
                    onChange={(e) =>
                      setOverridePriority(
                        e.target.value
                      )
                    }
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >

                    <option value="">
                      Select priority
                    </option>

                    <option value="5">
                      5 - Immediate
                    </option>

                    <option value="4">
                      4 - High
                    </option>

                    <option value="3">
                      3 - Moderate
                    </option>

                    <option value="2">
                      2 - Low
                    </option>

                    <option value="1">
                      1 - Monitor
                    </option>

                  </select>


                  <button
                    onClick={handleCommanderOverride}
                    disabled={
                      overrideLoading ||
                      !overridePriority
                    }
                    className="px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-800 text-white text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
>

                    {overrideLoading
                      ? "Saving..."
                      : "Apply Override"}

                  </button>

                </div>


                {selectedZone.priorityOverride != null && (

                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-3">

                    Current override:{" "}

                    <span className="font-semibold">
                      {selectedZone.priorityOverride}/5
                    </span>

                  </p>

                )}


                {overrideMessage && (

                  <div className="mt-3 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg px-3 py-2">

                    {overrideMessage}

                  </div>

                )}


                {overrideError && (

                  <div className="mt-3 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">

                    {overrideError}

                  </div>

                )}

              </div>


              {/* RESPONSE RECOMMENDATION */}

              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4">

                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">
                  Response Recommendation
                </p>

                <p className="text-sm text-blue-900 dark:text-blue-200 mt-2">

                  {selectedZone.priority === "Immediate"

                    ? "Deploy emergency response teams and essential resources immediately."

                    : selectedZone.priority === "High"

                    ? "Increase monitoring and prepare response resources."

                    : selectedZone.priority === "Moderate"

                    ? "Continue monitoring and maintain response readiness."

                    : "Continue monitoring the zone for changes in risk level."}

                </p>

              </div>


              {/* CLOSE */}

              <button
                onClick={() =>
                  setSelectedZone(null)
                }
                className="w-full bg-blue-600 dark:bg-blue-800 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition"
              >
                Close Zone Details
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  )
}


export default Zones