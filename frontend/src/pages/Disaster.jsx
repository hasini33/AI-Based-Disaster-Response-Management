import { useEffect, useState } from "react"
import {
  Search,
  Filter,
  X,
  TriangleAlert,
} from "lucide-react"

import { getDisasters } from "../services/disasterService"


function Disasters() {

  const [disasters, setDisasters] = useState([])

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [severityFilter, setSeverityFilter] = useState("All")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)


  // Get disasters from backend
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


  // Get unique disaster types
  const disasterTypes = [
    "All",
    ...new Set(
      disasters
        .map((disaster) => disaster.type)
        .filter(Boolean)
    ),
  ]


  // Filter disasters
  const filteredDisasters = disasters.filter((disaster) => {

    const search = searchTerm.toLowerCase()

    const matchesSearch =
      disaster.type?.toLowerCase().includes(search) ||
      disaster.country?.toLowerCase().includes(search) ||
      disaster.location?.toLowerCase().includes(search)

    const matchesType =
      typeFilter === "All" ||
      disaster.type === typeFilter

    const matchesSeverity =
      severityFilter === "All" ||
      String(disaster.severity) === severityFilter

    return (
      matchesSearch &&
      matchesType &&
      matchesSeverity
    )
  })


  // Clear filters
  function clearFilters() {
    setSearchTerm("")
    setTypeFilter("All")
    setSeverityFilter("All")
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-gray-500">
          Loading disasters...
        </p>
      </div>
    )
  }


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


  return (
    <div className="space-y-6">

      {/* Header */}
      <div>

        <h1 className="text-3xl font-bold text-gray-900">
          Disasters
        </h1>

        <p className="mt-2 text-gray-600">
          Monitor and explore reported disaster events.
        </p>

      </div>


      {/* Search and Filters */}
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
              placeholder="Search disasters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

          </div>


          {/* Type Filter */}
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


          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="All">
              All Severities
            </option>

            <option value="8">
              Critical (8+)
            </option>

            <option value="6">
              High (6-7)
            </option>

            <option value="4">
              Medium (4-5)
            </option>

            <option value="2">
              Low (2-3)
            </option>

          </select>

        </div>


        {/* Clear Filters */}
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


      {/* Results */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">

          <div>

            <h2 className="text-lg font-semibold text-gray-900">
              Disaster Events
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredDisasters.length} of {disasters.length} disasters
            </p>

          </div>

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

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {filteredDisasters.length > 0 ? (

                filteredDisasters.map((disaster) => (

                  <tr
                    key={disaster.id}
                    className="hover:bg-gray-50 transition-colors"
                  >

                    <td className="px-5 py-4 text-sm font-medium text-gray-900">
                      {disaster.type || "Unknown"}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {disaster.country || "—"}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {disaster.location || "—"}
                    </td>

                    <td className="px-5 py-4">
  {disaster.severity != null ? (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        disaster.severity >= 8
          ? "bg-red-100 text-red-700"
          : disaster.severity >= 6
          ? "bg-orange-100 text-orange-700"
          : disaster.severity >= 4
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700"
      }`}
    >
      {disaster.severity >= 8
        ? "Critical"
        : disaster.severity >= 6
        ? "High"
        : disaster.severity >= 4
        ? "Medium"
        : "Low"}
    </span>
  ) : (
    <span className="text-sm text-gray-400">
      —
    </span>
  )}
</td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="4"
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

    </div>
  )
}

export default Disasters