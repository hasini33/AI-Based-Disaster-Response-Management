import { useEffect, useState } from "react"
import {
  Search,
  Filter,
  X,
  TriangleAlert,
  Eye,
  MapPin,
  Globe,
  Activity,
  Hash,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  getDisasters,
  getDisasterImpact,
} from "../services/disasterService"

function Disasters() {

  const [disasters, setDisasters] = useState([])
  const [selectedDisaster, setSelectedDisaster] = useState(null)
  const [impactData, setImpactData] = useState(null)
  const [impactLoading, setImpactLoading] = useState(false)
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [severityFilter, setSeverityFilter] = useState("All")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function handleViewImpact() {
  if (!selectedDisaster) return

  try {
    setImpactLoading(true)

    const data = await getDisasterImpact(selectedDisaster.id)

    console.log("Impact data:", data)

    setImpactData(data)

    navigate(`/?disasterId=${selectedDisaster.id}`)

  } catch (error) {
    console.error("Failed to fetch impact:", error)
  } finally {
    setImpactLoading(false)
  }
}
  // ---------------------------------------------------
  // Get disasters from backend
  // ---------------------------------------------------

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
      .finally(() => {
        setLoading(false)
      })

  }, [])


  // ---------------------------------------------------
  // Get unique disaster types
  // ---------------------------------------------------

  const disasterTypes = [
    "All",
    ...new Set(
      disasters
        .map((disaster) => disaster.type)
        .filter(Boolean)
    ),
  ]


  // ---------------------------------------------------
  // Filter disasters
  // ---------------------------------------------------

  const filteredDisasters = disasters.filter((disaster) => {

    const search = searchTerm.toLowerCase()

    const matchesSearch =
      disaster.type?.toLowerCase().includes(search) ||
      disaster.country?.toLowerCase().includes(search) ||
      disaster.location?.toLowerCase().includes(search)

    const matchesType =
      typeFilter === "All" ||
      disaster.type === typeFilter

    const severity = Number(disaster.severity)

    const matchesSeverity =
      severityFilter === "All" ||
      (severityFilter === "critical" && severity >= 8) ||
      (severityFilter === "high" && severity >= 6 && severity < 8) ||
      (severityFilter === "medium" && severity >= 4 && severity < 6) ||
      (severityFilter === "low" && severity >= 1 && severity < 4)

    return (
      matchesSearch &&
      matchesType &&
      matchesSeverity
    )
  })


  // ---------------------------------------------------
  // Clear filters
  // ---------------------------------------------------

  function clearFilters() {
    setSearchTerm("")
    setTypeFilter("All")
    setSeverityFilter("All")
  }


  // ---------------------------------------------------
  // Severity label
  // ---------------------------------------------------

  function getSeverityLabel(severity) {

    const value = Number(severity)

    if (value >= 8) return "Critical"
    if (value >= 6) return "High"
    if (value >= 4) return "Medium"
    if (value >= 1) return "Low"

    return "Not rated"
  }


  // ---------------------------------------------------
  // Severity styling
  // ---------------------------------------------------

  function getSeverityStyle(severity) {

    const value = Number(severity)

    if (value >= 8) {
      return "bg-red-100 text-red-700"
    }

    if (value >= 6) {
      return "bg-orange-100 text-orange-700"
    }

    if (value >= 4) {
      return "bg-yellow-100 text-yellow-700"
    }

    if (value >= 1) {
      return "bg-green-100 text-green-700"
    }

    return "bg-gray-100 text-gray-500"
  }


  // ---------------------------------------------------
  // Loading
  // ---------------------------------------------------

  if (loading) {

    return (
      <div className="flex items-center justify-center min-h-96">

        <div className="text-center">

          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="text-gray-500 text-sm mt-3">
            Loading disasters...
          </p>

        </div>

      </div>
    )
  }


  // ---------------------------------------------------
  // Error
  // ---------------------------------------------------

  if (error) {

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">

        <TriangleAlert className="w-8 h-8 text-red-500 mx-auto" />

        <h2 className="text-lg font-semibold text-gray-800 mt-3">
          Unable to load disasters
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          Please make sure the backend is running.
        </p>

      </div>
    )
  }


  // ---------------------------------------------------
  // Main UI
  // ---------------------------------------------------

  return (

    <div className="space-y-6">

      {/* ============================================= */}
      {/* PAGE HEADER */}
      {/* ============================================= */}

      <div>

        <h1 className="text-3xl font-bold text-gray-900">
          Disasters
        </h1>

        <p className="mt-2 text-gray-600">
          Monitor and explore reported disaster events.
        </p>
        {/* Disaster Details Panel */}
{selectedDisaster && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Disaster Details
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Information about this disaster event
          </p>
        </div>

        <button
          onClick={() => setSelectedDisaster(null)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

      </div>


      {/* Details */}
      <div className="p-6 space-y-5">

        {/* Disaster Type */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">
            Disaster Type
          </p>

          <p className="text-lg font-semibold text-gray-900 mt-1">
            {selectedDisaster.type || "Unknown"}
          </p>
        </div>


        {/* Country */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">
            Country
          </p>

          <p className="text-sm text-gray-700 mt-1">
            {selectedDisaster.country || "—"}
          </p>
        </div>


        {/* Location */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">
            Location
          </p>

          <p className="text-sm text-gray-700 mt-1">
            {selectedDisaster.location || "—"}
          </p>
        </div>


        {/* Severity */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">
            Severity
          </p>

          {selectedDisaster.severity != null ? (
            <span
              className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                selectedDisaster.severity >= 8
                  ? "bg-red-100 text-red-700"
                  : selectedDisaster.severity >= 6
                  ? "bg-orange-100 text-orange-700"
                  : selectedDisaster.severity >= 4
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {selectedDisaster.severity >= 8
                ? "Critical"
                : selectedDisaster.severity >= 6
                ? "High"
                : selectedDisaster.severity >= 4
                ? "Medium"
                : "Low"}
            </span>
          ) : (
            <p className="text-sm text-gray-400 mt-1">
              Not available
            </p>
          )}
        </div>


        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Latitude
            </p>

            <p className="text-sm text-gray-700 mt-1">
              {selectedDisaster.latitude ?? "—"}
            </p>
          </div>


          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Longitude
            </p>

            <p className="text-sm text-gray-700 mt-1">
              {selectedDisaster.longitude ?? "—"}
            </p>
          </div>

        </div>


        {/* Alert Level */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">
            Alert Level
          </p>

          <p className="text-sm text-gray-700 mt-1">
            {selectedDisaster.alert_level || "—"}
          </p>
        </div>

{/* View Impact Area */}
<button
  onClick={handleViewImpact}
  disabled={impactLoading}
  className="w-full border border-blue-600 text-blue-600 py-2.5 rounded-lg font-medium hover:bg-blue-50 transition-colors"
>
  {impactLoading ? "Loading impact..." : "View Impact Area"}
</button>
        {/* Close */}
        <button
          onClick={() => setSelectedDisaster(null)}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Close
        </button>

      </div>

    </div>

  </div>
)}

      </div>


      {/* ============================================= */}
      {/* SEARCH & FILTERS */}
      {/* ============================================= */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">

        <div className="flex items-center gap-2 mb-4">

          <Filter className="w-5 h-5 text-gray-500" />

          <h2 className="font-semibold text-gray-900">
            Search & Filters
          </h2>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


          {/* Search */}
          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search type, country or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

          </div>


          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            {disasterTypes.map((type) => (

              <option key={type} value={type}>

                {type === "All"
                  ? "All Disaster Types"
                  : type}

              </option>

            ))}

          </select>


          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="All">
              All Severities
            </option>

            <option value="critical">
              Critical (8+)
            </option>

            <option value="high">
              High (6–7)
            </option>

            <option value="medium">
              Medium (4–5)
            </option>

            <option value="low">
              Low (1–3)
            </option>

          </select>

        </div>


        {/* Clear filters */}

        {(searchTerm ||
          typeFilter !== "All" ||
          severityFilter !== "All") && (

          <button
            onClick={clearFilters}
            className="flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >

            <X className="w-4 h-4" />

            Clear filters

          </button>

        )}

      </div>


      {/* ============================================= */}
      {/* DISASTER TABLE */}
      {/* ============================================= */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">


        {/* Table Header */}

        <div className="px-5 py-4 border-b border-gray-200">

          <h2 className="text-lg font-semibold text-gray-900">
            Disaster Events
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredDisasters.length} of {disasters.length} disasters
          </p>

        </div>


        {/* Table */}

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Type
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Country
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Location
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Severity
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Action
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {filteredDisasters.length > 0 ? (

                filteredDisasters.map((disaster) => (

                  <tr
                    key={disaster.id}
                    className="hover:bg-gray-50 transition-colors"
                  >

                    {/* Type */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">

                          <TriangleAlert className="w-4 h-4 text-blue-600" />

                        </div>

                        <span className="text-sm font-medium text-gray-900">
                          {disaster.type || "Unknown"}
                        </span>

                      </div>

                    </td>


                    {/* Country */}

                    <td className="px-5 py-4 text-sm text-gray-600">

                      {disaster.country || "—"}

                    </td>


                    {/* Location */}

                    <td className="px-5 py-4 text-sm text-gray-600">

                      {disaster.location || "—"}

                    </td>


                    {/* Severity */}

                    <td className="px-5 py-4">

                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getSeverityStyle(disaster.severity)}`}
                      >
                        {getSeverityLabel(disaster.severity)}
                      </span>

                    </td>


                    {/* View */}

                    <td className="px-5 py-4">

                      <button
                        onClick={() => {
                          console.log("Selected disaster:", disaster)
                          setSelectedDisaster(disaster)
                        }}
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >

                        <Eye className="w-4 h-4" />

                        View

                      </button>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="text-center py-12"
                  >

                    <TriangleAlert className="w-8 h-8 text-gray-300 mx-auto" />

                    <p className="text-gray-500 mt-3">
                      No disasters match your filters.
                    </p>

                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 font-medium mt-2 hover:underline"
                    >
                      Clear filters
                    </button>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ============================================= */}
      {/* SELECTED DISASTER DETAILS */}
      {/* ============================================= */}

      {selectedDisaster && (

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">


          {/* Details Header */}

          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Disaster Details
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Information about the selected disaster
              </p>

            </div>


            <button
              onClick={() => setSelectedDisaster(disaster)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >

              <X className="w-5 h-5" />

            </button>

          </div>


          {/* Details Content */}

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">


            {/* Disaster Type */}

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">

                <TriangleAlert className="w-4 h-4 text-blue-600" />

              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Disaster Type
                </p>

                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {selectedDisaster.type || "Not available"}
                </p>

              </div>

            </div>


            {/* Country */}

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">

                <Globe className="w-4 h-4 text-gray-500" />

              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Country / Region
                </p>

                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {selectedDisaster.country || "Not available"}
                </p>

              </div>

            </div>


            {/* Severity */}

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">

                <Activity className="w-4 h-4 text-gray-500" />

              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Severity
                </p>

                <span
                  className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getSeverityStyle(selectedDisaster.severity)}`}
                >
                  {getSeverityLabel(selectedDisaster.severity)}
                </span>

              </div>

            </div>


            {/* Disaster ID */}

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">

                <Hash className="w-4 h-4 text-gray-500" />

              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Disaster ID
                </p>

                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {selectedDisaster.id}
                </p>

              </div>

            </div>


            {/* Latitude */}

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">

                <MapPin className="w-4 h-4 text-gray-500" />

              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Latitude
                </p>

                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {selectedDisaster.latitude ?? "Not available"}
                </p>

              </div>

            </div>


            {/* Longitude */}

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">

                <MapPin className="w-4 h-4 text-gray-500" />

              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Longitude
                </p>

                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {selectedDisaster.longitude ?? "Not available"}
                </p>

              </div>

            </div>

          </div>


          {/* Footer */}

          <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">

            <p className="text-xs text-gray-500">
              Select another disaster from the table to view its details.
            </p>

          </div>

        </div>

      )}

    </div>
  )
}

export default Disasters