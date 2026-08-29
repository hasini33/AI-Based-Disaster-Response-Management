import { useEffect, useMemo, useState } from "react"
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
  ShieldAlert,
  Radio,
  AlertCircle,
  CheckCircle2,
  Clock3,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { useNavigate } from "react-router-dom"

import {
  getDisasters,
  getDisasterImpact,
} from "../services/disasterService"


function Disasters() {

  // =====================================================
  // STATE

  const [disasters, setDisasters] = useState([])
  const [selectedDisaster, setSelectedDisaster] = useState(null)

  const [impactLoading, setImpactLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [severityFilter, setSeverityFilter] = useState("All")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Number of incidents displayed at one time
  const ITEMS_PER_PAGE = 8

  const navigate = useNavigate()
  // =====================================================
  // LOAD DISASTER IMPACT

  async function handleViewImpact() {

    if (!selectedDisaster) return

    try {

      setImpactLoading(true)

      const data = await getDisasterImpact(selectedDisaster.id)

      console.log("Impact data:", data)

      navigate(`/?disasterId=${selectedDisaster.id}`)

    } catch (error) {

      console.error("Failed to fetch impact:", error)

    } finally {

      setImpactLoading(false)

    }
  }
  // =====================================================
  // GET DISASTERS

  useEffect(() => {

    getDisasters()

      .then((data) => {

        console.log("Disasters received from backend:", data)

        const disasterList = Array.isArray(data)
          ? data
          : []


        // =================================================
        // REMOVE DUPLICATE INCIDENTS
        //
        // Two records are considered duplicates when they
        // have the same:
        //
        // - Disaster type
        // - Country
        // - Location
        // - Latitude
        // - Longitude
        //
        // The ID is intentionally NOT used because duplicate
        // database records can have different IDs.
        //
        const uniqueDisasters = Array.from(
          new Map(
            disasterList.map((disaster) => {

              const duplicateKey = [
                disaster.type ?? "",
                disaster.country ?? "",
                disaster.location ?? "",
                disaster.latitude ?? "",
                disaster.longitude ?? "",
              ]
                .map((value) =>
                  String(value).trim().toLowerCase()
                )
                .join("|")

              return [
                duplicateKey,
                disaster,
              ]

            })
          ).values()
        )

        console.log(
          "Unique disasters displayed:",
          uniqueDisasters
        )

        console.log(
          `Removed ${
            disasterList.length - uniqueDisasters.length
          } duplicate incident(s)`
        )

        setDisasters(uniqueDisasters)

      })

      .catch((error) => {

        console.error("Failed to fetch disasters:", error)

        setError(true)

      })

      .finally(() => {

        setLoading(false)

      })

  }, [])
  // =====================================================
  // DISASTER TYPES

  const disasterTypes = useMemo(() => {

    return [
      "All",
      ...new Set(
        disasters
          .map((disaster) => disaster.type)
          .filter(Boolean)
      ),
    ]

  }, [disasters])
  // =====================================================
  // FILTER DISASTERS

const filteredDisasters = useMemo(() => {

  return disasters.filter((disaster) => {

    // Hide incidents that do not have a valid severity
    const severity = Number(disaster.severity)

    if (!Number.isFinite(severity) || severity < 1) {
      return false
    }

    const search = searchTerm.toLowerCase().trim()

    const matchesSearch =
      !search ||
      disaster.type?.toLowerCase().includes(search) ||
      disaster.country?.toLowerCase().includes(search) ||
      disaster.location?.toLowerCase().includes(search)

    const matchesType =
      typeFilter === "All" ||
      disaster.type === typeFilter

    const matchesSeverity =
      severityFilter === "All" ||
      (
        severityFilter === "critical" &&
        severity >= 8
      ) ||
      (
        severityFilter === "high" &&
        severity >= 6 &&
        severity < 8
      ) ||
      (
        severityFilter === "medium" &&
        severity >= 4 &&
        severity < 6
      ) ||
      (
        severityFilter === "low" &&
        severity >= 1 &&
        severity < 4
      )

    return (
      matchesSearch &&
      matchesType &&
      matchesSeverity
    )

  })

}, [
  disasters,
  searchTerm,
  typeFilter,
  severityFilter,
])

    
  // =====================================================
  // RESET PAGE WHEN FILTER CHANGES

  useEffect(() => {

    setCurrentPage(1)

  }, [
    searchTerm,
    typeFilter,
    severityFilter,
  ])
  // =====================================================
  // PAGINATION

  const totalPages = Math.ceil(
    filteredDisasters.length / ITEMS_PER_PAGE
  )

  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE

  const endIndex =
    startIndex + ITEMS_PER_PAGE

  const currentDisasters =
    filteredDisasters.slice(
      startIndex,
      endIndex
    )
  // =====================================================
  // SUMMARY COUNTS

  const criticalCount = disasters.filter(
    (disaster) =>
      Number(disaster.severity) >= 8
  ).length

  const highCount = disasters.filter(
    (disaster) =>
      Number(disaster.severity) >= 6 &&
      Number(disaster.severity) < 8
  ).length

  const mediumCount = disasters.filter(
    (disaster) =>
      Number(disaster.severity) >= 4 &&
      Number(disaster.severity) < 6
  ).length

  const lowCount = disasters.filter(
    (disaster) =>
      Number(disaster.severity) >= 1 &&
      Number(disaster.severity) < 4
  ).length
  // =====================================================
  // CLEAR FILTERS

  function clearFilters() {

    setSearchTerm("")
    setTypeFilter("All")
    setSeverityFilter("All")
    setCurrentPage(1)

  }
  // =====================================================
  // PAGINATION FUNCTIONS

  function goToPreviousPage() {

    setCurrentPage((page) =>
      Math.max(page - 1, 1)
    )

  }
  function goToNextPage() {

    setCurrentPage((page) =>
      Math.min(
        page + 1,
        Math.max(totalPages, 1)
      )
    )

  }
  // =====================================================
  // SEVERITY LABEL

  function getSeverityLabel(severity) {

    const value = Number(severity)

    if (value >= 8) return "Critical"
    if (value >= 6) return "High"
    if (value >= 4) return "Medium"
    if (value >= 1) return "Low"

    return "Not rated"
  }
  // =====================================================
  // SEVERITY STYLE

  function getSeverityStyle(severity) {

    const value = Number(severity)

    if (value >= 8) {

      return {
        badge:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
        dot: "bg-red-500",
      }

    }

    if (value >= 6) {

      return {
        badge:
          "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900",
        dot: "bg-orange-500",
      }

    }

    if (value >= 4) {

      return {
        badge:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
        dot: "bg-amber-500",
      }

    }

    if (value >= 1) {

      return {
        badge:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
        dot: "bg-emerald-500",
      }

    }

    return {
      badge:
        "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
      dot: "bg-slate-400",
    }

  }


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="
        min-h-[60vh]
        flex
        items-center
        justify-center
      ">

        <div className="text-center">

          <div className="
            w-10
            h-10
            border-4
            border-blue-100
            dark:border-slate-700
            border-t-blue-600
            dark:border-t-blue-400
            rounded-full
            animate-spin
            mx-auto
          " />

          <p className="
            text-sm
            text-slate-500
            dark:text-slate-400
            mt-4
          ">
            Loading disaster intelligence...
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

      <div className="
        max-w-2xl
        mx-auto
        mt-10
        bg-red-50
        dark:bg-red-950/30
        border
        border-red-200
        dark:border-red-900
        rounded-2xl
        p-8
        text-center
        shadow-sm
      ">

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-red-100
          dark:bg-red-950/50
          flex
          items-center
          justify-center
          mx-auto
        ">

          <TriangleAlert className="
            w-7
            h-7
            text-red-500
          " />

        </div>

        <h2 className="
          text-lg
          font-bold
          text-slate-900
          dark:text-white
          mt-4
        ">
          Unable to load disaster data
        </h2>

        <p className="
          text-sm
          text-slate-500
          dark:text-slate-400
          mt-2
        ">
          Please make sure the FastAPI backend is running.
        </p>

      </div>

    )

  }


  // =====================================================
  // MAIN UI
  // =====================================================

  return (

    <div className="
      space-y-5
      pb-8
    ">


      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="
        relative
        overflow-hidden
        rounded-2xl
        border
        border-blue-200
        dark:border-blue-800
        bg-blue-50
        dark:bg-blue-950
        px-6
        py-5
        shadow-sm
      ">

        <div className="
          absolute
          -right-10
          -top-12
          w-40
          h-40
          rounded-full
          bg-blue-500/10
          blur-2xl
        " />

        <div className="
          absolute
          right-20
          -bottom-16
          w-32
          h-32
          rounded-full
          bg-indigo-500/10
          blur-2xl
        " />

        <div className="
          relative
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-5
        ">

          <div className="
            flex
            items-center
            gap-4
          ">

            <div className="
              w-12
              h-12
              rounded-2xl
              bg-blue-600
              flex
              items-center
              justify-center
              shadow-lg
              shadow-blue-600/20
            ">

              <ShieldAlert className="
                w-6
                h-6
                text-white
              " />

            </div>

            <div>

              <div className="
                flex
                items-center
                gap-2
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-blue-600
                dark:text-blue-400
              ">

                <Radio className="w-3.5 h-3.5" />

                Incident Intelligence

              </div>

              <h1 className="
                text-2xl
                sm:text-3xl
                font-bold
                tracking-tight
                text-slate-900
                dark:text-white
                mt-1
              ">
                Disaster Monitoring
              </h1>

              <p className="
                text-sm
                text-slate-500
                dark:text-slate-400
                mt-1
              ">
                Monitor, filter and investigate active disaster events.
              </p>

            </div>

          </div>


          {/* Live status */}

          <div className="
            flex
            items-center
            gap-3
            self-start
            lg:self-center
          ">

            <div className="
              flex
              items-center
              gap-2
              px-3
              py-2
              rounded-xl
              bg-emerald-50
              dark:bg-emerald-950/30
              border
              border-emerald-200
              dark:border-emerald-900
            ">

              <span className="
                relative
                flex
                h-2.5
                w-2.5
              ">

                <span className="
                  animate-ping
                  absolute
                  inline-flex
                  h-full
                  w-full
                  rounded-full
                  bg-emerald-400
                  opacity-75
                " />

                <span className="
                  relative
                  inline-flex
                  rounded-full
                  h-2.5
                  w-2.5
                  bg-emerald-500
                " />

              </span>

              <span className="
                text-xs
                font-semibold
                text-emerald-700
                dark:text-emerald-300
              ">
                Live Monitoring
              </span>

            </div>

            <div className="
              hidden
              sm:flex
              items-center
              gap-1.5
              text-xs
              text-slate-500
              dark:text-slate-400
            ">

              <Clock3 className="w-3.5 h-3.5" />

              Updated recently

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="
        grid
        grid-cols-2
        lg:grid-cols-4
        gap-3
      ">


        {/* Total */}

        <div className="
          bg-white
          dark:bg-slate-900
          border
          border-slate-200
          dark:border-slate-800
          rounded-xl
          p-4
          shadow-sm
        ">

          <div className="
            flex
            items-center
            justify-between
          ">

            <div className="
              w-9
              h-9
              rounded-lg
              bg-blue-100
              dark:bg-blue-950/40
              flex
              items-center
              justify-center
            ">

              <Activity className="
                w-4
                h-4
                text-blue-600
                dark:text-blue-400
              " />

            </div>

            <ArrowUpRight className="
              w-4
              h-4
              text-slate-300
              dark:text-slate-600
            " />

          </div>

          <p className="
            text-2xl
            font-bold
            text-slate-900
            dark:text-white
            mt-3
          ">
            {disasters.length}
          </p>

          <p className="
            text-xs
            text-slate-500
            dark:text-slate-400
            mt-1
          ">
            Total Events
          </p>

        </div>


        {/* Critical */}

        <div className="
          bg-white
          dark:bg-slate-900
          border
          border-slate-200
          dark:border-slate-800
          rounded-xl
          p-4
          shadow-sm
        ">

          <div className="
            w-9
            h-9
            rounded-lg
            bg-red-50
            dark:bg-red-950/40
            flex
            items-center
            justify-center
          ">

            <TriangleAlert className="
              w-4
              h-4
              text-red-500
            " />

          </div>

          <p className="
            text-2xl
            font-bold
            text-red-600
            dark:text-red-400
            mt-3
          ">
            {criticalCount}
          </p>

          <p className="
            text-xs
            text-slate-500
            dark:text-slate-400
            mt-1
          ">
            Critical Events
          </p>

        </div>


        {/* High */}

        <div className="
          bg-white
          dark:bg-slate-900
          border
          border-slate-200
          dark:border-slate-800
          rounded-xl
          p-4
          shadow-sm
        ">

          <div className="
            w-9
            h-9
            rounded-lg
            bg-orange-50
            dark:bg-orange-950/40
            flex
            items-center
            justify-center
          ">

            <AlertCircle className="
              w-4
              h-4
              text-orange-500
            " />

          </div>

          <p className="
            text-2xl
            font-bold
            text-orange-600
            dark:text-orange-400
            mt-3
          ">
            {highCount}
          </p>

          <p className="
            text-xs
            text-slate-500
            dark:text-slate-400
            mt-1
          ">
            High Severity
          </p>

        </div>


        {/* Moderate / Low */}

        <div className="
          bg-white
          dark:bg-slate-900
          border
          border-slate-200
          dark:border-slate-800
          rounded-xl
          p-4
          shadow-sm
        ">

          <div className="
            w-9
            h-9
            rounded-lg
            bg-emerald-50
            dark:bg-emerald-950/40
            flex
            items-center
            justify-center
          ">

            <CheckCircle2 className="
              w-4
              h-4
              text-emerald-500
            " />

          </div>

          <p className="
            text-2xl
            font-bold
            text-emerald-600
            dark:text-emerald-400
            mt-3
          ">
            {mediumCount + lowCount}
          </p>

          <p className="
            text-xs
            text-slate-500
            dark:text-slate-400
            mt-1
          ">
            Moderate / Low
          </p>

        </div>

      </div>


      {/* =================================================
          SEARCH + FILTERS
      ================================================= */}

      <div className="
        bg-blue-50
        dark:bg-blue-950
        rounded-2xl
        border
        border-blue-200
        dark:border-blue-800
        shadow-sm
        p-4
      ">

        <div className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          gap-3
        ">

          {/* Search */}

          <div className="
            relative
            flex-1
          ">

            <Search className="
              absolute
              left-3.5
              top-1/2
              -translate-y-1/2
              w-4
              h-4
              text-slate-400
            " />

            <input
              type="text"
              placeholder="Search disaster, country or location..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="
                w-full
                border
                border-indigo-200
                dark:border-indigo-800
                rounded-xl
                pl-10
                pr-4
                py-2.5
                text-sm
                bg-indigo-100
                dark:bg-indigo-900
                text-indigo-950
                dark:text-indigo-50
                placeholder-black
                dark:placeholder-indigo-50
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500/20
                focus:border-blue-500
              "
            />

          </div>


          {/* Type */}

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value)
            }
            className="
              lg:w-52
              border
              border-slate-200
              dark:border-slate-700
              rounded-xl
              px-4
              py-2.5
              text-sm
              bg-slate-50
              dark:bg-slate-800
              text-slate-900
              dark:text-white
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500/20
              focus:border-blue-500
            "
          >

            {disasterTypes.map((type) => (

              <option
                key={type}
                value={type}
              >
                {type === "All"
                  ? "All Disaster Types"
                  : type}
              </option>

            ))}

          </select>


          {/* Severity */}

          <select
            value={severityFilter}
            onChange={(e) =>
              setSeverityFilter(e.target.value)
            }
            className="
              lg:w-48
              border
              border-slate-200
              dark:border-slate-700
              rounded-xl
              px-4
              py-2.5
              text-sm
              bg-slate-50
              dark:bg-slate-800
              text-slate-900
              dark:text-white
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500/20
              focus:border-blue-500
            "
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


          {/* Filter icon */}

          <div className="
            hidden
            lg:flex
            w-10
            h-10
            rounded-xl
            bg-slate-100
            dark:bg-slate-800
            items-center
            justify-center
          ">

            <Filter className="
              w-4
              h-4
              text-slate-500
              dark:text-slate-400
            " />

          </div>

        </div>


        {/* Active filters */}

        {(searchTerm ||
          typeFilter !== "All" ||
          severityFilter !== "All") && (

          <div className="
            flex
            items-center
            justify-between
            mt-3
            pt-3
            border-t
            border-slate-100
            dark:border-slate-800
          ">

            <p className="
              text-xs
              text-slate-500
              dark:text-slate-400
            ">

              {filteredDisasters.length} matching events

            </p>

            <button
              onClick={clearFilters}
              className="
                flex
                items-center
                gap-1.5
                text-xs
                font-semibold
                text-blue-600
                dark:text-blue-400
                hover:text-blue-700
              "
            >

              <X className="w-3.5 h-3.5" />

              Clear filters

            </button>

          </div>

        )}

      </div>


      {/*  DISASTER TABLE*/}

      <div className="
        bg-blue-50
        dark:bg-blue-950
        rounded-2xl
        border
        border-blue-200
        dark:border-blue-800
        shadow-sm
        overflow-hidden
      ">


        {/* Table heading */}

        <div className="
          px-5
          py-4
          border-b
          border-slate-200
          dark:border-slate-800
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-2
        ">

          <div>

            <div className="
              flex
              items-center
              gap-2
            ">

              <div className="
                w-8
                h-8
                rounded-lg
                bg-blue-100
                dark:bg-blue-950/60
                flex
                items-center
                justify-center
              ">

                <Activity className="
                  w-4
                  h-4
                  text-blue-600
                  dark:text-blue-400
                " />

              </div>

              <h2 className="
                text-base
                font-bold
                text-slate-900
                dark:text-white
              ">
                Incident Registry
              </h2>

            </div>

            <p className="
              text-xs
              text-slate-500
              dark:text-slate-400
              mt-1
            ">

              {filteredDisasters.length > 0
                ? `Showing ${startIndex + 1}–${Math.min(
                    endIndex,
                    filteredDisasters.length
                  )} of ${filteredDisasters.length} events`
                : "No events found"}

            </p>

          </div>


          <div className="
            flex
            items-center
            gap-2
            text-xs
            font-medium
            text-slate-500
            dark:text-slate-400
          ">

            <span className="
              w-2
              h-2
              rounded-full
              bg-emerald-500
            " />

            Monitoring active

          </div>

        </div>


        {/* Table */}

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="
              bg-indigo-100
              dark:bg-indigo-900/70
            ">

              <tr>

                <th className="
                  text-left
                  px-5
                  py-3
                  text-[11px]
                  font-bold
                  text-slate-500
                  dark:text-slate-400
                  uppercase
                  tracking-wider
                ">
                  Incident
                </th>

                <th className="
                  text-left
                  px-5
                  py-3
                  text-[11px]
                  font-bold
                  text-slate-500
                  dark:text-slate-400
                  uppercase
                  tracking-wider
                ">
                  Country
                </th>

                <th className="
                  text-left
                  px-5
                  py-3
                  text-[11px]
                  font-bold
                  text-slate-500
                  dark:text-slate-400
                  uppercase
                  tracking-wider
                ">
                  Location
                </th>

                <th className="
                  text-left
                  px-5
                  py-3
                  text-[11px]
                  font-bold
                  text-slate-500
                  dark:text-slate-400
                  uppercase
                  tracking-wider
                ">
                  Severity
                </th>

                <th className="
                  text-right
                  px-5
                  py-3
                  text-[11px]
                  font-bold
                  text-slate-500
                  dark:text-slate-400
                  uppercase
                  tracking-wider
                ">
                  Action
                </th>

              </tr>

            </thead>


            <tbody className="
              divide-y
              divide-slate-100
              dark:divide-slate-800
            ">

              {currentDisasters.length > 0 ? (

                currentDisasters.map((disaster) => {

                  const severityStyle =
                    getSeverityStyle(
                      disaster.severity
                    )

                  return (

                    <tr
                      key={disaster.id}
                      className="
                        group
                        hover:bg-indigo-100/70
                        dark:hover:bg-indigo-900/60
                        transition-colors
                      "
                    >

                      {/* Incident */}

                      <td className="px-5 py-4">

                        <div className="
                          flex
                          items-center
                          gap-3
                        ">

                          <div className="
                            w-9
                            h-9
                            rounded-xl
                            bg-slate-100
                            dark:bg-slate-800
                            flex
                            items-center
                            justify-center
                            shrink-0
                          ">

                            <TriangleAlert className="
                              w-4
                              h-4
                              text-blue-600
                              dark:text-blue-400
                            " />

                          </div>

                          <div>

                            <p className="
                              text-sm
                              font-semibold
                              text-slate-900
                              dark:text-white
                            ">
                              {disaster.type || "Unknown"}
                            </p>

                            <p className="
                              text-[11px]
                              text-slate-400
                              mt-0.5
                            ">
                              ID #{disaster.id}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* Country */}

                      <td className="
                        px-5
                        py-4
                        text-sm
                        text-slate-600
                        dark:text-slate-300
                      ">

                        <div className="
                          flex
                          items-center
                          gap-2
                        ">

                          <Globe className="
                            w-3.5
                            h-3.5
                            text-slate-400
                          " />

                          {disaster.country || "—"}

                        </div>

                      </td>


                      {/* Location */}

                      <td className="
                        px-5
                        py-4
                        text-sm
                        text-slate-600
                        dark:text-slate-300
                      ">

                        <div className="
                          flex
                          items-center
                          gap-2
                        ">

                          <MapPin className="
                            w-3.5
                            h-3.5
                            text-slate-400
                          " />

                          {disaster.location || "—"}

                        </div>

                      </td>


                      {/* Severity */}

                      <td className="px-5 py-4">

                        <span className={`
                          inline-flex
                          items-center
                          gap-2
                          px-2.5
                          py-1.5
                          rounded-lg
                          border
                          text-xs
                          font-semibold
                          ${severityStyle.badge}
                        `}>

                          <span className={`
                            w-1.5
                            h-1.5
                            rounded-full
                            ${severityStyle.dot}
                          `} />

                          {getSeverityLabel(
                            disaster.severity
                          )}

                        </span>

                      </td>


                      {/* Action */}

                      <td className="
                        px-5
                        py-4
                        text-right
                      ">
{Number(disaster.severity) > 0 ? (

  <button
    onClick={() => {
      console.log("Selected disaster:", disaster)
      setSelectedDisaster(disaster)
    }}
    className="
      inline-flex
      items-center
      gap-1.5
      px-3
      py-1.5
      rounded-lg
      text-xs
      font-semibold
      text-blue-600
      dark:text-blue-400
      bg-blue-50
      dark:bg-blue-950/30
      hover:bg-blue-100
      dark:hover:bg-blue-950/60
      transition-colors
    "
  >

    <Eye className="w-3.5 h-3.5" />

    Inspect

  </button>

) : (

  <span
    className="
      inline-flex
      items-center
      gap-1.5
      px-3
      py-1.5
      rounded-lg
      text-xs
      font-semibold
      text-slate-400
      dark:text-slate-500
      bg-slate-100
      dark:bg-slate-800
      border
      border-slate-200
      dark:border-slate-700
      cursor-not-allowed
    "
  >

    Inspect

  </span>

)}
                        

                      </td>

                    </tr>

                  )

                })

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="
                      text-center
                      py-14
                    "
                  >

                    <div className="
                      w-12
                      h-12
                      rounded-2xl
                      bg-slate-100
                      dark:bg-slate-800
                      flex
                      items-center
                      justify-center
                      mx-auto
                    ">

                      <TriangleAlert className="
                        w-6
                        h-6
                        text-slate-400
                      " />

                    </div>

                    <p className="
                      text-sm
                      font-semibold
                      text-slate-700
                      dark:text-slate-200
                      mt-4
                    ">
                      No matching incidents
                    </p>

                    <p className="
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                      mt-1
                    ">
                      Try adjusting your search or filters.
                    </p>

                    <button
                      onClick={clearFilters}
                      className="
                        text-xs
                        text-blue-600
                        dark:text-blue-400
                        font-semibold
                        mt-3
                        hover:underline
                      "
                    >
                      Reset filters
                    </button>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* PAGINATION*/}

        {filteredDisasters.length > ITEMS_PER_PAGE && (

          <div className="
            flex
            flex-col
            sm:flex-row
            items-center
            justify-between
            gap-3
            px-5
            py-4
            border-t
            border-slate-200
            dark:border-slate-800
            bg-indigo-50/60
            dark:bg-indigo-950/30
          ">

            {/* Result count */}

            <p className="
              text-xs
              text-slate-500
              dark:text-slate-400
            ">

              Page {currentPage} of {totalPages}

            </p>


            {/* Pagination buttons */}

            <div className="
              flex
              items-center
              gap-2
            ">

              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  px-3
                  py-2
                  rounded-lg
                  border
                  border-slate-200
                  dark:border-slate-700
                  bg-white
                  dark:bg-slate-800
                  text-xs
                  font-semibold
                  text-slate-700
                  dark:text-slate-200
                  hover:bg-slate-50
                  dark:hover:bg-slate-700
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  transition
                "
              >

                <ChevronLeft className="
                  w-4
                  h-4
                " />

                Previous

              </button>


              {/* Page number */}

              <div className="
                min-w-9
                h-9
                px-3
                rounded-lg
                bg-blue-600
                text-white
                flex
                items-center
                justify-center
                text-xs
                font-bold
              ">

                {currentPage}

              </div>


              <button
                onClick={goToNextPage}
                disabled={
                  currentPage === totalPages
                }
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  px-3
                  py-2
                  rounded-lg
                  border
                  border-slate-200
                  dark:border-slate-700
                  bg-white
                  dark:bg-slate-800
                  text-xs
                  font-semibold
                  text-slate-700
                  dark:text-slate-200
                  hover:bg-slate-50
                  dark:hover:bg-slate-700
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  transition
                "
              >

                Next

                <ChevronRight className="
                  w-4
                  h-4
                " />

              </button>

            </div>

          </div>

        )}

      </div>
      {/* DISASTER DETAILS MODAL*/}

      {selectedDisaster && (

        <div className="
          fixed
          inset-0
          z-50
          flex
          items-center
          justify-center
          bg-slate-950/50
          backdrop-blur-sm
          p-4
        ">

          <div className="
            bg-blue-50
            dark:bg-blue-950
            w-full
            max-w-xl
            rounded-2xl
            shadow-2xl
            border
            border-blue-200
            dark:border-blue-800
            max-h-[90vh]
            overflow-y-auto
          ">


            {/* Modal Header */}

            <div className="
              sticky
              top-0
              z-10
              bg-blue-50
              dark:bg-blue-950
              flex
              items-center
              justify-between
              px-6
              py-4
              border-b
              border-blue-200
              dark:border-blue-800
            ">

              <div className="
                flex
                items-center
                gap-3
              ">

                <div className="
                  w-10
                  h-10
                  rounded-xl
                  bg-blue-100
                  dark:bg-blue-950/50
                  flex
                  items-center
                  justify-center
                ">

                  <ShieldAlert className="
                    w-5
                    h-5
                    text-blue-600
                    dark:text-blue-400
                  " />

                </div>

                <div>

                  <h2 className="
                    text-base
                    font-bold
                    text-slate-900
                    dark:text-white
                  ">
                    Incident Details
                  </h2>

                  <p className="
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                    mt-0.5
                  ">
                    Detailed disaster event information
                  </p>

                </div>

              </div>

              <button
                onClick={() =>
                  setSelectedDisaster(null)
                }
                className="
                  p-2
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                  dark:hover:bg-slate-800
                  hover:text-slate-700
                  dark:hover:text-white
                  transition-colors
                "
              >

                <X className="w-5 h-5" />

              </button>

            </div>


            {/* Modal Content */}

            <div className="
              p-6
              space-y-5
            ">


              {/* Main incident */}

              <div className="
                rounded-xl
                bg-slate-50
                dark:bg-slate-800
                border
                border-slate-200
                dark:border-slate-700
                p-4
              ">

                <div className="
                  flex
                  items-center
                  justify-between
                ">

                  <div>

                    <p className="
                      text-[11px]
                      uppercase
                      tracking-wider
                      font-bold
                      text-slate-400
                    ">
                      Disaster Type
                    </p>

                    <p className="
                      text-xl
                      font-bold
                      text-slate-900
                      dark:text-white
                      mt-1
                    ">
                      {selectedDisaster.type ||
                        "Unknown"}
                    </p>

                  </div>

                  <span className={`
                    inline-flex
                    items-center
                    gap-2
                    px-3
                    py-1.5
                    rounded-lg
                    border
                    text-xs
                    font-semibold
                    ${
                      getSeverityStyle(
                        selectedDisaster.severity
                      ).badge
                    }
                  `}>

                    <span className={`
                      w-1.5
                      h-1.5
                      rounded-full
                      ${
                        getSeverityStyle(
                          selectedDisaster.severity
                        ).dot
                      }
                    `} />

                    {getSeverityLabel(
                      selectedDisaster.severity
                    )}

                  </span>

                </div>

              </div>


              {/* Information grid */}

              <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-3
              ">

                {/* Country */}

                <div className="
                  rounded-xl
                  border
                  border-indigo-200
                  dark:border-indigo-800
                  bg-indigo-100/60
                  dark:bg-indigo-900/50
                  p-4
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <Globe className="
                      w-4
                      h-4
                      text-blue-500
                    " />

                    <p className="
                      text-[11px]
                      uppercase
                      tracking-wider
                      font-bold
                      text-slate-400
                    ">
                      Country
                    </p>

                  </div>

                  <p className="
                    text-sm
                    font-semibold
                    text-slate-800
                    dark:text-slate-200
                    mt-2
                  ">
                    {selectedDisaster.country ||
                      "—"}
                  </p>

                </div>


                {/* Location */}

                <div className="
                  rounded-xl
                  border
                  border-slate-200
                  dark:border-slate-700
                  p-4
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <MapPin className="
                      w-4
                      h-4
                      text-blue-500
                    " />

                    <p className="
                      text-[11px]
                      uppercase
                      tracking-wider
                      font-bold
                      text-slate-400
                    ">
                      Location
                    </p>

                  </div>

                  <p className="
                    text-sm
                    font-semibold
                    text-slate-800
                    dark:text-slate-200
                    mt-2
                  ">
                    {selectedDisaster.location ||
                      "—"}
                  </p>

                </div>


                {/* Latitude */}

                <div className="
                  rounded-xl
                  border
                  border-slate-200
                  dark:border-slate-700
                  p-4
                ">

                  <p className="
                    text-[11px]
                    uppercase
                    tracking-wider
                    font-bold
                    text-slate-400
                  ">
                    Latitude
                  </p>

                  <p className="
                    text-sm
                    font-mono
                    font-semibold
                    text-slate-800
                    dark:text-slate-200
                    mt-2
                  ">
                    {selectedDisaster.latitude ??
                      "—"}
                  </p>

                </div>
                {/* Longitude */}

                <div className="
                  rounded-xl
                  border
                  border-slate-200
                  dark:border-slate-700
                  p-4
                ">

                  <p className="
                    text-[11px]
                    uppercase
                    tracking-wider
                    font-bold
                    text-slate-400
                  ">
                    Longitude
                  </p>

                  <p className="
                    text-sm
                    font-mono
                    font-semibold
                    text-slate-800
                    dark:text-slate-200
                    mt-2
                  ">
                    {selectedDisaster.longitude ??
                      "—"}
                  </p>

                </div>

              </div>


              {/* Alert level + ID */}

              <div className="
                flex
                flex-col
                sm:flex-row
                gap-3
              ">

                <div className="
                  flex-1
                  rounded-xl
                  bg-slate-50
                  dark:bg-slate-800
                  p-4
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <Activity className="
                      w-4
                      h-4
                      text-orange-500
                    " />

                    <p className="
                      text-[11px]
                      uppercase
                      tracking-wider
                      font-bold
                      text-slate-400
                    ">
                      Alert Level
                    </p>

                  </div>

                  <p className="
                    text-sm
                    font-semibold
                    text-slate-800
                    dark:text-slate-200
                    mt-2
                  ">
                    {selectedDisaster.alert_level ||
                      "—"}
                  </p>

                </div>


                <div className="
                  flex-1
                  rounded-xl
                  bg-slate-50
                  dark:bg-slate-800
                  p-4
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <Hash className="
                      w-4
                      h-4
                      text-slate-500
                    " />

                    <p className="
                      text-[11px]
                      uppercase
                      tracking-wider
                      font-bold
                      text-slate-400
                    ">
                      Disaster ID
                    </p>

                  </div>

                  <p className="
                    text-sm
                    font-mono
                    font-semibold
                    text-slate-800
                    dark:text-slate-200
                    mt-2
                  ">
                    #{selectedDisaster.id}
                  </p>

                </div>

              </div>


              {/* Action buttons */}

              <div className="
                pt-2
                space-y-2
              ">

                <button
                  onClick={handleViewImpact}
                  disabled={impactLoading}
                  className="
                    w-full
                    flex
                    items-center
                    justify-center
                    gap-2
                    bg-blue-600
                    text-white
                    py-3
                    rounded-xl
                    font-semibold
                    text-sm
                    hover:bg-blue-700
                    transition-colors
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    shadow-sm
                    shadow-blue-600/20
                  "
                >

                  <MapPin className="
                    w-4
                    h-4
                  " />

                  {impactLoading
                    ? "Loading impact..."
                    : "View Impact Area"}

                </button>


                <button
                  onClick={() =>
                    setSelectedDisaster(null)
                  }
                  className="
                    w-full
                    py-3
                    rounded-xl
                    font-semibold
                    text-sm
                    text-slate-600
                    dark:text-slate-300
                    bg-slate-100
                    dark:bg-slate-800
                    hover:bg-slate-200
                    dark:hover:bg-slate-700
                    transition-colors
                  "
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  )

}

export default Disasters