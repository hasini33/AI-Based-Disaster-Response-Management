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
  FileText,
  ClipboardList,
  CheckCircle2,
} from "lucide-react"

import { getDisasters } from "../services/disasterService"
import { getZones } from "../services/zoneService"
import { getResources } from "../services/resourceService"


function Reports() {

  // =========================================================
  // STATE
  // =========================================================

  const [disasters, setDisasters] = useState([])
  const [zones, setZones] = useState([])
  const [resources, setResources] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [selectedPeriod, setSelectedPeriod] = useState("All")


  // =========================================================
  // LOAD REPORT DATA FROM BACKEND
  // =========================================================

  async function loadReports() {

    try {

      setLoading(true)
      setError("")

      const [
        disasterData,
        zoneData,
        resourceData,
      ] = await Promise.all([
        getDisasters(),
        getZones(),
        getResources(),
      ])

      console.log(
        "Report disasters:",
        disasterData
      )

      console.log(
        "Report zones:",
        zoneData
      )

      console.log(
        "Report resources:",
        resourceData
      )

      setDisasters(
        Array.isArray(disasterData)
          ? disasterData
          : []
      )

      setZones(
        Array.isArray(zoneData)
          ? zoneData
          : []
      )

      setResources(
        Array.isArray(resourceData)
          ? resourceData
          : []
      )

    } catch (err) {

      console.error(
        "Failed to load report data:",
        err
      )

      setError(
        err?.message ||
        "Unable to load report data"
      )

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadReports()

  }, [])


  // =========================================================
  // FILTER DISASTERS
  // =========================================================

  const filteredDisasters = useMemo(() => {

    if (selectedPeriod === "All") {
      return disasters
    }

    const now = new Date()

    const sevenDaysAgo = new Date(
      now.getTime() -
      7 * 24 * 60 * 60 * 1000
    )

    return disasters.filter((disaster) => {

      const dateValue =
        disaster.event_date ||
        disaster.eventDate ||
        disaster.time

      if (!dateValue) {
        return true
      }

      const eventDate =
        new Date(dateValue)

      if (
        Number.isNaN(
          eventDate.getTime()
        )
      ) {
        return true
      }

      return eventDate >= sevenDaysAgo

    })

  }, [
    disasters,
    selectedPeriod,
  ])


  // =========================================================
  // REPORT CALCULATIONS
  // =========================================================

  const reportData = useMemo(() => {

    const total =
      filteredDisasters.length


    const critical =
      filteredDisasters.filter(
        (d) =>
          Number(d.severity) >= 8
      ).length


    const high =
      filteredDisasters.filter(
        (d) =>
          Number(d.severity) >= 6 &&
          Number(d.severity) < 8
      ).length


    const medium =
      filteredDisasters.filter(
        (d) =>
          Number(d.severity) >= 4 &&
          Number(d.severity) < 6
      ).length


    const low =
      filteredDisasters.filter(
        (d) =>
          Number(d.severity) >= 1 &&
          Number(d.severity) < 4
      ).length


    const rated =
      filteredDisasters.filter(
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


    // =======================================================
    // MOST COMMON DISASTER TYPE
    // =======================================================

    const types = {}

    filteredDisasters.forEach(
      (disaster) => {

        const type =
          disaster.disaster_type ||
          disaster.type ||
          "Unknown"

        types[type] =
          (types[type] || 0) + 1

      }
    )


    const topDisasterType =
      Object.entries(types).sort(
        (a, b) =>
          b[1] - a[1]
      )[0] || [
        "No data",
        0,
      ]


    // =======================================================
    // AFFECTED POPULATION
    // =======================================================

    const affectedPopulation =
      zones.reduce(
        (
          totalAffected,
          zone
        ) => {

          const population =
            Number(
              zone.estimated_population ||
              0
            )

          const damage =
            Number(
              zone.damage_percent ||
              0
            )

          const affected =
            population *
            damage /
            100

          return (
            totalAffected +
            affected
          )

        },
        0
      )


    // =======================================================
    // PRIORITY ZONES
    // =======================================================

    const priorityZones =
      zones.filter(
        (zone) => {

          const severity =
            Number(
              zone.severity_score ||
              0
            )

          const priority =
            Number(
              zone.priority_override ||
              0
            )

          return (
            severity >= 6 ||
            priority >= 4
          )

        }
      ).length


    // =======================================================
    // RESOURCE COUNT
    // =======================================================

    const resourceTypes =
      new Set()

    resources.forEach(
      (resource) => {

        const type =
          resource.resource_type ||
          resource.type ||
          resource.name

        if (type) {
          resourceTypes.add(type)
        }

      }
    )


    const resourcesTracked =
      resourceTypes.size > 0
        ? resourceTypes.size
        : resources.length


    return {

      total,
      critical,
      high,
      medium,
      low,

      averageSeverity,

      topDisasterType,

      affectedPopulation,

      priorityZones,

      resourcesTracked,

    }

  }, [
    filteredDisasters,
    zones,
    resources,
  ])


  // =========================================================
  // POST-EVENT ANALYTICS
  // =========================================================

  const postEventAnalytics = useMemo(() => {

    const totalEvents =
      filteredDisasters.length


    const criticalEvents =
      filteredDisasters.filter(
        (disaster) =>
          Number(
            disaster.severity
          ) >= 8
      ).length


    const highEvents =
      filteredDisasters.filter(
        (disaster) =>
          Number(
            disaster.severity
          ) >= 6 &&
          Number(
            disaster.severity
          ) < 8
      ).length


    const ratedEvents =
      filteredDisasters.filter(
        (disaster) =>
          Number(
            disaster.severity
          ) > 0
      )


    const averageSeverity =
      ratedEvents.length > 0
        ? (
            ratedEvents.reduce(
              (
                sum,
                disaster
              ) =>
                sum +
                Number(
                  disaster.severity
                ),
              0
            ) /
            ratedEvents.length
          ).toFixed(1)
        : "0.0"


    const completedEvents =
      filteredDisasters.filter(
        (disaster) => {

          const status =
            String(
              disaster.status ||
              ""
            ).toLowerCase()

          return (
            status === "completed" ||
            status === "resolved" ||
            status === "closed"
          )

        }
      ).length


    const totalZoneCount =
      zones.length


    const affectedZoneCount =
      zones.filter(
        (zone) =>
          Number(
            zone.damage_percent ||
            0
          ) > 0
      ).length


    const highestSeverity =
      ratedEvents.length > 0
        ? Math.max(
            ...ratedEvents.map(
              (disaster) =>
                Number(
                  disaster.severity
                )
            )
          )
        : 0


    const coveragePercent =
      totalZoneCount > 0
        ? Math.round(
            (
              affectedZoneCount /
              totalZoneCount
            ) * 100
          )
        : 0


    let overallStatus =
      "Stable"

    if (
      criticalEvents > 0
    ) {

      overallStatus =
        "Critical"

    } else if (
      highEvents > 0
    ) {

      overallStatus =
        "High Alert"

    } else if (
      totalEvents > 0
    ) {

      overallStatus =
        "Active"

    }


    return {

      totalEvents,

      criticalEvents,

      highEvents,

      averageSeverity,

      completedEvents,

      totalZoneCount,

      affectedZoneCount,

      highestSeverity,

      coveragePercent,

      overallStatus,

    }

  }, [
    filteredDisasters,
    zones,
  ])


  // =========================================================
  // GENERATE SITUATION REPORT
  // =========================================================

  function generateSituationReport() {

    const reportDate =
      new Date().toLocaleString()

    const lines = [

      "DISASTER RESPONSE SITUATION REPORT",
      "===================================",
      "",
      `Generated: ${reportDate}`,
      `Reporting Scope: ${
        selectedPeriod === "All"
          ? "All Records"
          : "Current Events"
      }`,
      "",
      "1. EXECUTIVE SUMMARY",
      "--------------------",
      `Overall Status: ${
        postEventAnalytics.overallStatus
      }`,
      `Total Disaster Events: ${
        postEventAnalytics.totalEvents
      }`,
      `Critical Events: ${
        postEventAnalytics.criticalEvents
      }`,
      `High Severity Events: ${
        postEventAnalytics.highEvents
      }`,
      `Average Severity: ${
        postEventAnalytics.averageSeverity
      } / 10`,
      "",
      "2. IMPACT ASSESSMENT",
      "--------------------",
      `Affected Population: ${
        Math.round(
          reportData.affectedPopulation
        ).toLocaleString()
      }`,
      `Affected Zones: ${
        postEventAnalytics.affectedZoneCount
      }`,
      `Total Zones Monitored: ${
        postEventAnalytics.totalZoneCount
      }`,
      `Zone Impact Coverage: ${
        postEventAnalytics.coveragePercent
      }%`,
      `Highest Recorded Severity: ${
        postEventAnalytics.highestSeverity
      } / 10`,
      "",
      "3. DISASTER PROFILE",
      "-------------------",
      `Most Reported Disaster Type: ${
        reportData.topDisasterType[0]
      }`,
      `Recorded Events of Top Type: ${
        reportData.topDisasterType[1]
      }`,
      "",
      "4. RESPONSE SNAPSHOT",
      "--------------------",
      `Resources Tracked: ${
        reportData.resourcesTracked
      }`,
      `Priority Zones: ${
        reportData.priorityZones
      }`,
      `Completed/Resolved Events: ${
        postEventAnalytics.completedEvents
      }`,
      "",
      "5. SEVERITY DISTRIBUTION",
      "------------------------",
      `Critical: ${
        reportData.critical
      }`,
      `High: ${
        reportData.high
      }`,
      `Medium: ${
        reportData.medium
      }`,
      `Low: ${
        reportData.low
      }`,
      "",
      "6. OPERATIONAL ASSESSMENT",
      "-------------------------",
      postEventAnalytics.criticalEvents > 0
        ? "Immediate attention remains required for critical events."
        : "No critical events are currently recorded.",
      postEventAnalytics.affectedZoneCount > 0
        ? "Affected zones require continued monitoring and response coordination."
        : "No affected zones are currently recorded.",
      reportData.priorityZones > 0
        ? "Priority zones should remain under active response monitoring."
        : "No high-priority zones are currently identified.",
      "",
      "END OF SITUATION REPORT",
      "Generated from the disaster response system data.",
    ]


    const reportText =
      lines.join("\n")


    const blob =
      new Blob(
        [reportText],
        {
          type:
            "text/plain;charset=utf-8;",
        }
      )


    const url =
      URL.createObjectURL(blob)


    const link =
      document.createElement("a")


    link.href = url

    link.download =
      "post-event-situation-report.txt"


    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    URL.revokeObjectURL(url)

  }


  // =========================================================
  // DOWNLOAD CSV REPORT
  // =========================================================

  function downloadReport() {

    if (
      !filteredDisasters.length
    ) {

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
      "Event Date",

    ]


    const rows =
      filteredDisasters.map(
        (disaster) => [

          disaster.id ?? "",

          disaster.disaster_type ??
          disaster.type ??
          "",

          disaster.country ??
          "",

          disaster.location ??
          "",

          disaster.severity ??
          "",

          disaster.alert_level ??
          disaster.alertLevel ??
          "",

          disaster.latitude ??
          "",

          disaster.longitude ??
          "",

          disaster.event_date ??
          disaster.eventDate ??
          "",

        ]
      )


    const csvContent = [

      headers.join(","),

      ...rows.map(
        (row) =>
          row
            .map(
              (value) =>
                `"${String(
                  value
                ).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
      ),

    ].join("\n")


    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
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
  // ERROR
  // =========================================================

  if (error) {

    return (

      <div className="
        min-h-96
        flex
        items-center
        justify-center
        bg-sky-50
        dark:bg-slate-950
        rounded-xl
        px-6
      ">

        <div className="text-center">

          <div className="
            w-12
            h-12
            mx-auto
            rounded-xl
            bg-red-100
            dark:bg-red-950/50
            flex
            items-center
            justify-center
          ">

            <TriangleAlert
              className="
                w-6
                h-6
                text-red-600
                dark:text-red-400
              "
            />

          </div>


          <h2 className="
            mt-4
            text-lg
            font-bold
            text-slate-900
            dark:text-white
          ">

            Unable to load reports

          </h2>


          <p className="
            mt-2
            text-sm
            text-slate-500
            dark:text-slate-400
          ">

            {error}

          </p>


          <button
            onClick={loadReports}
            className="
              mt-5
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
            "
          >

            <RefreshCw className="w-4 h-4" />

            Retry

          </button>

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

            <span className="
              text-sm
              font-semibold
            ">

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


          {/* EXPORT CSV */}

          <button
            onClick={downloadReport}
            disabled={
              filteredDisasters.length === 0
            }
            className="
              inline-flex
              items-center
              gap-2
              bg-blue-600
              hover:bg-blue-700
              disabled:bg-slate-400
              disabled:cursor-not-allowed
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


        {/* SEVERITY DISTRIBUTION */}

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


          <div className="
            p-5
            space-y-5
          ">

            <SeverityBar
              label="Critical"
              value={reportData.critical}
              total={reportData.total}
              color="bg-red-700"
              textColor="
                text-red-600
                dark:text-red-400
              "
            />


            <SeverityBar
              label="High"
              value={reportData.high}
              total={reportData.total}
              color="bg-orange-700"
              textColor="
                text-orange-600
                dark:text-orange-400
              "
            />


            <SeverityBar
              label="Medium"
              value={reportData.medium}
              total={reportData.total}
              color="bg-yellow-700"
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


        {/* RESPONSE SNAPSHOT */}

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


          <div className="
            p-5
            space-y-4
          ">

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
              value={
                Math.round(
                  reportData.affectedPopulation
                ).toLocaleString()
              }
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
              value={
                reportData.resourcesTracked
              }
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
                reportData.priorityZones
              }
              description="High priority zones"
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
          POST-EVENT ANALYTICS / SITUATION REPORT
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


        {/* HEADER */}

        <div className="
          px-5
          py-4
          border-b
          border-blue-200
          dark:border-slate-800
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
        ">

          <div>

            <div className="
              flex
              items-center
              gap-2
            ">

              <ClipboardList className="
                w-5
                h-5
                text-blue-600
                dark:text-blue-400
              " />

              <h2 className="
                text-lg
                font-semibold
                text-slate-900
                dark:text-white
              ">

                Post-Event Analytics

              </h2>

            </div>


            <p className="
              text-sm
              text-slate-500
              dark:text-slate-400
              mt-1
            ">

              Situation report generated from the latest
              disaster response data.

            </p>

          </div>


          {/* GENERATE SITREP */}

          <button
            onClick={
              generateSituationReport
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              bg-blue-600
              hover:bg-blue-700
              text-white
              px-4
              py-2.5
              rounded-lg
              text-sm
              font-semibold
              shadow-sm
              transition
            "
          >

            <FileText className="
              w-4
              h-4
            " />

            Generate Situation Report

          </button>

        </div>


        {/* ANALYTICS */}

        <div className="
          p-5
        ">

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-4
          ">


            {/* STATUS */}

            <AnalyticsCard
              icon={
                <Activity className="
                  w-5
                  h-5
                  text-blue-600
                  dark:text-blue-400
                " />
              }
              label="Overall Status"
              value={
                postEventAnalytics.overallStatus
              }
              description="Current response assessment"
            />


            {/* EVENTS */}

            <AnalyticsCard
              icon={
                <TriangleAlert className="
                  w-5
                  h-5
                  text-red-600
                  dark:text-red-400
                " />
              }
              label="Events Reviewed"
              value={
                postEventAnalytics.totalEvents
              }
              description="Events included in analysis"
            />


            {/* ZONES */}

            <AnalyticsCard
              icon={
                <ShieldAlert className="
                  w-5
                  h-5
                  text-orange-600
                  dark:text-orange-400
                " />
              }
              label="Affected Zones"
              value={
                postEventAnalytics.affectedZoneCount
              }
              description={`
                ${postEventAnalytics.coveragePercent}%
                of monitored zones
              `}
            />


            {/* COMPLETED */}

            <AnalyticsCard
              icon={
                <CheckCircle2 className="
                  w-5
                  h-5
                  text-green-600
                  dark:text-green-400
                " />
              }
              label="Completed / Resolved"
              value={
                postEventAnalytics.completedEvents
              }
              description="Recorded resolved events"
            />

          </div>


          {/* SITREP SUMMARY */}

          <div className="
            mt-5
            grid
            grid-cols-1
            lg:grid-cols-3
            gap-4
          ">


            {/* EXECUTIVE SUMMARY */}

            <div className="
              lg:col-span-2
              rounded-lg
              border
              border-blue-200
              dark:border-slate-700
              bg-blue-100/50
              dark:bg-slate-800/60
              p-4
            ">

              <div className="
                flex
                items-center
                gap-2
                mb-3
              ">

                <FileText className="
                  w-4
                  h-4
                  text-blue-600
                  dark:text-blue-400
                " />

                <h3 className="
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                ">

                  Situation Summary

                </h3>

              </div>


              <p className="
                text-sm
                leading-6
                text-slate-600
                dark:text-slate-300
              ">

                The current assessment covers{" "}

                <span className="
                  font-semibold
                  text-slate-900
                  dark:text-white
                ">

                  {postEventAnalytics.totalEvents}

                </span>

                {" "}recorded disaster events across{" "}

                <span className="
                  font-semibold
                  text-slate-900
                  dark:text-white
                ">

                  {postEventAnalytics.affectedZoneCount}

                </span>

                {" "}affected zones. The average recorded
                severity is{" "}

                <span className="
                  font-semibold
                  text-slate-900
                  dark:text-white
                ">

                  {postEventAnalytics.averageSeverity}
                  /10

                </span>

                . The highest recorded severity is{" "}

                <span className="
                  font-semibold
                  text-slate-900
                  dark:text-white
                ">

                  {postEventAnalytics.highestSeverity}
                  /10

                </span>

                . The most frequently reported disaster
                type is{" "}

                <span className="
                  font-semibold
                  text-blue-600
                  dark:text-blue-400
                ">

                  {reportData.topDisasterType[0]}

                </span>

                .

              </p>

            </div>


            {/* RESPONSE ASSESSMENT */}

            <div className="
              rounded-lg
              border
              border-blue-200
              dark:border-slate-700
              bg-blue-100/50
              dark:bg-slate-800/60
              p-4
            ">

              <div className="
                flex
                items-center
                gap-2
                mb-3
              ">

                <Activity className="
                  w-4
                  h-4
                  text-green-600
                  dark:text-green-400
                " />

                <h3 className="
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                ">

                  Response Assessment

                </h3>

              </div>


              <div className="
                space-y-3
              ">


                <AssessmentRow
                  label="Critical Events"
                  value={
                    postEventAnalytics.criticalEvents
                  }
                />


                <AssessmentRow
                  label="Priority Zones"
                  value={
                    reportData.priorityZones
                  }
                />


                <AssessmentRow
                  label="Resources Tracked"
                  value={
                    reportData.resourcesTracked
                  }
                />


                <AssessmentRow
                  label="Impact Coverage"
                  value={`
                    ${postEventAnalytics.coveragePercent}%
                  `}
                />

              </div>

            </div>

          </div>


          {/* NOTE */}

          <div className="
            mt-4
            flex
            items-start
            gap-2
            text-xs
            text-slate-500
            dark:text-slate-400
          ">

            <Activity className="
              w-4
              h-4
              shrink-0
              mt-0.5
            " />

            <p>

              The situation report is generated locally from
              the disaster, zone and resource data already
              loaded by this Reports page. It can later be
              connected to a dedicated backend report service
              when one is available.

            </p>

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
                ].map(
                  (heading) => (

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

                  )
                )}

              </tr>

            </thead>


            <tbody className="
              divide-y
              divide-blue-100
              dark:divide-slate-800
            ">


              {filteredDisasters
                .slice(0, 10)
                .map(
                  (disaster) => (

                    <tr
                      key={
                        disaster.id
                      }
                      className="
                        hover:bg-blue-100/70
                        dark:hover:bg-slate-800/60
                        transition
                      "
                    >

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


                      <td className="
                        px-5
                        py-4
                        text-sm
                        text-slate-700
                        dark:text-slate-300
                      ">

                        {disaster.disaster_type ||
                         disaster.type ||
                         "Unknown"}

                      </td>


                      <td className="
                        px-5
                        py-4
                        text-sm
                        text-slate-700
                        dark:text-slate-300
                      ">

                        {disaster.country ||
                         "—"}

                      </td>


                      <td className="
                        px-5
                        py-4
                        text-sm
                        text-slate-700
                        dark:text-slate-300
                      ">

                        {disaster.location ||
                         "—"}

                      </td>


                      <td className="
                        px-5
                        py-4
                      ">

                        <SeverityBadge
                          severity={
                            disaster.severity
                          }
                        />

                      </td>

                    </tr>

                  )
                )}


              {filteredDisasters.length === 0 && (

                <tr>

                  <td
                    colSpan={5}
                    className="
                      px-5
                      py-10
                      text-center
                      text-sm
                      text-slate-500
                      dark:text-slate-400
                    "
                  >

                    No disaster records available
                    for this period.

                  </td>

                </tr>

              )}

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
            width:
              `${percentage}%`,
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
   ANALYTICS CARD
========================================================= */

function AnalyticsCard({
  icon,
  label,
  value,
  description,
}) {

  return (

    <div className="
      rounded-lg
      border
      border-blue-200
      dark:border-slate-700
      bg-white/50
      dark:bg-slate-950/40
      p-4
    ">

      <div className="
        flex
        items-center
        gap-3
      ">

        <div className="
          w-10
          h-10
          rounded-lg
          bg-blue-100
          dark:bg-slate-800
          flex
          items-center
          justify-center
        ">

          {icon}

        </div>


        <div className="min-w-0">

          <p className="
            text-xs
            text-slate-500
            dark:text-slate-400
          ">

            {label}

          </p>


          <p className="
            text-xl
            font-bold
            text-slate-900
            dark:text-white
            truncate
          ">

            {value}

          </p>

        </div>

      </div>


      <p className="
        text-xs
        text-slate-400
        dark:text-slate-500
        mt-3
      ">

        {description}

      </p>

    </div>

  )
}


/* =========================================================
   ASSESSMENT ROW
========================================================= */

function AssessmentRow({
  label,
  value,
}) {

  return (

    <div className="
      flex
      items-center
      justify-between
      gap-3
    ">

      <span className="
        text-xs
        text-slate-500
        dark:text-slate-400
      ">

        {label}

      </span>


      <span className="
        text-sm
        font-bold
        text-slate-900
        dark:text-white
      ">

        {value}

      </span>

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


  let label =
    "Not rated"


  let style = `
    bg-slate-100
    text-slate-500
    dark:bg-slate-800
    dark:text-slate-400
  `


  if (value >= 8) {

    label =
      "Critical"

    style = `
      bg-red-100
      text-red-700
      dark:bg-red-950/60
      dark:text-red-400
    `

  } else if (value >= 6) {

    label =
      "High"

    style = `
      bg-orange-100
      text-orange-700
      dark:bg-orange-950/60
      dark:text-orange-400
    `

  } else if (value >= 4) {

    label =
      "Medium"

    style = `
      bg-yellow-100
      text-yellow-700
      dark:bg-yellow-950/60
      dark:text-yellow-400
    `

  } else if (value >= 1) {

    label =
      "Low"

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