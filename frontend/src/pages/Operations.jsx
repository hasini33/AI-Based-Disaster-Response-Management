import { useMemo, useState } from "react"
import {
  Search,
  Activity,
  Users,
  MapPin,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  ShieldCheck,
  X,
} from "lucide-react"

function Operations() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedOperation, setSelectedOperation] = useState(null)

  // --------------------------------------------------
  // FIELD OPERATIONS
  // --------------------------------------------------

  const operations = [
    {
      id: "OP-001",
      mission: "Flood Rescue",
      location: "Guwahati",
      team: "Alpha Rescue Team",
      members: 8,
      vehicle: "Rescue Van",
      status: "Active",
      priority: "Critical",
      started: "14 min ago",
      roadStatus: "Partially Blocked",
    },

    {
      id: "OP-002",
      mission: "Food Distribution",
      location: "Patna",
      team: "Relief Team Bravo",
      members: 6,
      vehicle: "Supply Truck",
      status: "Active",
      priority: "High",
      started: "28 min ago",
      roadStatus: "Clear",
    },

    {
      id: "OP-003",
      mission: "Medical Assistance",
      location: "Assam",
      team: "Medical Unit 01",
      members: 5,
      vehicle: "Medical Vehicle",
      status: "In Progress",
      priority: "High",
      started: "42 min ago",
      roadStatus: "Clear",
    },

    {
      id: "OP-004",
      mission: "Evacuation Support",
      location: "Dibrugarh",
      team: "Emergency Team",
      members: 10,
      vehicle: "Rescue Bus",
      status: "Active",
      priority: "Critical",
      started: "1 hr ago",
      roadStatus: "Blocked",
    },

    {
      id: "OP-005",
      mission: "Shelter Setup",
      location: "Silchar",
      team: "Relief Team Charlie",
      members: 7,
      vehicle: "Transport Truck",
      status: "Completed",
      priority: "Medium",
      started: "2 hrs ago",
      roadStatus: "Clear",
    },

    {
      id: "OP-006",
      mission: "Water Supply",
      location: "Kolkata",
      team: "Logistics Team",
      members: 4,
      vehicle: "Water Tanker",
      status: "Pending",
      priority: "Medium",
      started: "Not started",
      roadStatus: "Clear",
    },
  ]

  // --------------------------------------------------
  // SUMMARY COUNTS
  // --------------------------------------------------

  const activeOperations = operations.filter(
    (operation) =>
      operation.status === "Active" ||
      operation.status === "In Progress"
  ).length

  const criticalOperations = operations.filter(
    (operation) => operation.priority === "Critical"
  ).length

  const totalPersonnel = operations.reduce(
    (total, operation) => total + operation.members,
    0
  )

  const blockedRoutes = operations.filter(
    (operation) =>
      operation.roadStatus === "Blocked" ||
      operation.roadStatus === "Partially Blocked"
  ).length

  // --------------------------------------------------
  // FILTER OPERATIONS
  // --------------------------------------------------

  const filteredOperations = useMemo(() => {
    const search = searchTerm.toLowerCase()

    return operations.filter((operation) => {
      const matchesSearch =
        operation.mission.toLowerCase().includes(search) ||
        operation.location.toLowerCase().includes(search) ||
        operation.team.toLowerCase().includes(search)

      const matchesStatus =
        statusFilter === "All" ||
        operation.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter])

  // --------------------------------------------------
  // STATUS STYLE
  // --------------------------------------------------

  function getStatusStyle(status) {
    if (status === "Active") {
      return "bg-green-100 text-green-700"
    }

    if (status === "In Progress") {
      return "bg-blue-100 text-blue-700"
    }

    if (status === "Completed") {
      return "bg-gray-100 text-gray-700"
    }

    return "bg-yellow-100 text-yellow-700"
  }

  // --------------------------------------------------
  // PRIORITY STYLE
  // --------------------------------------------------

  function getPriorityStyle(priority) {
    if (priority === "Critical") {
      return "bg-red-100 text-red-700"
    }

    if (priority === "High") {
      return "bg-orange-100 text-orange-700"
    }

    return "bg-yellow-100 text-yellow-700"
  }

  // --------------------------------------------------
  // ROAD STATUS STYLE
  // --------------------------------------------------

  function getRoadStyle(status) {
    if (status === "Blocked") {
      return "text-red-600"
    }

    if (status === "Partially Blocked") {
      return "text-orange-600"
    }

    return "text-green-600"
  }

  return (
    <div className="space-y-6">

      {/* ============================================ */}
      {/* PAGE HEADER */}
      {/* ============================================ */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
            <ShieldCheck className="w-5 h-5" />
            Emergency Coordination
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            Operations
          </h1>

          <p className="text-gray-600 mt-2">
            Monitor rescue teams, relief missions and field activities.
          </p>

        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">

          <Activity className="w-5 h-5 text-blue-600" />

          <div>
            <p className="text-xs text-gray-500">
              Operations
            </p>

            <p className="font-bold text-gray-900">
              {operations.length}
            </p>
          </div>

        </div>

      </div>


      {/* ============================================ */}
      {/* SUMMARY CARDS */}
      {/* ============================================ */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* Active */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Active Operations
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {activeOperations}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>

          </div>

          <p className="text-xs text-green-600 mt-3">
            Currently deployed
          </p>

        </div>


        {/* Critical */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Critical Missions
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {criticalOperations}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>

          </div>

          <p className="text-xs text-red-600 mt-3">
            Requires close monitoring
          </p>

        </div>


        {/* Personnel */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Field Personnel
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalPersonnel}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>

          </div>

          <p className="text-xs text-blue-600 mt-3">
            Assigned across missions
          </p>

        </div>


        {/* Blocked Routes */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Route Warnings
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {blockedRoutes}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-orange-600" />
            </div>

          </div>

          <p className="text-xs text-orange-600 mt-3">
            Blocked or partially blocked
          </p>

        </div>

      </div>


      {/* ============================================ */}
      {/* SEARCH & FILTER */}
      {/* ============================================ */}

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center gap-2">

            <Search className="w-5 h-5 text-gray-500" />

            <h2 className="font-semibold text-gray-900">
              Find Operations
            </h2>

          </div>

          <span className="text-sm text-gray-500">
            {filteredOperations.length} results
          </span>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search mission, team or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>


          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="All">
              All Operation Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="In Progress">
              In Progress
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Completed">
              Completed
            </option>

          </select>

        </div>

      </div>


      {/* ============================================ */}
      {/* OPERATIONS TABLE */}
      {/* ============================================ */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-200">

          <h2 className="text-lg font-semibold text-gray-900">
            Field Operations
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Live coordination of disaster response activities.
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Mission
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Location
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Team
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Priority
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Route
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Action
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {filteredOperations.length > 0 ? (

                filteredOperations.map((operation) => (

                  <tr
                    key={operation.id}
                    className="hover:bg-gray-50 transition"
                  >

                    {/* Mission */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">

                          <ShieldCheck className="w-4 h-4 text-blue-600" />

                        </div>

                        <div>

                          <p className="text-sm font-semibold text-gray-900">
                            {operation.mission}
                          </p>

                          <p className="text-xs text-gray-500">
                            {operation.id}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* Location */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2 text-sm text-gray-700">

                        <MapPin className="w-4 h-4 text-gray-400" />

                        {operation.location}

                      </div>

                    </td>


                    {/* Team */}

                    <td className="px-5 py-4">

                      <div>

                        <p className="text-sm font-medium text-gray-800">
                          {operation.team}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {operation.members} personnel
                        </p>

                      </div>

                    </td>


                    {/* Status */}

                    <td className="px-5 py-4">

                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                          operation.status
                        )}`}
                      >
                        {operation.status}
                      </span>

                    </td>


                    {/* Priority */}

                    <td className="px-5 py-4">

                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityStyle(
                          operation.priority
                        )}`}
                      >
                        {operation.priority}
                      </span>

                    </td>


                    {/* Route */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <Truck className="w-4 h-4 text-gray-400" />

                        <span
                          className={`text-sm font-medium ${getRoadStyle(
                            operation.roadStatus
                          )}`}
                        >
                          {operation.roadStatus}
                        </span>

                      </div>

                    </td>


                    {/* Action */}

                    <td className="px-5 py-4">

                      <button
                        onClick={() =>
                          setSelectedOperation(operation)
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center py-12"
                  >

                    <Activity className="w-8 h-8 text-gray-300 mx-auto" />

                    <p className="text-gray-500 mt-3">
                      No operations found.
                    </p>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ============================================ */}
      {/* OPERATION DETAILS MODAL */}
      {/* ============================================ */}

      {selectedOperation && (

        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">

            {/* Header */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Operation Details
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {selectedOperation.id}
                </p>

              </div>

              <button
                onClick={() => setSelectedOperation(null)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>

            </div>


            {/* Details */}

            <div className="p-6 space-y-5">

              <div>

                <p className="text-xs text-gray-500 uppercase">
                  Mission
                </p>

                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {selectedOperation.mission}
                </p>

              </div>


              <div className="grid grid-cols-2 gap-4">

                <div>

                  <p className="text-xs text-gray-500">
                    Location
                  </p>

                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedOperation.location}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-gray-500">
                    Team
                  </p>

                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedOperation.team}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-gray-500">
                    Personnel
                  </p>

                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedOperation.members}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-gray-500">
                    Vehicle
                  </p>

                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedOperation.vehicle}
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-3">

                <Clock className="w-5 h-5 text-gray-400" />

                <div>

                  <p className="text-xs text-gray-500">
                    Started
                  </p>

                  <p className="text-sm font-semibold text-gray-900">
                    {selectedOperation.started}
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-3">

                {selectedOperation.roadStatus === "Clear" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                )}

                <div>

                  <p className="text-xs text-gray-500">
                    Road Condition
                  </p>

                  <p
                    className={`text-sm font-semibold ${getRoadStyle(
                      selectedOperation.roadStatus
                    )}`}
                  >
                    {selectedOperation.roadStatus}
                  </p>

                </div>

              </div>


              <div className="flex gap-3">

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                    selectedOperation.status
                  )}`}
                >
                  {selectedOperation.status}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityStyle(
                    selectedOperation.priority
                  )}`}
                >
                  {selectedOperation.priority}
                </span>

              </div>

            </div>


            {/* Footer */}

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">

              <button
                onClick={() => setSelectedOperation(null)}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default Operations