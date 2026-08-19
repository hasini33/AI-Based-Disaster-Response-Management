import { useState } from "react"

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
} from "lucide-react"

// ---------------------------------------------------
// Mock Zone Data
// ---------------------------------------------------

const zonesData = [
  {
    id: 1,
    name: "Zone A",
    location: "Assam",
    population: 4520,
    risk: "Critical",
    disaster: "Flood",
    priority: "Immediate",
    latitude: 26.1445,
    longitude: 91.7362,
  },
  {
    id: 2,
    name: "Zone B",
    location: "Bihar",
    population: 2840,
    risk: "High",
    disaster: "Flood",
    priority: "High",
    latitude: 25.5941,
    longitude: 85.1376,
  },
  {
    id: 3,
    name: "Zone C",
    location: "Odisha",
    population: 1920,
    risk: "Medium",
    disaster: "Cyclone",
    priority: "Moderate",
    latitude: 20.2961,
    longitude: 85.8245,
  },
  {
    id: 4,
    name: "Zone D",
    location: "West Bengal",
    population: 3610,
    risk: "High",
    disaster: "Flood",
    priority: "High",
    latitude: 22.5726,
    longitude: 88.3639,
  },
  {
    id: 5,
    name: "Zone E",
    location: "Kerala",
    population: 2180,
    risk: "Low",
    disaster: "Landslide",
    priority: "Monitor",
    latitude: 10.8505,
    longitude: 76.2711,
  },
  {
    id: 6,
    name: "Zone F",
    location: "Maharashtra",
    population: 3150,
    risk: "Medium",
    disaster: "Flood",
    priority: "Moderate",
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    id: 7,
    name: "Zone G",
    location: "Andhra Pradesh",
    population: 2480,
    risk: "Critical",
    disaster: "Cyclone",
    priority: "Immediate",
    latitude: 16.5062,
    longitude: 80.648,
  },
  {
    id: 8,
    name: "Zone H",
    location: "Uttarakhand",
    population: 1560,
    risk: "High",
    disaster: "Landslide",
    priority: "High",
    latitude: 30.0668,
    longitude: 79.0193,
  },
  {
    id: 9,
    name: "Zone I",
    location: "Tamil Nadu",
    population: 2890,
    risk: "Low",
    disaster: "Cyclone",
    priority: "Monitor",
    latitude: 13.0827,
    longitude: 80.2707,
  },
  {
    id: 10,
    name: "Zone J",
    location: "Gujarat",
    population: 1760,
    risk: "Medium",
    disaster: "Earthquake",
    priority: "Moderate",
    latitude: 23.0225,
    longitude: 72.5714,
  },
]


function Zones() {

  const [searchTerm, setSearchTerm] = useState("")
  const [riskFilter, setRiskFilter] = useState("All")
  const [disasterFilter, setDisasterFilter] = useState("All")
  const [selectedZone, setSelectedZone] = useState(null)


  // ---------------------------------------------------
  // Calculations
  // ---------------------------------------------------

  const totalPopulation = zonesData.reduce(
    (total, zone) => total + zone.population,
    0
  )

  const criticalZones = zonesData.filter(
    (zone) => zone.risk === "Critical"
  ).length

  const highRiskZones = zonesData.filter(
    (zone) =>
      zone.risk === "Critical" ||
      zone.risk === "High"
  ).length

  const immediateZones = zonesData.filter(
    (zone) => zone.priority === "Immediate"
  ).length


  // ---------------------------------------------------
  // Filter
  // ---------------------------------------------------

  const filteredZones = zonesData.filter((zone) => {

    const search = searchTerm.toLowerCase()

    const matchesSearch =
      zone.name.toLowerCase().includes(search) ||
      zone.location.toLowerCase().includes(search) ||
      zone.disaster.toLowerCase().includes(search)

    const matchesRisk =
      riskFilter === "All" ||
      zone.risk === riskFilter

    const matchesDisaster =
      disasterFilter === "All" ||
      zone.disaster === disasterFilter

    return (
      matchesSearch &&
      matchesRisk &&
      matchesDisaster
    )
  })


  // ---------------------------------------------------
  // Clear Filters
  // ---------------------------------------------------

  function clearFilters() {
    setSearchTerm("")
    setRiskFilter("All")
    setDisasterFilter("All")
  }


  // ---------------------------------------------------
  // Risk Styling
  // ---------------------------------------------------

  function getRiskStyle(risk) {

    if (risk === "Critical") {
      return "bg-red-100 text-red-700 border-red-200"
    }

    if (risk === "High") {
      return "bg-orange-100 text-orange-700 border-orange-200"
    }

    if (risk === "Medium") {
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    }

    return "bg-green-100 text-green-700 border-green-200"
  }


  // ---------------------------------------------------
  // Priority Styling
  // ---------------------------------------------------

  function getPriorityStyle(priority) {

    if (priority === "Immediate") {
      return "bg-red-50 text-red-700"
    }

    if (priority === "High") {
      return "bg-orange-50 text-orange-700"
    }

    if (priority === "Moderate") {
      return "bg-yellow-50 text-yellow-700"
    }

    return "bg-green-50 text-green-700"
  }


  // ---------------------------------------------------
  // Main UI
  // ---------------------------------------------------

  return (

    <div className="space-y-6">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">

            <MapPin className="w-4 h-4" />

            Geographic Impact

          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Affected Zones
          </h1>

          <p className="mt-2 text-gray-600 max-w-2xl">
            Identify high-risk areas, understand population impact,
            and prioritize emergency response operations.
          </p>

        </div>


        {/* Zone Count */}

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">

          <p className="text-xs text-blue-600 font-medium">
            Active Monitoring
          </p>

          <p className="text-2xl font-bold text-blue-700">
            {zonesData.length}
            <span className="text-sm font-medium ml-1">
              zones
            </span>
          </p>

        </div>

      </div>


      {/* ================================================= */}
      {/* OVERVIEW CARDS */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">


        {/* Population */}

        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm text-gray-500">
                Population at Risk
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalPopulation.toLocaleString()}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Across monitored zones
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">

              <Users className="w-5 h-5 text-purple-600" />

            </div>

          </div>

        </div>


        {/* High Risk */}

        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm text-gray-500">
                High Risk
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {highRiskZones}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Critical + high risk
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">

              <TriangleAlert className="w-5 h-5 text-red-600" />

            </div>

          </div>

        </div>


        {/* Critical */}

        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm text-gray-500">
                Critical Zones
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {criticalZones}
              </p>

              <p className="text-xs text-red-600 mt-2 font-medium">
                Immediate attention
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">

              <ShieldAlert className="w-5 h-5 text-orange-600" />

            </div>

          </div>

        </div>


        {/* Response */}

        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <div className="flex justify-between items-start">

            <div>

              <p className="text-sm text-gray-500">
                Immediate Response
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {immediateZones}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Zones requiring action
              </p>

            </div>

            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">

              <Activity className="w-5 h-5 text-blue-600" />

            </div>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* RISK OVERVIEW */}
      {/* ================================================= */}

      <div className="bg-white border border-gray-200 rounded-xl p-5">

        <div className="flex items-center justify-between mb-5">

          <div>

            <h2 className="font-semibold text-gray-900">
              Risk Distribution
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Current risk classification across zones
            </p>

          </div>

          <Navigation className="w-5 h-5 text-gray-400" />

        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">


          {["Critical", "High", "Medium", "Low"].map((risk) => {

            const count = zonesData.filter(
              (zone) => zone.risk === risk
            ).length

            const percentage = Math.round(
              (count / zonesData.length) * 100
            )

            return (

              <button
                key={risk}
                onClick={() => setRiskFilter(risk)}
                className={`text-left rounded-xl border p-4 transition hover:shadow-sm ${getRiskStyle(risk)}`}
              >

                <div className="flex items-center justify-between">

                  <span className="text-sm font-semibold">
                    {risk}
                  </span>

                  <ArrowUpRight className="w-4 h-4" />

                </div>

                <p className="text-2xl font-bold mt-3">
                  {count}
                </p>

                <p className="text-xs mt-1 opacity-80">
                  {percentage}% of zones
                </p>

              </button>

            )

          })}

        </div>

      </div>


      {/* ================================================= */}
      {/* SEARCH / FILTER */}
      {/* ================================================= */}

      <div className="bg-white border border-gray-200 rounded-xl p-5">

        <div className="flex items-center justify-between mb-4">

          <div>

            <h2 className="font-semibold text-gray-900">
              Find a Zone
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Search by zone, state, or disaster type
            </p>

          </div>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


          {/* Search */}

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search zone, location or disaster..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>


          {/* Risk */}

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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


          {/* Disaster */}

          <select
            value={disasterFilter}
            onChange={(e) => setDisasterFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="flex items-center gap-2 mt-4 text-sm text-blue-600 font-medium hover:text-blue-800"
          >

            <X className="w-4 h-4" />

            Clear filters

          </button>

        )}

      </div>


      {/* ================================================= */}
      {/* ZONE CARDS */}
      {/* ================================================= */}

      <div>

        <div className="flex items-center justify-between mb-4">

          <div>

            <h2 className="text-lg font-semibold text-gray-900">
              Zone Monitoring
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {filteredZones.length} zones currently matching your filters
            </p>

          </div>

        </div>


        {filteredZones.length > 0 ? (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {filteredZones.map((zone) => (

              <div
                key={zone.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
              >


                {/* Card Header */}

                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">

                      <MapPin className="w-5 h-5 text-blue-600" />

                    </div>

                    <div>

                      <h3 className="font-semibold text-gray-900">
                        {zone.name}
                      </h3>

                      <p className="text-sm text-gray-500">
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


                {/* Disaster */}

                <div className="mt-5 flex items-center justify-between">

                  <div>

                    <p className="text-xs text-gray-500">
                      Active Disaster
                    </p>

                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {zone.disaster}
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-gray-500">
                      Population
                    </p>

                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {zone.population.toLocaleString()}
                    </p>

                  </div>

                </div>


                {/* Priority */}

                <div className="mt-4">

                  <div className="flex items-center justify-between">

                    <span className="text-xs text-gray-500">
                      Response Priority
                    </span>

                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${getPriorityStyle(zone.priority)}`}
                    >
                      {zone.priority}
                    </span>

                  </div>

                </div>


                {/* Divider */}

                <div className="border-t border-gray-100 mt-5 pt-4">


                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2 text-xs text-gray-500">

                      <MapPin className="w-3.5 h-3.5" />

                      {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}

                    </div>


                    <button
                      onClick={() => setSelectedZone(zone)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
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

          <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">

            <AlertCircle className="w-9 h-9 text-gray-300 mx-auto" />

            <p className="text-gray-500 mt-3">
              No zones match your filters.
            </p>

            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 font-medium mt-2 hover:underline"
            >
              Clear filters
            </button>

          </div>

        )}

      </div>


      {/* ================================================= */}
      {/* ZONE DETAILS MODAL */}
      {/* ================================================= */}

      {selectedZone && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden">


            {/* Modal Header */}

            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">

                  <MapPin className="w-5 h-5 text-blue-600" />

                </div>

                <div>

                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedZone.name}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {selectedZone.location}
                  </p>

                </div>

              </div>


              <button
                onClick={() => setSelectedZone(null)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >

                <X className="w-5 h-5" />

              </button>

            </div>


            {/* Modal Content */}

            <div className="p-6 space-y-5">


              {/* Risk Banner */}

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


              {/* Details Grid */}

              <div className="grid grid-cols-2 gap-4">


                <div className="rounded-xl bg-gray-50 p-4">

                  <Users className="w-5 h-5 text-purple-600" />

                  <p className="text-xs text-gray-500 mt-3">
                    Affected Population
                  </p>

                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {selectedZone.population.toLocaleString()}
                  </p>

                </div>


                <div className="rounded-xl bg-gray-50 p-4">

                  <Activity className="w-5 h-5 text-blue-600" />

                  <p className="text-xs text-gray-500 mt-3">
                    Disaster
                  </p>

                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {selectedZone.disaster}
                  </p>

                </div>

              </div>


              {/* Coordinates */}

              <div className="rounded-xl border border-gray-200 p-4">

                <div className="flex items-center gap-2 mb-4">

                  <Navigation className="w-4 h-4 text-blue-600" />

                  <p className="text-sm font-semibold text-gray-900">
                    Geographic Location
                  </p>

                </div>


                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <p className="text-xs text-gray-500">
                      Latitude
                    </p>

                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {selectedZone.latitude}
                    </p>

                  </div>


                  <div>

                    <p className="text-xs text-gray-500">
                      Longitude
                    </p>

                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {selectedZone.longitude}
                    </p>

                  </div>

                </div>

              </div>


              {/* Response Note */}

              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">

                <p className="text-xs text-blue-600 font-semibold uppercase">
                  Response Recommendation
                </p>

                <p className="text-sm text-blue-900 mt-2">

                  {selectedZone.priority === "Immediate"
                    ? "Deploy emergency response teams and essential resources immediately."
                    : selectedZone.priority === "High"
                    ? "Increase monitoring and prepare response resources."
                    : selectedZone.priority === "Moderate"
                    ? "Continue monitoring and maintain response readiness."
                    : "Continue monitoring the zone for changes in risk level."}

                </p>

              </div>


              {/* Close */}

              <button
                onClick={() => setSelectedZone(null)}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition"
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