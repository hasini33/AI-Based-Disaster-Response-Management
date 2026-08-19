import { useState } from "react"
import {
  Brain,
  Search,
  AlertTriangle,
  Package,
  Droplets,
  HeartPulse,
  Home,
  TrendingUp,
  MapPin,
  Activity,
  X,
} from "lucide-react"

function AIDemand() {

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedDemand, setSelectedDemand] = useState(null)

  // --------------------------------------------------
  // Sample AI demand data
  // Later this can come from your FastAPI ML endpoint
  // --------------------------------------------------

  const demandData = [
    {
      id: "DM-001",
      disaster: "Flood",
      location: "Guwahati",
      zone: "Zone A",
      resource: "Food Packets",
      category: "Food",
      predicted: 9200,
      available: 8420,
      unit: "packets",
      confidence: 94,
      status: "Critical",
    },
    {
      id: "DM-002",
      disaster: "Flood",
      location: "Guwahati",
      zone: "Zone A",
      resource: "Drinking Water",
      category: "Water",
      predicted: 14500,
      available: 12000,
      unit: "liters",
      confidence: 91,
      status: "High",
    },
    {
      id: "DM-003",
      disaster: "Earthquake",
      location: "Assam",
      zone: "Zone B",
      resource: "Medical Kits",
      category: "Medical",
      predicted: 1350,
      available: 1240,
      unit: "kits",
      confidence: 89,
      status: "High",
    },
    {
      id: "DM-004",
      disaster: "Cyclone",
      location: "Odisha",
      zone: "Zone C",
      resource: "Shelter Capacity",
      category: "Shelter",
      predicted: 2800,
      available: 3100,
      unit: "people",
      confidence: 87,
      status: "Ready",
    },
    {
      id: "DM-005",
      disaster: "Flood",
      location: "Patna",
      zone: "Zone D",
      resource: "Food Packets",
      category: "Food",
      predicted: 6800,
      available: 7200,
      unit: "packets",
      confidence: 93,
      status: "Ready",
    },
    {
      id: "DM-006",
      disaster: "Landslide",
      location: "Himachal Pradesh",
      zone: "Zone E",
      resource: "Medical Kits",
      category: "Medical",
      predicted: 980,
      available: 620,
      unit: "kits",
      confidence: 85,
      status: "Critical",
    },
  ]

  // --------------------------------------------------
  // Filtering
  // --------------------------------------------------

  const filteredData = demandData.filter((item) => {

    const search = searchTerm.toLowerCase()

    const matchesSearch =
      item.disaster.toLowerCase().includes(search) ||
      item.location.toLowerCase().includes(search) ||
      item.resource.toLowerCase().includes(search) ||
      item.zone.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === "All" ||
      item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // --------------------------------------------------
  // Calculations
  // --------------------------------------------------

  const criticalCount =
    demandData.filter(item => item.status === "Critical").length

  const highCount =
    demandData.filter(item => item.status === "High").length

  const readyCount =
    demandData.filter(item => item.status === "Ready").length

  const totalPredicted =
    demandData.reduce((sum, item) => sum + item.predicted, 0)

  // --------------------------------------------------
  // Resource icon
  // --------------------------------------------------

  function getResourceIcon(category) {

    if (category === "Food") {
      return <Package className="w-5 h-5 text-blue-600" />
    }

    if (category === "Water") {
      return <Droplets className="w-5 h-5 text-blue-600" />
    }

    if (category === "Medical") {
      return <HeartPulse className="w-5 h-5 text-blue-600" />
    }

    if (category === "Shelter") {
      return <Home className="w-5 h-5 text-blue-600" />
    }

    return <Package className="w-5 h-5 text-blue-600" />
  }

  // --------------------------------------------------
  // Status styling
  // --------------------------------------------------

  function getStatusStyle(status) {

    if (status === "Critical") {
      return "bg-red-100 text-red-700"
    }

    if (status === "High") {
      return "bg-orange-100 text-orange-700"
    }

    return "bg-green-100 text-green-700"
  }

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (

    <div className="space-y-6">

      {/* ================= HEADER ================= */}

      <div className="flex items-start justify-between">

        <div>

          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">

            <Brain className="w-5 h-5" />

            AI Resource Intelligence

          </div>

          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            AI Demand
          </h1>

          <p className="text-gray-600 mt-2">
            Predict future relief requirements using disaster and population data.
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">

              <Brain className="w-5 h-5 text-blue-600" />

            </div>

            <div>

              <p className="text-xs text-gray-500">
                AI Prediction Engine
              </p>

              <p className="text-sm font-semibold text-green-600">
                Active
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Predicted Demand */}

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Total Predicted Demand
              </p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalPredicted.toLocaleString()}
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">

              <TrendingUp className="w-5 h-5 text-blue-600" />

            </div>

          </div>

          <p className="text-xs text-blue-600 mt-3">
            AI forecast across active zones
          </p>

        </div>


        {/* Critical */}

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Critical Demand
              </p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {criticalCount}
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">

              <AlertTriangle className="w-5 h-5 text-red-600" />

            </div>

          </div>

          <p className="text-xs text-red-600 mt-3">
            Immediate resource attention
          </p>

        </div>


        {/* High */}

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">
                High Demand
              </p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {highCount}
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">

              <Activity className="w-5 h-5 text-orange-600" />

            </div>

          </div>

          <p className="text-xs text-orange-600 mt-3">
            Replenishment recommended
          </p>

        </div>


        {/* Ready */}

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Demand Covered
              </p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {readyCount}
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">

              <Package className="w-5 h-5 text-green-600" />

            </div>

          </div>

          <p className="text-xs text-green-600 mt-3">
            Current stock can support demand
          </p>

        </div>

      </div>


      {/* ================= SEARCH ================= */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">

        <div className="flex items-center gap-2 mb-4">

          <Search className="w-5 h-5 text-gray-500" />

          <h2 className="font-semibold text-gray-900">
            Analyze Demand
          </h2>

          <span className="ml-auto text-sm text-gray-500">
            {filteredData.length} predictions
          </span>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search disaster, resource, zone or location..."
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
              All Demand Status
            </option>

            <option value="Critical">
              Critical
            </option>

            <option value="High">
              High
            </option>

            <option value="Ready">
              Ready
            </option>

          </select>

        </div>

      </div>


      {/* ================= AI INFORMATION ================= */}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">

        <div className="flex items-start gap-4">

          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">

            <Brain className="w-5 h-5 text-blue-600" />

          </div>

          <div>

            <h3 className="font-semibold text-gray-900">
              How AI Demand Prediction Works
            </h3>

            <p className="text-sm text-gray-600 mt-1">
              The prediction model estimates future resource requirements
              using disaster severity, affected population, damage level,
              demographic information and disaster type.
            </p>

          </div>

        </div>

      </div>


      {/* ================= DEMAND TABLE ================= */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-200">

          <h2 className="text-lg font-semibold text-gray-900">
            AI Demand Predictions
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Resource requirements predicted for affected zones.
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Resource
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Disaster
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Location
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Predicted
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Available
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Confidence
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Action
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {filteredData.length > 0 ? (

                filteredData.map((item) => (

                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition"
                  >

                    {/* Resource */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">

                          {getResourceIcon(item.category)}

                        </div>

                        <div>

                          <p className="text-sm font-semibold text-gray-900">
                            {item.resource}
                          </p>

                          <p className="text-xs text-gray-500">
                            {item.unit}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* Disaster */}

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {item.disaster}
                    </td>


                    {/* Location */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2 text-sm text-gray-700">

                        <MapPin className="w-4 h-4 text-gray-400" />

                        {item.location}

                      </div>

                      <p className="text-xs text-gray-400 ml-6">
                        {item.zone}
                      </p>

                    </td>


                    {/* Predicted */}

                    <td className="px-5 py-4">

                      <p className="text-sm font-bold text-gray-900">
                        {item.predicted.toLocaleString()}
                      </p>

                    </td>


                    {/* Available */}

                    <td className="px-5 py-4">

                      <p className="text-sm text-gray-700">
                        {item.available.toLocaleString()}
                      </p>

                    </td>


                    {/* Confidence */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">

                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${item.confidence}%`,
                            }}
                          />

                        </div>

                        <span className="text-xs font-medium text-gray-600">
                          {item.confidence}%
                        </span>

                      </div>

                    </td>


                    {/* Status */}

                    <td className="px-5 py-4">

                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(item.status)}`}
                      >
                        {item.status}
                      </span>

                    </td>


                    {/* Action */}

                    <td className="px-5 py-4">

                      <button
                        onClick={() => setSelectedDemand(item)}
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
                    colSpan="8"
                    className="text-center py-12"
                  >

                    <Brain className="w-8 h-8 text-gray-300 mx-auto" />

                    <p className="text-gray-500 mt-3">
                      No demand predictions match your filters.
                    </p>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ================= DETAILS MODAL ================= */}

      {selectedDemand && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">

            {/* Header */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">

              <div>

                <div className="flex items-center gap-2">

                  <Brain className="w-5 h-5 text-blue-600" />

                  <h2 className="text-lg font-semibold text-gray-900">
                    AI Prediction Details
                  </h2>

                </div>

                <p className="text-sm text-gray-500 mt-1">
                  {selectedDemand.id}
                </p>

              </div>

              <button
                onClick={() => setSelectedDemand(null)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >

                <X className="w-5 h-5" />

              </button>

            </div>


            {/* Content */}

            <div className="p-6 space-y-5">

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <p className="text-xs text-gray-500">
                    Disaster
                  </p>

                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedDemand.disaster}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-gray-500">
                    Location
                  </p>

                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedDemand.location}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-gray-500">
                    Resource
                  </p>

                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedDemand.resource}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-gray-500">
                    Zone
                  </p>

                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedDemand.zone}
                  </p>

                </div>

              </div>


              <div className="bg-blue-50 rounded-lg p-4">

                <p className="text-xs text-gray-500">
                  Predicted Requirement
                </p>

                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {selectedDemand.predicted.toLocaleString()}{" "}
                  <span className="text-sm font-medium">
                    {selectedDemand.unit}
                  </span>
                </p>

              </div>


              <div>

                <div className="flex justify-between">

                  <p className="text-sm text-gray-600">
                    Prediction Confidence
                  </p>

                  <p className="text-sm font-semibold">
                    {selectedDemand.confidence}%
                  </p>

                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full mt-2">

                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${selectedDemand.confidence}%`,
                    }}
                  />

                </div>

              </div>


              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-600">
                  Current availability
                </span>

                <span className="font-semibold text-gray-900">
                  {selectedDemand.available.toLocaleString()}{" "}
                  {selectedDemand.unit}
                </span>

              </div>


              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-600">
                  Demand status
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(selectedDemand.status)}`}
                >
                  {selectedDemand.status}
                </span>

              </div>

              <button
                onClick={() => setSelectedDemand(null)}
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

export default AIDemand