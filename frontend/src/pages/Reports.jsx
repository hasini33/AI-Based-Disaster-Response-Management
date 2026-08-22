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


  // =========================================================
  // LOAD DISASTER DATA
  // =========================================================

  useEffect(() => {

    async function loadReports() {

      try {

        const data = await getDisasters()

        console.log("Report data:", data)

        setDisasters(
          Array.isArray(data)
            ? data
            : []
        )

      } catch (error) {

        console.error(
          "Failed to load report data:",
          error
        )

      } finally {

        setLoading(false)

      }

    }

    loadReports()

  }, [])


  // =========================================================
  // REPORT CALCULATIONS
  // =========================================================

  const reportData = useMemo(() => {

    const total = disasters.length


    const critical = disasters.filter(
      (d) =>
        Number(d.severity) >= 8
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
      (d) =>
        Number(d.severity) > 0
    )


    const averageSeverity =
      rated.length > 0
        ? (
            rated.reduce(
              (sum, d) =>
                sum + Number(d.severity),
              0
            ) / rated.length
          ).toFixed(1)
        : "0.0"


    const types = {}


    disasters.forEach((disaster) => {

      const type =
        disaster.type || "Unknown"

      types[type] =
        (types[type] || 0) + 1

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


  // =========================================================
  // DOWNLOAD CSV REPORT
  // =========================================================

  function downloadReport() {

    if (!disasters.length) {
      return
    }


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


    const rows =
      disasters.map((disaster) => [

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
            `"${String(value).replace(
              /"/g,
              '""'
            )}"`
          )
          .join(",")
      ),

    ].join("\n")


    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    )


    const url =
      URL.createObjectURL(blob)


    const link =
      document.createElement("a")


    link.href = url

    link.download =
      "disaster-response-report.csv"


    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    URL.revokeObjectURL(url)

  }


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="
        min-h-96
        flex
        items-center
        justify-center
        bg-sky-50
        dark:bg-slate-950
        rounded-xl
      ">

        <div className="text-center">

          <RefreshCw
            className="
              w-8
              h-8
              text-blue-600
              dark:text-blue-400
              animate-spin
              mx-auto
            "
          />

          <p className="
            mt-3
            text-sm
            text-slate-500
            dark:text-slate-400
          ">

            Preparing response reports...

          </p>

        </div>

      </div>

    )

  }


  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <div className="
      space-y-6
      text-slate-900
      dark:text-slate-100
    ">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="
        flex
        flex-col
        lg:flex-row
        lg:items-center
        lg:justify-between
        gap-4
      ">


        {/* TITLE */}

        <div>

          <div className="
            flex
            items-center
            gap-2
            text-blue-600
            dark:text-blue-400
            mb-2
          ">

            <FileBarChart className="w-5 h-5" />

            <span className="text-sm font-semibold">

              Response Intelligence

            </span>

          </div>


          <h1 className="
            text-3xl
            font-bold
            text-slate-900
            dark:text-white
          ">

            Reports & Insights

          </h1>


          <p className="
            mt-2
            text-slate-600
            dark:text-slate-400
          ">

            Analyze disaster activity, severity patterns
            and response priorities.

          </p>

        </div>


        {/* CONTROLS */}

        <div className="
          flex
          items-center
          gap-3
          flex-wrap
        ">


          {/* PERIOD */}

          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(
                e.target.value
              )
            }
            className="
              border
              border-blue-200
              dark:border-slate-700
              bg-blue-50
              dark:bg-slate-900
              text-slate-900
              dark:text-slate-100
              rounded-lg
              px-4
              py-2.5
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          >

            <option value="All">
              All Records
            </option>

            <option value="Current">
              Current Events
            </option>

          </select>


          {/* EXPORT */}

          <button
            onClick={downloadReport}
            className="
              inline-flex
              items-center
              gap-2
              bg-blue-600
              hover:bg-blue-700
              text-white
              px-4
              py-2.5
              rounded-lg
              text-sm
              font-semibold
              transition
              shadow-sm
            "
          >

            <Download className="w-4 h-4" />

            Export CSV

          </button>

        </div>

      </div>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-4
        gap-5
      ">


        {/* TOTAL EVENTS */}

        <SummaryCard
          label="Total Events"
          value={reportData.total}
          description="Recorded disaster events"
          icon={
            <Activity
              className="
                w-5
                h-5
                text-blue-600
                dark:text-blue-400
              "
            />
          }
          iconBg="
            bg-blue-100
            dark:bg-blue-950
          "
          descriptionColor="
            text-blue-600
            dark:text-blue-400
          "
        />


        {/* CRITICAL EVENTS */}

        <SummaryCard
          label="Critical Events"
          value={reportData.critical}
          description="Requires immediate attention"
          icon={
            <TriangleAlert
              className="
                w-5
                h-5
                text-red-600
                dark:text-red-400
              "
            />
          }
          iconBg="
            bg-red-100
            dark:bg-red-950/50
          "
          descriptionColor="
            text-red-600
            dark:text-red-400
          "
        />


        {/* AVERAGE SEVERITY */}

        <SummaryCard
          label="Average Severity"
          value={
            <>
              {reportData.averageSeverity}

              <span className="
                text-sm
                text-slate-400
                dark:text-slate-500
                ml-1
              ">

                / 10

              </span>
            </>
          }
          description="Across rated disasters"
          icon={
            <TrendingUp
              className="
                w-5
                h-5
                text-orange-600
                dark:text-orange-400
              "
            />
          }
          iconBg="
            bg-orange-100
            dark:bg-orange-950/50
          "
          descriptionColor="
            text-orange-600
            dark:text-orange-400
          "
        />


        {/* MOST COMMON */}

        <SummaryCard
          label="Most Reported Type"
          value={
            reportData.topDisasterType[0]
          }
          description={`
            ${reportData.topDisasterType[1]}
            recorded events
          `}
          icon={
            <ShieldAlert
              className="
                w-5
                h-5
                text-green-600
                dark:text-green-400
              "
            />
          }
          iconBg="
            bg-green-100
            dark:bg-green-950/50
          "
          descriptionColor="
            text-green-600
            dark:text-green-400
          "
        />

      </div>


      {/* =====================================================
          SEVERITY + SNAPSHOT
      ===================================================== */}

      <div className="
        grid
        grid-cols-1
        lg:grid-cols-3
        gap-6
      ">


        {/* ===================================================
            SEVERITY DISTRIBUTION
        =================================================== */}

        <div className="
          lg:col-span-2
          bg-blue-50
          dark:bg-slate-900
          rounded-xl
          border
          border-blue-200
          dark:border-slate-800
          shadow-sm
          overflow-hidden
        ">


          {/* HEADER */}

          <div className="
            px-5
            py-4
            border-b
            border-blue-200
            dark:border-slate-800
          ">

            <h2 className="
              text-lg
              font-semibold
              text-slate-900
              dark:text-white
            ">

              Severity Distribution

            </h2>


            <p className="
              text-sm
              text-slate-500
              dark:text-slate-400
              mt-1
            ">

              Breakdown of reported disaster
              severity levels.

            </p>

          </div>


          {/* BARS */}

          <div className="p-5 space-y-5">

            <SeverityBar
              label="Critical"
              value={reportData.critical}
              total={reportData.total}
              color="bg-red-500"
              textColor="
                text-red-600
                dark:text-red-400
              "
            />


            <SeverityBar
              label="High"
              value={reportData.high}
              total={reportData.total}
              color="bg-orange-500"
              textColor="
                text-orange-600
                dark:text-orange-400
              "
            />


            <SeverityBar
              label="Medium"
              value={reportData.medium}
              total={reportData.total}
              color="bg-yellow-500"
              textColor="
                text-yellow-600
                dark:text-yellow-400
              "
            />


            <SeverityBar
              label="Low"
              value={reportData.low}
              total={reportData.total}
              color="bg-green-500"
              textColor="
                text-green-600
                dark:text-green-400
              "
            />

          </div>

        </div>


        {/* ===================================================
            RESPONSE SNAPSHOT
        =================================================== */}

        <div className="
          bg-blue-50
          dark:bg-slate-900
          rounded-xl
          border
          border-blue-200
          dark:border-slate-800
          shadow-sm
          overflow-hidden
        ">


          {/* HEADER */}

          <div className="
            px-5
            py-4
            border-b
            border-blue-200
            dark:border-slate-800
          ">

            <h2 className="
              text-lg
              font-semibold
              text-slate-900
              dark:text-white
            ">

              Response Snapshot

            </h2>


            <p className="
              text-sm
              text-slate-500
              dark:text-slate-400
              mt-1
            ">

              Current system indicators.

            </p>

          </div>


          {/* METRICS */}

          <div className="p-5 space-y-4">

            <ReportMetric
              icon={
                <Users
                  className="
                    w-5
                    h-5
                    text-blue-600
                    dark:text-blue-400
                  "
                />
              }
              label="Affected Population"
              value="24,580"
              description="Estimated people"
            />


            <ReportMetric
              icon={
                <Package
                  className="
                    w-5
                    h-5
                    text-green-600
                    dark:text-green-400
                  "
                />
              }
              label="Resources Tracked"
              value="8"
              description="Inventory categories"
            />


            <ReportMetric
              icon={
                <ShieldAlert
                  className="
                    w-5
                    h-5
                    text-orange-600
                    dark:text-orange-400
                  "
                />
              }
              label="Priority Zones"
              value={
                reportData.critical +
                reportData.high
              }
              description="High + critical events"
            />


            <ReportMetric
              icon={
                <CalendarDays
                  className="
                    w-5
                    h-5
                    text-purple-600
                    dark:text-purple-400
                  "
                />
              }
              label="Reporting Scope"
              value="Live"
              description="Backend connected"
            />

          </div>

        </div>

      </div>


      {/* =====================================================
          REPORT TABLE
      ===================================================== */}

      <div className="
        bg-blue-50
        dark:bg-slate-900
        rounded-xl
        border
        border-blue-200
        dark:border-slate-800
        shadow-sm
        overflow-hidden
      ">


        {/* TABLE HEADER */}

        <div className="
          px-5
          py-4
          border-b
          border-blue-200
          dark:border-slate-800
        ">

          <h2 className="
            text-lg
            font-semibold
            text-slate-900
            dark:text-white
          ">

            Disaster Activity Report

          </h2>


          <p className="
            text-sm
            text-slate-500
            dark:text-slate-400
            mt-1
          ">

            Latest disaster records available
            to the system.

          </p>

        </div>


        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full">


            {/* TABLE HEAD */}

            <thead className="
              bg-blue-100
              dark:bg-slate-800
            ">

              <tr>

                {[
                  "ID",
                  "Type",
                  "Country",
                  "Location",
                  "Severity",
                ].map((heading) => (

                  <th
                    key={heading}
                    className="
                      text-left
                      px-5
                      py-3
                      text-xs
                      font-semibold
                      text-slate-600
                      dark:text-slate-400
                      uppercase
                    "
                  >

                    {heading}

                  </th>

                ))}

              </tr>

            </thead>


            {/* TABLE BODY */}

            <tbody className="
              divide-y
              divide-blue-100
              dark:divide-slate-800
            ">


              {disasters
                .slice(0, 10)
                .map((disaster) => (

                  <tr
                    key={disaster.id}
                    className="
                      hover:bg-blue-100/70
                      dark:hover:bg-slate-800/60
                      transition
                    "
                  >


                    {/* ID */}

                    <td className="
                      px-5
                      py-4
                      text-sm
                      font-medium
                      text-slate-900
                      dark:text-white
                    ">

                      #{disaster.id}

                    </td>


                    {/* TYPE */}

                    <td className="
                      px-5
                      py-4
                      text-sm
                      text-slate-700
                      dark:text-slate-300
                    ">

                      {disaster.type || "Unknown"}

                    </td>


                    {/* COUNTRY */}

                    <td className="
                      px-5
                      py-4
                      text-sm
                      text-slate-700
                      dark:text-slate-300
                    ">

                      {disaster.country || "—"}

                    </td>


                    {/* LOCATION */}

                    <td className="
                      px-5
                      py-4
                      text-sm
                      text-slate-700
                      dark:text-slate-300
                    ">

                      {disaster.location || "—"}

                    </td>


                    {/* SEVERITY */}

                    <td className="px-5 py-4">

                      <SeverityBadge
                        severity={
                          disaster.severity
                        }
                      />

                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="
        flex
        items-center
        gap-2
        text-xs
        text-slate-500
        dark:text-slate-400
      ">

        <Activity className="w-4 h-4" />

        Reports are generated from the latest data
        available from the disaster response backend.

      </div>

    </div>

  )
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon,
  iconBg,
  descriptionColor,
}) {

  return (

    <div className="
      bg-blue-50
      dark:bg-slate-900
      rounded-xl
      border
      border-blue-200
      dark:border-slate-800
      p-5
      shadow-sm
    ">

      <div className="
        flex
        items-start
        justify-between
      ">


        <div>

          <p className="
            text-sm
            text-slate-500
            dark:text-slate-400
          ">

            {label}

          </p>


          <p className="
            text-3xl
            font-bold
            text-slate-900
            dark:text-white
            mt-2
          ">

            {value}

          </p>

        </div>


        <div
          className={`
            w-11
            h-11
            rounded-lg
            flex
            items-center
            justify-center
            ${iconBg}
          `}
        >

          {icon}

        </div>

      </div>


      <p
        className={`
          text-xs
          mt-4
          ${descriptionColor}
        `}
      >

        {description}

      </p>

    </div>

  )
}


/* =========================================================
   SEVERITY BAR
========================================================= */

function SeverityBar({
  label,
  value,
  total,
  color,
  textColor,
}) {

  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0


  return (

    <div>

      <div className="
        flex
        items-center
        justify-between
        mb-2
      ">

        <span className="
          text-sm
          font-medium
          text-slate-700
          dark:text-slate-300
        ">

          {label}

        </span>


        <span
          className={`
            text-sm
            font-semibold
            ${textColor}
          `}
        >

          {value} ({percentage}%)

        </span>

      </div>


      <div className="
        w-full
        h-2.5
        bg-blue-100
        dark:bg-slate-800
        rounded-full
        overflow-hidden
      ">

        <div
          className={`
            h-full
            ${color}
            rounded-full
            transition-all
            duration-500
          `}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>

  )
}


/* =========================================================
   REPORT METRIC
========================================================= */

function ReportMetric({
  icon,
  label,
  value,
  description,
}) {

  return (

    <div className="
      flex
      items-center
      gap-3
      p-3
      rounded-lg
      bg-blue-100/70
      dark:bg-slate-800
      border
      border-blue-100
      dark:border-slate-700
    ">


      <div className="
        w-10
        h-10
        rounded-lg
        bg-blue-50
        dark:bg-slate-900
        flex
        items-center
        justify-center
      ">

        {icon}

      </div>


      <div className="flex-1">

        <p className="
          text-xs
          text-slate-500
          dark:text-slate-400
        ">

          {label}

        </p>


        <p className="
          text-lg
          font-bold
          text-slate-900
          dark:text-white
        ">

          {value}

        </p>


        <p className="
          text-xs
          text-slate-400
          dark:text-slate-500
        ">

          {description}

        </p>

      </div>

    </div>

  )
}


/* =========================================================
   SEVERITY BADGE
========================================================= */

function SeverityBadge({
  severity,
}) {

  const value =
    Number(severity)


  let label = "Not rated"

  let style = `
    bg-slate-100
    text-slate-500
    dark:bg-slate-800
    dark:text-slate-400
  `


  if (value >= 8) {

    label = "Critical"

    style = `
      bg-red-100
      text-red-700
      dark:bg-red-950/60
      dark:text-red-400
    `

  } else if (value >= 6) {

    label = "High"

    style = `
      bg-orange-100
      text-orange-700
      dark:bg-orange-950/60
      dark:text-orange-400
    `

  } else if (value >= 4) {

    label = "Medium"

    style = `
      bg-yellow-100
      text-yellow-700
      dark:bg-yellow-950/60
      dark:text-yellow-400
    `

  } else if (value >= 1) {

    label = "Low"

    style = `
      bg-green-100
      text-green-700
      dark:bg-green-950/60
      dark:text-green-400
    `

  }


  return (

    <span
      className={`
        inline-flex
        px-2.5
        py-1
        rounded-full
        text-xs
        font-semibold
        ${style}
      `}
    >

      {label}

    </span>

  )
}


export default Reports