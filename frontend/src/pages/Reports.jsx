import { useEffect, useMemo, useState } from "react"
import {
  FileBarChart,
  Download,
  Activity,
  TriangleAlert,
  Users,
  Package,
  ShieldAlert,
  TrendingUp,
  CalendarDays,
  RefreshCw,
} from "lucide-react"

import { getDisasters } from "../services/disasterService"

function Reports() {
  const [disasters, setDisasters] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("All")

  // =========================================
  // LOAD DISASTER DATA
  // =========================================

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await getDisasters()

        console.log("Report data:", data)

        setDisasters(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to load report data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  // =========================================
  // REPORT CALCULATIONS
  // =========================================

  const reportData = useMemo(() => {
    const total = disasters.length

    const critical = disasters.filter(
      (d) => Number(d.severity) >= 8
    ).length

    const high = disasters.filter(
      (d) =>
        Number(d.severity) >= 6 &&
        Number(d.severity) < 8
    ).length

    const medium = disasters.filter(
      (d) =>
        Number(d.severity) >= 4 &&
        Number(d.severity) < 6
    ).length

    const low = disasters.filter(
      (d) =>
        Number(d.severity) >= 1 &&
        Number(d.severity) < 4
    ).length

    const rated = disasters.filter(
      (d) => Number(d.severity) > 0
    )

    const averageSeverity =
      rated.length > 0
        ? (
            rated.reduce(
              (sum, d) => sum + Number(d.severity),
              0
            ) / rated.length
          ).toFixed(1)
        : "0.0"

    const types = {}

    disasters.forEach((disaster) => {
      const type = disaster.type || "Unknown"

      types[type] = (types[type] || 0) + 1
    })

    const topDisasterType =
      Object.entries(types).sort(
        (a, b) => b[1] - a[1]
      )[0] || ["No data", 0]

    return {
      total,
      critical,
      high,
      medium,
      low,
      averageSeverity,
      topDisasterType,
    }
  }, [disasters])

  // =========================================
  // CSV REPORT DOWNLOAD
  // =========================================

  function downloadReport() {
    if (!disasters.length) return

    const headers = [
      "Disaster ID",
      "Type",
      "Country",
      "Location",
      "Severity",
      "Alert Level",
      "Latitude",
      "Longitude",
    ]

    const rows = disasters.map((disaster) => [
      disaster.id ?? "",
      disaster.type ?? "",
      disaster.country ?? "",
      disaster.location ?? "",
      disaster.severity ?? "",
      disaster.alert_level ?? "",
      disaster.latitude ?? "",
      disaster.longitude ?? "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ].join("\n")

    const blob = new Blob(
      [csvContent],
      { type: "text/csv;charset=utf-8;" }
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")

    link.href = url
    link.download = "disaster-response-report.csv"

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">

          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />

          <p className="mt-3 text-sm text-gray-500">
            Preparing response reports...
          </p>

        </div>
      </div>
    )
  }

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <div className="space-y-6">

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-blue-600 mb-2">

            <FileBarChart className="w-5 h-5" />

            <span className="text-sm font-medium">
              Response Intelligence
            </span>

          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Insights
          </h1>

          <p className="mt-2 text-gray-600">
            Analyze disaster activity, severity patterns and
            response priorities.
          </p>

        </div>

        <div className="flex items-center gap-3">

          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(e.target.value)
            }
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
          >
            <option value="All">
              All Records
            </option>

            <option value="Current">
              Current Events
            </option>
          </select>

          <button
            onClick={downloadReport}
            className="
              inline-flex items-center gap-2
              bg-blue-600
              text-white
              px-4 py-2.5
              rounded-lg
              text-sm
              font-medium
              hover:bg-blue-700
              transition
            "
          >
            <Download className="w-4 h-4" />

            Export CSV
          </button>

        </div>

      </div>


      {/* ===================================== */}
      {/* SUMMARY CARDS */}
      {/* ===================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* Total */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Total Events
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {reportData.total}
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">

              <Activity className="w-5 h-5 text-blue-600" />

            </div>

          </div>

          <p className="text-xs text-blue-600 mt-4">
            Recorded disaster events
          </p>

        </div>


        {/* Critical */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Critical Events
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {reportData.critical}
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-red-50 flex items-center justify-center">

              <TriangleAlert className="w-5 h-5 text-red-600" />

            </div>

          </div>

          <p className="text-xs text-red-600 mt-4">
            Requires immediate attention
          </p>

        </div>


        {/* Average severity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Average Severity
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {reportData.averageSeverity}
                <span className="text-sm text-gray-400 ml-1">
                  / 10
                </span>
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center">

              <TrendingUp className="w-5 h-5 text-orange-600" />

            </div>

          </div>

          <p className="text-xs text-orange-600 mt-4">
            Across rated disasters
          </p>

        </div>


        {/* Most common */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Most Reported Type
              </p>

              <p className="text-xl font-bold text-gray-900 mt-3">
                {reportData.topDisasterType[0]}
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center">

              <ShieldAlert className="w-5 h-5 text-green-600" />

            </div>

          </div>

          <p className="text-xs text-green-600 mt-4">
            {reportData.topDisasterType[1]} recorded events
          </p>

        </div>

      </div>


      {/* ===================================== */}
      {/* SEVERITY OVERVIEW */}
      {/* ===================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Severity Distribution */}

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">

          <div className="px-5 py-4 border-b border-gray-200">

            <h2 className="text-lg font-semibold text-gray-900">
              Severity Distribution
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Breakdown of reported disaster severity levels.
            </p>

          </div>

          <div className="p-5 space-y-5">

            <SeverityBar
              label="Critical"
              value={reportData.critical}
              total={reportData.total}
              color="bg-red-500"
              textColor="text-red-600"
            />

            <SeverityBar
              label="High"
              value={reportData.high}
              total={reportData.total}
              color="bg-orange-500"
              textColor="text-orange-600"
            />

            <SeverityBar
              label="Medium"
              value={reportData.medium}
              total={reportData.total}
              color="bg-yellow-500"
              textColor="text-yellow-600"
            />

            <SeverityBar
              label="Low"
              value={reportData.low}
              total={reportData.total}
              color="bg-green-500"
              textColor="text-green-600"
            />

          </div>

        </div>


        {/* Response Snapshot */}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

          <div className="px-5 py-4 border-b border-gray-200">

            <h2 className="text-lg font-semibold text-gray-900">
              Response Snapshot
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Current system indicators.
            </p>

          </div>

          <div className="p-5 space-y-4">

            <ReportMetric
              icon={<Users className="w-5 h-5 text-blue-600" />}
              label="Affected Population"
              value="24,580"
              description="Estimated people"
            />

            <ReportMetric
              icon={<Package className="w-5 h-5 text-green-600" />}
              label="Resources Tracked"
              value="8"
              description="Inventory categories"
            />

            <ReportMetric
              icon={<ShieldAlert className="w-5 h-5 text-orange-600" />}
              label="Priority Zones"
              value={reportData.critical + reportData.high}
              description="High + critical events"
            />

            <ReportMetric
              icon={<CalendarDays className="w-5 h-5 text-purple-600" />}
              label="Reporting Scope"
              value="Live"
              description="Backend connected"
            />

          </div>

        </div>

      </div>


      {/* ===================================== */}
      {/* REPORT TABLE */}
      {/* ===================================== */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-200">

          <h2 className="text-lg font-semibold text-gray-900">
            Disaster Activity Report
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Latest disaster records available to the system.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  ID
                </th>

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

              {disasters.slice(0, 10).map((disaster) => (

                <tr
                  key={disaster.id}
                  className="hover:bg-gray-50 transition"
                >

                  <td className="px-5 py-4 text-sm font-medium text-gray-900">
                    #{disaster.id}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    {disaster.type || "Unknown"}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    {disaster.country || "—"}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    {disaster.location || "—"}
                  </td>

                  <td className="px-5 py-4">

                    <SeverityBadge
                      severity={disaster.severity}
                    />

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>


      {/* ===================================== */}
      {/* FOOTER */}
      {/* ===================================== */}

      <div className="flex items-center gap-2 text-xs text-gray-500">

        <Activity className="w-4 h-4" />

        Reports are generated from the latest data available
        from the disaster response backend.

      </div>

    </div>
  )
}


// =========================================
// SEVERITY BAR
// =========================================

function SeverityBar({
  label,
  value,
  total,
  color,
  textColor,
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0

  return (
    <div>

      <div className="flex items-center justify-between mb-2">

        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>

        <span className={`text-sm font-semibold ${textColor}`}>
          {value} ({percentage}%)
        </span>

      </div>

      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">

        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />

      </div>

    </div>
  )
}


// =========================================
// REPORT METRIC
// =========================================

function ReportMetric({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
        {icon}
      </div>

      <div className="flex-1">

        <p className="text-xs text-gray-500">
          {label}
        </p>

        <p className="text-lg font-bold text-gray-900">
          {value}
        </p>

        <p className="text-xs text-gray-400">
          {description}
        </p>

      </div>

    </div>
  )
}


// =========================================
// SEVERITY BADGE
// =========================================

function SeverityBadge({ severity }) {
  const value = Number(severity)

  let label = "Not rated"
  let style = "bg-gray-100 text-gray-500"

  if (value >= 8) {
    label = "Critical"
    style = "bg-red-100 text-red-700"
  } else if (value >= 6) {
    label = "High"
    style = "bg-orange-100 text-orange-700"
  } else if (value >= 4) {
    label = "Medium"
    style = "bg-yellow-100 text-yellow-700"
  } else if (value >= 1) {
    label = "Low"
    style = "bg-green-100 text-green-700"
  }

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  )
}

export default Reports