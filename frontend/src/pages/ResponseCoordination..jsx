import { useEffect, useMemo, useState } from "react"

import {
  Search,
  ShieldCheck,
  MapPin,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  X,
  Radio,
  Siren,
  Route,
  ChevronRight,
  Activity,
  RefreshCw,
} from "lucide-react"

import { optimizeRoutes } from "../services/routeOptimizationService"

import {
  getMissions,
  generateMissions,
  updateMissionStatus,
} from "../services/missionservice"
import RouteMap from "../components/RouteMap/RouteMap"

const MISSIONS_PER_PAGE = 2


function ResponseCoordination() {

  // =========================================================
  // STATE
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedOperation, setSelectedOperation] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [operations, setOperations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingMission, setUpdatingMission] = useState(null)
  const [optimizingRoutes, setOptimizingRoutes] = useState(false)


  // =========================================================
  // ROUTE OPTIMIZATION DATA
  // =========================================================

  const [routeData, setRouteData] = useState(null)

  // =========================================================
  // PAGINATION
  // =========================================================

  const [columnPages, setColumnPages] = useState({
    critical: 0,
    active: 0,
    standby: 0,
  })


  // =========================================================
  // TRANSFORM BACKEND MISSION DATA
  // =========================================================

  function transformMission(
    mission,
    currentRouteData = routeData
  ) {

    const priorityValue = Number(
      mission.priority || 0
    )

    let priority = "Low"

    if (priorityValue >= 80) {

      priority = "Critical"

    } else if (priorityValue >= 60) {

      priority = "High"

    } else if (priorityValue >= 40) {

      priority = "Medium"

    }


    // =======================================================
    // ROUTE INFORMATION
    // =======================================================

    let routeStatus =
      mission.route_status ||
      mission.routeStatus ||
      null

    let routeAvailable =
      mission.route_available ??
      mission.routeAvailable ??
      null

    let routeReason =
      mission.route_reason ||
      mission.routeReason ||
      ""


    // =======================================================
    // FIND ROUTE DETAIL
    // =======================================================

    if (
      currentRouteData &&
      Array.isArray(
        currentRouteData.route_details
      )
    ) {

      const matchingRoute =
        currentRouteData.route_details.find(
          (route) =>
            Number(route.zone_id) ===
              Number(mission.zone_id) &&
            Number(route.vehicle_id) ===
              Number(mission.vehicle_id)
        )


      if (matchingRoute) {

        routeStatus =
          matchingRoute.route_status ||
          routeStatus

        routeAvailable =
          matchingRoute.route_available ??
          routeAvailable

        routeReason =
          matchingRoute.route_reason ||
          routeReason

      }

    }


    // =======================================================
    // FIND ROUTE INSIDE OPTIMIZED VEHICLE ROUTES
    // =======================================================

    if (
      !routeStatus &&
      currentRouteData &&
      Array.isArray(
        currentRouteData.routes
      )
    ) {

      for (
        const vehicleRoute
        of currentRouteData.routes
      ) {

        if (
          Number(
            vehicleRoute.vehicle_id
          ) !==
          Number(mission.vehicle_id)
        ) {

          continue

        }


        if (
          Array.isArray(
            vehicleRoute.zones
          )
        ) {

          const matchingZone =
            vehicleRoute.zones.find(
              (zone) =>
                Number(zone.zone_id) ===
                Number(mission.zone_id)
            )


          if (matchingZone) {

            routeStatus =
              matchingZone.route_status ||
              routeStatus

            routeAvailable =
              matchingZone.route_available ??
              routeAvailable

            routeReason =
              matchingZone.route_reason ||
              routeReason

            break

          }

        }

      }

    }


    // =======================================================
    // FIND ROUTE INSIDE ZONE STATUS
    // =======================================================

    if (
      !routeStatus &&
      currentRouteData &&
      Array.isArray(
        currentRouteData.zone_status
      )
    ) {

      const matchingZoneStatus =
        currentRouteData.zone_status.find(
          (zone) =>
            Number(zone.zone_id) ===
            Number(mission.zone_id)
        )


      if (matchingZoneStatus) {

        routeStatus =
          matchingZoneStatus.route_status ||
          routeStatus

        routeAvailable =
          matchingZoneStatus.route_available ??
          routeAvailable

        routeReason =
          matchingZoneStatus.route_reason ||
          routeReason

      }

    }


    // =======================================================
    // FINAL ROUTE STATUS
    // =======================================================

    if (!routeStatus) {

      routeStatus = "Unknown"

    }


    if (routeAvailable === null) {

      routeAvailable =
        routeStatus === "Available"

    }


    return {

      // =====================================================
      // DISPLAY ID
      // =====================================================

      id:
        `MIS-${String(
          mission.id
        ).padStart(3, "0")}`,

      // =====================================================
      // ACTUAL DATABASE ID
      // =====================================================

      originalId:
        mission.id,

      // =====================================================
      // MISSION INFORMATION
      // =====================================================

      mission:
        `${mission.resource_type || "Relief"} Delivery`,

      location:
        mission.zone_name ||
        "Unknown Zone",

      // =====================================================
      // VEHICLE INFORMATION
      // =====================================================

      team:
        mission.vehicle_name ||
        "Unassigned Vehicle",

      members:
        "—",

      vehicle:
        mission.vehicle_name ||
        "—",

      // =====================================================
      // STATUS
      // =====================================================

      status:
        mission.status ||
        "Pending",

      priority,

      started:
        mission.status === "Pending"
          ? "Not started"
          : "Active",

      // =====================================================
      // DATABASE INFORMATION
      // =====================================================

      zoneId:
        mission.zone_id,

      vehicleId:
        mission.vehicle_id,

      quantity:
        mission.quantity,

      resourceType:
        mission.resource_type,

      distanceKm:
        mission.distance_km,

      travelTime:
        mission.travel_time_minutes,

      // =====================================================
      // ROUTE INFORMATION
      // =====================================================

      routeStatus,

      routeAvailable,

      routeReason,
    }
  }


  // =========================================================
  // LOAD MISSIONS
  // =========================================================

  useEffect(() => {

    loadMissions()

  }, [])


  async function loadMissions(
    latestRouteData = routeData
  ) {

    try {

      setLoading(true)
      setError("")

      const data =
        await getMissions()

      setOperations(
        (data.missions || []).map(
          (mission) =>
            transformMission(
              mission,
              latestRouteData
            )
        )
      )

    } catch (err) {

      console.error(err)

      setError(
        err.message ||
        "Unable to load missions. Please make sure the backend is running."
      )

    } finally {

      setLoading(false)

    }
  }


  // =========================================================
  // OPTIMIZE ROUTES + GENERATE MISSIONS
  // =========================================================

  async function handleGenerateMissions() {

  try {

    setGenerating(true)
    setOptimizingRoutes(true)
    setError("")

    // ================================================
    // STEP 1: OPTIMIZE ROUTES
    // ================================================

    const routeResult =
      await optimizeRoutes()

    console.log(
      "Optimized route result:",
      routeResult
    )

    setRouteData(routeResult)

    // ================================================
    // STEP 2: GENERATE MISSIONS
    // ================================================

    setOptimizingRoutes(false)

    await generateMissions()

    // ================================================
    // STEP 3: LOAD MISSIONS
    // ================================================

    await loadMissions(routeResult)

  } catch (err) {

    console.error(
      "Route optimization failed:",
      err
    )

    setError(
      err?.message ||
      "Failed to optimize routes and generate missions."
    )

  } finally {

    setGenerating(false)
    setOptimizingRoutes(false)

  }
}


  // =========================================================
  // UPDATE MISSION STATUS
  // =========================================================

  async function handleStatusChange(
    missionId,
    newStatus
  ) {

    try {

      setUpdatingMission(missionId)
      setError("")

      await updateMissionStatus(
        missionId,
        newStatus
      )

      await loadMissions()

      // Refresh selected mission if modal is open
      if (
        selectedOperation &&
        selectedOperation.originalId === missionId
      ) {

        const refreshedData =
          await getMissions()

        const refreshedMission =
          (refreshedData.missions || [])
            .find(
              (mission) =>
                mission.id === missionId
            )

        if (refreshedMission) {

          setSelectedOperation(
            transformMission(
              refreshedMission
            )
          )

        }

      }

    } catch (err) {

      console.error(err)

      setError(
        err.message ||
        "Failed to update mission status."
      )

    } finally {

      setUpdatingMission(null)

    }
  }


  // =========================================================
  // FILTERING
  // =========================================================

  const filteredOperations = useMemo(() => {

    const search =
      searchTerm.toLowerCase().trim()

    return operations.filter(
      (operation) => {

        const matchesSearch =
          operation.mission
            .toLowerCase()
            .includes(search) ||

          operation.location
            .toLowerCase()
            .includes(search) ||

          operation.team
            .toLowerCase()
            .includes(search) ||

          operation.id
            .toLowerCase()
            .includes(search)

        const matchesStatus =
          statusFilter === "All" ||
          operation.status === statusFilter

        return (
          matchesSearch &&
          matchesStatus
        )
      }
    )

  }, [
    operations,
    searchTerm,
    statusFilter,
  ])


  // =========================================================
  // RESET PAGINATION WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {

    setColumnPages({
      critical: 0,
      active: 0,
      standby: 0,
    })

  }, [
    searchTerm,
    statusFilter,
  ])


  // =========================================================
  // STATISTICS
  // =========================================================

  const activeOperations =
    operations.filter(
      (operation) =>
        operation.status === "Assigned" ||
        operation.status === "In Progress"
    ).length


  const criticalOperations =
    operations.filter(
      (operation) =>
        operation.priority === "Critical" &&
        operation.status !== "Completed" &&
        operation.status !== "Cancelled"
    ).length


  const totalQuantity =
    operations.reduce(
      (total, operation) =>
        total +
        Number(operation.quantity || 0),
      0
    )


  const pendingOperations =
    operations.filter(
      (operation) =>
        operation.status === "Pending"
    ).length


  // =========================================================
  // BOARD GROUPS
  // =========================================================

  const criticalMissions =
    filteredOperations.filter(
      (operation) =>
        operation.priority === "Critical" &&
        operation.status === "Pending"
    )


  const activeMissions =
    filteredOperations.filter(
      (operation) =>
        operation.status === "Assigned" ||
        operation.status === "In Progress"
    )


  const standbyMissions =
    filteredOperations.filter(
      (operation) =>
        (
          operation.status === "Pending" &&
          operation.priority !== "Critical"
        ) ||
        operation.status === "Completed" ||
        operation.status === "Cancelled"
    )


  // =========================================================
  // STATUS STYLE
  // =========================================================

  function getStatusStyle(status) {

    if (status === "Pending") {

      return `
        bg-yellow-100
        text-yellow-700
        dark:bg-yellow-950/50
        dark:text-yellow-400
      `
    }

    if (status === "Assigned") {

      return `
        bg-blue-100
        text-blue-700
        dark:bg-blue-950/50
        dark:text-blue-400
      `
    }

    if (status === "In Progress") {

      return `
        bg-green-100
        text-green-700
        dark:bg-green-950/50
        dark:text-green-400
      `
    }

    if (status === "Completed") {

      return `
        bg-slate-100
        text-slate-600
        dark:bg-slate-800
        dark:text-slate-300
      `
    }

    if (status === "Cancelled") {

      return `
        bg-red-100
        text-red-700
        dark:bg-red-950/50
        dark:text-red-400
      `
    }

    return `
      bg-slate-100
      text-slate-600
      dark:bg-slate-800
      dark:text-slate-300
    `
  }


  // =========================================================
  // PRIORITY STYLE
  // =========================================================

  function getPriorityStyle(priority) {

    if (priority === "Critical") {

      return "text-red-600 dark:text-red-400"

    }

    if (priority === "High") {

      return "text-orange-600 dark:text-orange-400"

    }

    if (priority === "Medium") {

      return "text-yellow-600 dark:text-yellow-400"

    }

    return "text-slate-500 dark:text-slate-400"
  }


  // =========================================================
  // ROAD STATUS STYLE
  // =========================================================

  function getRoadStatusStyle(status) {

    if (status === "Available") {

      return `
        bg-green-100
        text-green-700
        dark:bg-green-950/40
        dark:text-green-400
      `

    }

    if (status === "Blocked") {

      return `
        bg-red-100
        text-red-700
        dark:bg-red-950/40
        dark:text-red-400
      `

    }

    return `
      bg-slate-100
      text-slate-500
      dark:bg-slate-800
      dark:text-slate-400
    `
  }


  // =========================================================
  // ROAD STYLE
  // =========================================================

  function getRoadStyle(distance) {

    if (
      distance === null ||
      distance === undefined
    ) {

      return "text-slate-400"

    }

    if (Number(distance) > 50) {

      return "text-orange-600 dark:text-orange-400"

    }

    return "text-green-600 dark:text-green-400"
  }


  // =========================================================
  // ROUTE DISPLAY
  // =========================================================

  function getRouteText(operation) {

    if (
      operation.distanceKm !== null &&
      operation.distanceKm !== undefined
    ) {

      return `${Number(
        operation.distanceKm
      ).toFixed(1)} km`

    }

    return "Route unavailable"
  }


  // =========================================================
  // CHANGE COLUMN PAGE
  // =========================================================

  function changeColumnPage(
    column,
    direction,
    totalMissions
  ) {

    const totalPages =
      Math.ceil(
        totalMissions /
        MISSIONS_PER_PAGE
      )

    setColumnPages((prev) => {

      const currentPage =
        prev[column]

      const nextPage =
        currentPage + direction

      if (
        nextPage < 0 ||
        nextPage >= totalPages
      ) {

        return prev

      }

      return {
        ...prev,
        [column]: nextPage,
      }

    })
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="
        w-full
        min-h-[400px]
        flex
        items-center
        justify-center
        text-slate-500
        dark:text-slate-400
      ">

        <Activity className="
          w-5
          h-5
          animate-spin
          mr-2
        " />

        Loading missions...

      </div>

    )
  }


  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <div className="
      w-full
      space-y-5
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

        <div>

          <div className="
            flex
            items-center
            gap-2
            text-sm
            font-medium
            text-blue-600
            dark:text-blue-400
          ">

            <Radio className="w-4 h-4" />

            Emergency Coordination

          </div>


          <h1 className="
            text-2xl
            lg:text-3xl
            font-bold
            text-slate-900
            dark:text-white
            mt-1
          ">

            Mission Control

          </h1>


          <p className="
            text-sm
            text-slate-500
            dark:text-slate-400
            mt-1
          ">

            Monitor field missions, vehicles and response status.

          </p>

        </div>


        <div className="
          flex
          items-center
          gap-3
          flex-wrap
        ">

          {/* =================================================
              OPTIMIZE + GENERATE
          ================================================= */}

          <button
            onClick={handleGenerateMissions}
            disabled={generating}
            className="
              flex
              items-center
              gap-2
              px-4
              py-2.5
              rounded-lg
              bg-blue-600
              hover:bg-blue-700
              disabled:opacity-50
              disabled:cursor-not-allowed
              text-white
              text-sm
              font-semibold
              shadow-sm
              transition
            "
          >

            <RefreshCw className={`
              w-4
              h-4
              ${generating ? "animate-spin" : ""}
            `} />

            {optimizingRoutes
              ? "Optimizing Routes..."
              : generating
                ? "Generating..."
                : "Optimize & Generate Missions"}

          </button>


          {/* =================================================
              LIVE OPERATIONS
          ================================================= */}

          <div className="
            flex
            items-center
            gap-2
            px-4
            py-2.5
            rounded-lg
            border
            border-blue-200
            dark:border-blue-800
            bg-blue-50
            dark:bg-blue-950
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
                bg-green-400
                opacity-75
              " />

              <span className="
                relative
                inline-flex
                rounded-full
                h-2.5
                w-2.5
                bg-green-500
              " />

            </span>


            <span className="
              text-sm
              font-medium
            ">

              Live Operations

            </span>

          </div>


          {/* =================================================
              MISSION COUNT
          ================================================= */}

          <div className="
            px-4
            py-2.5
            rounded-lg
            bg-blue-600
            text-white
            text-sm
            font-semibold
            shadow-sm
          ">

            {operations.length} Missions

          </div>

        </div>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="
          flex
          items-center
          justify-between
          gap-3
          rounded-lg
          border
          border-red-200
          dark:border-red-900
          bg-red-50
          dark:bg-red-950/40
          px-4
          py-3
          text-sm
          text-red-700
          dark:text-red-400
        ">

          <div className="
            flex
            items-center
            gap-2
          ">

            <AlertTriangle className="
              w-4
              h-4
            " />

            {error}

          </div>


          <button
            onClick={() => setError("")}
            className="
              p-1
              rounded
              hover:bg-red-100
              dark:hover:bg-red-900/40
            "
          >

            <X className="
              w-4
              h-4
            " />

          </button>

        </div>

      )}


      {/* =====================================================
          OPERATION OVERVIEW
      ===================================================== */}

      <div className="
        grid
        grid-cols-2
        lg:grid-cols-4
        gap-3
      ">

        <OverviewItem
          icon={
            <Siren className="w-4 h-4" />
          }
          label="Active"
          value={activeOperations}
          text="text-green-600 dark:text-green-400"
        />


        <OverviewItem
          icon={
            <AlertTriangle className="w-4 h-4" />
          }
          label="Critical"
          value={criticalOperations}
          text="text-red-600 dark:text-red-400"
        />


        <OverviewItem
          icon={
            <Truck className="w-4 h-4" />
          }
          label="Resources"
          value={Number(
            totalQuantity.toFixed(0)
          )}
          text="text-blue-600 dark:text-blue-400"
        />


        <OverviewItem
          icon={
            <Clock className="w-4 h-4" />
          }
          label="Pending"
          value={pendingOperations}
          text="text-orange-600 dark:text-orange-400"
        />

      </div>


      {/* =====================================================
          CONTROL BAR
      ===================================================== */}

      <div className="
        flex
        flex-col
        md:flex-row
        gap-3
        p-4
        rounded-xl
        bg-blue-50
        dark:bg-blue-950
        border
        border-blue-200
        dark:border-blue-800
      ">

        {/* SEARCH */}

        <div className="
          relative
          flex-1
        ">

          <Search className="
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            w-4
            h-4
            text-slate-400
          " />


          <input
            type="text"
            placeholder="Search mission, vehicle or zone..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            className="
              w-full
              bg-blue-50
              dark:bg-blue-950
              border
              border-blue-200
              dark:border-blue-800
              rounded-lg
              pl-10
              pr-4
              py-2.5
              text-sm
              text-slate-900
              dark:text-slate-100
              placeholder-slate-400
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
            "
          />

        </div>


        {/* STATUS FILTER */}

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          className="
            md:w-52
            bg-blue-50
            dark:bg-blue-950
            border
            border-blue-200
            dark:border-blue-800
            rounded-lg
            px-4
            py-2.5
            text-sm
            text-slate-900
            dark:text-slate-100
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-blue-500
          "
        >

          <option value="All">
            All Operations
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Assigned">
            Assigned
          </option>

          <option value="In Progress">
            In Progress
          </option>

          <option value="Completed">
            Completed
          </option>

          <option value="Cancelled">
            Cancelled
          </option>

        </select>

      </div>


      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {operations.length === 0 && (

        <div className="
          flex
          flex-col
          items-center
          justify-center
          py-16
          rounded-xl
          border
          border-blue-200
          dark:border-slate-700
          bg-blue-50
          dark:bg-slate-900
          text-center
        ">

          <Route className="
            w-10
            h-10
            text-slate-300
            dark:text-slate-700
          " />


          <h2 className="
            mt-3
            text-lg
            font-semibold
          ">

            No missions available

          </h2>


          <p className="
            text-sm
            text-slate-500
            dark:text-slate-400
            mt-1
          ">

            Optimize routes and generate missions for response operations.

          </p>


          <button
            onClick={handleGenerateMissions}
            disabled={generating}
            className="
              mt-4
              px-4
              py-2
              rounded-lg
              bg-blue-600
              hover:bg-blue-700
              disabled:opacity-50
              text-white
              text-sm
              font-semibold
            "
          >

            {optimizingRoutes
              ? "Optimizing Routes..."
              : generating
                ? "Generating..."
                : "Optimize & Generate Missions"}

          </button>

        </div>

      )}
{/* =====================================================
    OPTIMIZED ROUTE MAP
===================================================== */}

{routeData && (

  <div className="mb-6">

    <div className="mb-4">

      <h2 className="
        text-xl
        font-bold
        text-slate-900
        dark:text-white
      ">
        Optimized Response Routes
      </h2>

      <p className="
        text-sm
        text-slate-500
        dark:text-slate-400
        mt-1
      ">
        Vehicle routes optimized using road accessibility,
        priority and travel distance.
      </p>

    </div>

    <RouteMap
      routeData={routeData}
    />

  </div>

)}

      {/* =====================================================
          MISSION CONTROL BOARD
      ===================================================== */}

      {operations.length > 0 && (

        <div className="
          grid
          grid-cols-1
          lg:grid-cols-3
          gap-4
        ">

          {/* =================================================
              CRITICAL
          ================================================= */}

          <MissionColumn
            title="Critical Response"
            subtitle="Immediate attention"
            count={criticalMissions.length}
            icon={
              <Siren className="w-4 h-4" />
            }
            accent="red"
            operations={criticalMissions}
            onSelect={
              setSelectedOperation
            }
            getStatusStyle={
              getStatusStyle
            }
            getPriorityStyle={
              getPriorityStyle
            }
            getRoadStyle={
              getRoadStyle
            }
            getRoadStatusStyle={
              getRoadStatusStyle
            }
            getRouteText={
              getRouteText
            }
            onStatusChange={
              handleStatusChange
            }
            updatingMission={
              updatingMission
            }
            page={
              columnPages.critical
            }
            columnKey="critical"
            onPageChange={
              changeColumnPage
            }
          />


          {/* =================================================
              ACTIVE
          ================================================= */}

          <MissionColumn
            title="Active Missions"
            subtitle="Teams currently deployed"
            count={activeMissions.length}
            icon={
              <Activity className="w-4 h-4" />
            }
            accent="green"
            operations={activeMissions}
            onSelect={
              setSelectedOperation
            }
            getStatusStyle={
              getStatusStyle
            }
            getPriorityStyle={
              getPriorityStyle
            }
            getRoadStyle={
              getRoadStyle
            }
            getRoadStatusStyle={
              getRoadStatusStyle
            }
            getRouteText={
              getRouteText
            }
            onStatusChange={
              handleStatusChange
            }
            updatingMission={
              updatingMission
            }
            page={
              columnPages.active
            }
            columnKey="active"
            onPageChange={
              changeColumnPage
            }
          />


          {/* =================================================
              STANDBY
          ================================================= */}

          <MissionColumn
            title="Standby / Completed"
            subtitle="Pending or finished missions"
            count={standbyMissions.length}
            icon={
              <CheckCircle2 className="w-4 h-4" />
            }
            accent="gray"
            operations={standbyMissions}
            onSelect={
              setSelectedOperation
            }
            getStatusStyle={
              getStatusStyle
            }
            getPriorityStyle={
              getPriorityStyle
            }
            getRoadStyle={
              getRoadStyle
            }
            getRoadStatusStyle={
              getRoadStatusStyle
            }
            getRouteText={
              getRouteText
            }
            onStatusChange={
              handleStatusChange
            }
            updatingMission={
              updatingMission
            }
            page={
              columnPages.standby
            }
            columnKey="standby"
            onPageChange={
              changeColumnPage
            }
          />

        </div>

      )}


      {/* =====================================================
          NO SEARCH RESULTS
      ===================================================== */}

      {operations.length > 0 &&
        filteredOperations.length === 0 && (

          <div className="
            text-center
            py-10
            text-sm
            text-slate-500
            dark:text-slate-400
          ">

            No missions match your search or filter.

          </div>

        )}


      {/* =====================================================
          MISSION DETAILS MODAL
      ===================================================== */}

      {selectedOperation && (

        <div className="
          fixed
          inset-0
          z-50
          bg-slate-950/50
          backdrop-blur-[1px]
          flex
          items-center
          justify-center
          p-4
        ">

          <div className="
            bg-blue-50
            dark:bg-slate-900
            w-full
            max-w-lg
            rounded-xl
            shadow-2xl
            border
            border-blue-200
            dark:border-slate-700
            overflow-hidden
          ">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="
              flex
              items-center
              justify-between
              px-6
              py-4
              border-b
              border-blue-200
              dark:border-slate-700
            ">

              <div>

                <p className="
                  text-xs
                  text-blue-600
                  dark:text-blue-400
                  font-semibold
                ">

                  {selectedOperation.id}

                </p>


                <h2 className="
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-white
                  mt-1
                ">

                  {selectedOperation.mission}

                </h2>

              </div>


              <button
                onClick={() =>
                  setSelectedOperation(null)
                }
                className="
                  p-2
                  rounded-lg
                  hover:bg-blue-100
                  dark:hover:bg-slate-800
                  transition
                "
              >

                <X className="w-5 h-5" />

              </button>

            </div>


            {/* =================================================
                MODAL BODY
            ================================================= */}

            <div className="
              p-6
              space-y-5
            ">

              {/* VEHICLE */}

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
                  dark:bg-blue-950
                  flex
                  items-center
                  justify-center
                ">

                  <ShieldCheck className="
                    w-5
                    h-5
                    text-blue-600
                    dark:text-blue-400
                  " />

                </div>


                <div>

                  <p className="
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  ">

                    Assigned Vehicle

                  </p>


                  <p className="
                    font-semibold
                    text-slate-900
                    dark:text-white
                  ">

                    {selectedOperation.vehicle}

                  </p>

                </div>

              </div>


              {/* DETAILS GRID */}

              <div className="
                grid
                grid-cols-2
                gap-4
              ">

                <DetailItem
                  icon={<MapPin />}
                  label="Zone"
                  value={
                    selectedOperation.location
                  }
                />


                <DetailItem
                  icon={<Truck />}
                  label="Vehicle"
                  value={
                    selectedOperation.vehicle
                  }
                />


                <DetailItem
                  icon={<Route />}
                  label="Distance"
                  value={
                    selectedOperation.distanceKm !== null &&
                    selectedOperation.distanceKm !== undefined
                      ? `${Number(
                          selectedOperation.distanceKm
                        ).toFixed(1)} km`
                      : "—"
                  }
                />


                <DetailItem
                  icon={<Clock />}
                  label="Travel Time"
                  value={
                    selectedOperation.travelTime !== null &&
                    selectedOperation.travelTime !== undefined
                      ? `${Number(
                          selectedOperation.travelTime
                        ).toFixed(1)} min`
                      : "Not available"
                  }
                />


                <DetailItem
                  icon={<Activity />}
                  label="Resource"
                  value={
                    selectedOperation.resourceType ||
                    "—"
                  }
                />


                <DetailItem
                  icon={<Truck />}
                  label="Quantity"
                  value={
                    selectedOperation.quantity !== null &&
                    selectedOperation.quantity !== undefined
                      ? Number(
                          selectedOperation.quantity
                        ).toFixed(2)
                      : "—"
                  }
                />

              </div>


              {/* =================================================
                  ROAD STATUS
              ================================================= */}

              <div className="
                border
                border-blue-200
                dark:border-slate-700
                rounded-lg
                p-4
                bg-blue-50
                dark:bg-slate-950
              ">

                <div className="
                  flex
                  items-center
                  justify-between
                  gap-3
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <Navigation className="
                      w-4
                      h-4
                      text-slate-400
                    " />

                    <span className="
                      text-sm
                      font-medium
                    ">

                      Road Status

                    </span>

                  </div>


                  <span className={`
                    inline-flex
                    px-2.5
                    py-1
                    rounded-full
                    text-xs
                    font-semibold
                    ${getRoadStatusStyle(
                      selectedOperation.routeStatus
                    )}
                  `}>

                    {selectedOperation.routeStatus}

                  </span>

                </div>


                {selectedOperation.routeReason && (

                  <p className="
                    mt-2
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  ">

                    {selectedOperation.routeReason}

                  </p>

                )}

              </div>


              {/* =================================================
                  ROUTE
              ================================================= */}

              <div className="
                border
                border-blue-200
                dark:border-slate-700
                rounded-lg
                p-4
                bg-blue-50
                dark:bg-slate-900
              ">

                <div className="
                  flex
                  items-center
                  justify-between
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <Navigation className="
                      w-4
                      h-4
                      text-slate-400
                    " />


                    <span className="
                      text-sm
                      font-medium
                    ">

                      Optimized Route

                    </span>

                  </div>


                  <span className={`
                    text-sm
                    font-semibold
                    ${getRoadStyle(
                      selectedOperation.distanceKm
                    )}
                  `}>

                    {getRouteText(
                      selectedOperation
                    )}

                  </span>

                </div>

              </div>


              {/* =================================================
                  STATUS
              ================================================= */}

              <div className="
                flex
                gap-2
                flex-wrap
              ">

                <span className={`
                  px-3
                  py-1
                  rounded-full
                  text-xs
                  font-semibold
                  ${getStatusStyle(
                    selectedOperation.status
                  )}
                `}>

                  {selectedOperation.status}

                </span>


                <span className={`
                  px-3
                  py-1
                  rounded-full
                  text-xs
                  font-semibold
                  bg-slate-100
                  dark:bg-slate-800
                  ${getPriorityStyle(
                    selectedOperation.priority
                  )}
                `}>

                  {selectedOperation.priority}

                </span>

              </div>


              {/* =================================================
                  STATUS ACTIONS
              ================================================= */}

              <MissionStatusActions
                operation={
                  selectedOperation
                }
                onStatusChange={
                  handleStatusChange
                }
                updatingMission={
                  updatingMission
                }
              />

            </div>


            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="
              px-6
              py-4
              bg-blue-100
              dark:bg-slate-800
              border-t
              border-blue-200
              dark:border-slate-700
            ">

              <button
                onClick={() =>
                  setSelectedOperation(null)
                }
                className="
                  w-full
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  py-2.5
                  rounded-lg
                  font-medium
                  transition
                "
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


/* =========================================================
   MISSION COLUMN
========================================================= */

function MissionColumn({
  title,
  subtitle,
  count,
  icon,
  accent,
  operations,
  onSelect,
  getStatusStyle,
  getPriorityStyle,
  getRoadStyle,
  getRoadStatusStyle,
  getRouteText,
  onStatusChange,
  updatingMission,
  page,
  columnKey,
  onPageChange,
}) {

  const accentStyles = {

    red: {
      border:
        "border-red-200 dark:border-red-900",

      header:
        "bg-red-50 dark:bg-red-950/40",

      icon:
        "text-red-600 dark:text-red-400",
    },


    green: {
      border:
        "border-green-200 dark:border-green-900",

      header:
        "bg-green-50 dark:bg-green-950/40",

      icon:
        "text-green-600 dark:text-green-400",
    },


    gray: {
      border:
        "border-slate-200 dark:border-slate-700",

      header:
        "bg-slate-50 dark:bg-slate-800",

      icon:
        "text-slate-600 dark:text-slate-400",
    },

  }


  const style =
    accentStyles[accent]


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        operations.length /
        MISSIONS_PER_PAGE
      )
    )


  const start =
    page * MISSIONS_PER_PAGE


  const visibleOperations =
    operations.slice(
      start,
      start + MISSIONS_PER_PAGE
    )


  return (

    <div className={`
      border
      rounded-xl
      overflow-hidden
      bg-blue-50
      dark:bg-slate-900
      ${style.border}
    `}>

      {/* COLUMN HEADER */}

      <div className={`
        px-4
        py-3
        ${style.header}
      `}>

        <div className="
          flex
          items-center
          justify-between
        ">

          <div className="
            flex
            items-center
            gap-2
          ">

            <span className={
              style.icon
            }>

              {icon}

            </span>


            <div>

              <h2 className="
                text-sm
                font-bold
                text-slate-900
                dark:text-white
              ">

                {title}

              </h2>


              <p className="
                text-xs
                text-slate-500
                dark:text-slate-400
              ">

                {subtitle}

              </p>

            </div>

          </div>


          <span className="
            text-xs
            font-bold
            bg-blue-100
            dark:bg-slate-800
            px-2
            py-1
            rounded-md
          ">

            {count}

          </span>

        </div>

      </div>


      {/* MISSION ITEMS */}

      <div className="
        p-3
        space-y-3
        bg-blue-50
        dark:bg-slate-950
        min-h-[390px]
      ">

        {visibleOperations.length > 0 ? (

          visibleOperations.map(
            (operation) => (

              <MissionItem
                key={operation.originalId}
                operation={operation}
                onSelect={onSelect}
                getStatusStyle={
                  getStatusStyle
                }
                getPriorityStyle={
                  getPriorityStyle
                }
                getRoadStyle={
                  getRoadStyle
                }
                getRoadStatusStyle={
                  getRoadStatusStyle
                }
                getRouteText={
                  getRouteText
                }
                onStatusChange={
                  onStatusChange
                }
                updatingMission={
                  updatingMission
                }
              />

            )
          )

        ) : (

          <div className="
            flex
            flex-col
            items-center
            justify-center
            h-40
            text-center
          ">

            <CheckCircle2 className="
              w-7
              h-7
              text-slate-300
              dark:text-slate-700
            " />


            <p className="
              text-sm
              text-slate-400
              mt-2
            ">

              No missions here

            </p>

          </div>

        )}

      </div>


      {/* PAGINATION */}

      {operations.length > MISSIONS_PER_PAGE && (

        <div className="
          flex
          items-center
          justify-between
          px-3
          py-2.5
          border-t
          border-blue-200
          dark:border-slate-700
          bg-blue-50
          dark:bg-slate-900
        ">

          <button
            onClick={() =>
              onPageChange(
                columnKey,
                -1,
                operations.length
              )
            }
            disabled={page === 0}
            className="
              px-3
              py-1.5
              rounded-md
              text-xs
              font-medium
              border
              border-blue-200
              dark:border-slate-700
              disabled:opacity-30
              disabled:cursor-not-allowed
              hover:bg-blue-100
              dark:hover:bg-slate-800
              transition
            "
          >

            ← Previous

          </button>


          <span className="
            text-xs
            font-medium
            text-slate-500
            dark:text-slate-400
          ">

            {page + 1} / {totalPages}

          </span>


          <button
            onClick={() =>
              onPageChange(
                columnKey,
                1,
                operations.length
              )
            }
            disabled={
              page >= totalPages - 1
            }
            className="
              px-3
              py-1.5
              rounded-md
              text-xs
              font-medium
              border
              border-blue-200
              dark:border-slate-700
              disabled:opacity-30
              disabled:cursor-not-allowed
              hover:bg-blue-100
              dark:hover:bg-slate-800
              transition
            "
          >

            Next →

          </button>

        </div>

      )}

    </div>
  )
}


/* =========================================================
   MISSION ITEM
========================================================= */

function MissionItem({
  operation,
  onSelect,
  getStatusStyle,
  getPriorityStyle,
  getRoadStyle,
  getRoadStatusStyle,
  getRouteText,
  onStatusChange,
  updatingMission,
}) {

  return (

    <div className="
      border
      border-blue-200
      dark:border-slate-700
      rounded-lg
      p-3
      bg-blue-50
      dark:bg-slate-900
      hover:shadow-md
      transition-shadow
    ">

      {/* TOP */}

      <div className="
        flex
        items-start
        justify-between
        gap-2
      ">

        <div className="min-w-0">

          <p className="
            text-sm
            font-bold
            truncate
            text-slate-900
            dark:text-white
          ">

            {operation.mission}

          </p>


          <p className="
            text-[11px]
            text-slate-400
            mt-0.5
          ">

            {operation.id}

          </p>

        </div>


        <span className={`
          px-2
          py-1
          rounded-full
          text-[10px]
          font-semibold
          whitespace-nowrap
          ${getStatusStyle(
            operation.status
          )}
        `}>

          {operation.status}

        </span>

      </div>


      {/* LOCATION */}

      <div className="
        flex
        items-center
        gap-2
        mt-2
      ">

        <MapPin className="
          w-3.5
          h-3.5
          text-slate-400
          shrink-0
        " />


        <span className="
          text-xs
          text-slate-600
          dark:text-slate-300
          truncate
        ">

          {operation.location}

        </span>

      </div>


      {/* VEHICLE / PRIORITY */}

      <div className="
        flex
        items-center
        justify-between
        gap-2
        mt-2
      ">

        <div className="
          flex
          items-center
          gap-2
          min-w-0
        ">

          <Truck className="
            w-3.5
            h-3.5
            text-slate-400
            shrink-0
          " />


          <span className="
            text-xs
            text-slate-600
            dark:text-slate-300
            truncate
          ">

            {operation.vehicle}

          </span>

        </div>


        <span className={`
          text-xs
          font-semibold
          whitespace-nowrap
          ${getPriorityStyle(
            operation.priority
          )}
        `}>

          {operation.priority}

        </span>

      </div>


      {/* ROUTE */}

      <div className="
        flex
        items-center
        justify-between
        mt-2
        pt-2
        border-t
        border-blue-100
        dark:border-slate-700
      ">

        <div className="
          flex
          items-center
          gap-2
        ">

          <Navigation className="
            w-3.5
            h-3.5
            text-slate-400
          " />


          <span className="
            text-xs
            text-slate-500
            dark:text-slate-400
          ">

            Route

          </span>

        </div>


        <span className={`
          text-xs
          font-medium
          ${getRoadStyle(
            operation.distanceKm
          )}
        `}>

          {getRouteText(
            operation
          )}

        </span>

      </div>


      {/* =====================================================
          ROAD STATUS
      ===================================================== */}

      <div className="
        flex
        items-center
        justify-between
        mt-2
      ">

        <div className="
          flex
          items-center
          gap-2
        ">

          <Route className="
            w-3.5
            h-3.5
            text-slate-400
          " />


          <span className="
            text-xs
            text-slate-500
            dark:text-slate-400
          ">

            Road Status

          </span>

        </div>


        <span className={`
          inline-flex
          px-2
          py-1
          rounded-full
          text-[10px]
          font-semibold
          ${getRoadStatusStyle(
            operation.routeStatus
          )}
        `}>

          {operation.routeStatus}

        </span>

      </div>


      {/* DETAILS */}

      <button
        onClick={() =>
          onSelect(operation)
        }
        className="
          w-full
          mt-2
          flex
          items-center
          justify-between
          text-xs
          font-semibold
          text-blue-600
          dark:text-blue-400
          hover:text-blue-800
          dark:hover:text-blue-300
        "
      >

        View mission details

        <ChevronRight className="
          w-4
          h-4
        " />

      </button>


      {/* STATUS ACTION */}

      <MissionStatusActions
        operation={operation}
        onStatusChange={
          onStatusChange
        }
        updatingMission={
          updatingMission
        }
      />

    </div>
  )
}


/* =========================================================
   MISSION STATUS ACTIONS
========================================================= */

function MissionStatusActions({
  operation,
  onStatusChange,
  updatingMission,
}) {

  const isUpdating =
    updatingMission ===
    operation.originalId


  // =======================================================
  // PENDING -> ASSIGNED
  // =======================================================

  if (operation.status === "Pending") {

    return (

      <button
        onClick={() =>
          onStatusChange(
            operation.originalId,
            "Assigned"
          )
        }
        disabled={isUpdating}
        className="
          w-full
          mt-2
          bg-blue-600
          hover:bg-blue-700
          disabled:opacity-50
          disabled:cursor-not-allowed
          text-white
          py-1.5
          rounded-lg
          text-xs
          font-semibold
          transition
        "
      >

        {isUpdating
          ? "Assigning..."
          : "Assign Mission"}

      </button>

    )
  }


  // =======================================================
  // ASSIGNED -> IN PROGRESS
  // =======================================================

  if (operation.status === "Assigned") {

    return (

      <button
        onClick={() =>
          onStatusChange(
            operation.originalId,
            "In Progress"
          )
        }
        disabled={isUpdating}
        className="
          w-full
          mt-2
          bg-green-600
          hover:bg-green-700
          disabled:opacity-50
          disabled:cursor-not-allowed
          text-white
          py-1.5
          rounded-lg
          text-xs
          font-semibold
          transition
        "
      >

        {isUpdating
          ? "Starting..."
          : "Start Mission"}

      </button>

    )
  }


  // =======================================================
  // IN PROGRESS -> COMPLETED
  // =======================================================

  if (operation.status === "In Progress") {

    return (

      <button
        onClick={() =>
          onStatusChange(
            operation.originalId,
            "Completed"
          )
        }
        disabled={isUpdating}
        className="
          w-full
          mt-2
          bg-blue-600
          hover:bg-blue-700
          disabled:opacity-50
          disabled:cursor-not-allowed
          text-white
          py-1.5
          rounded-lg
          text-xs
          font-semibold
          transition
        "
      >

        {isUpdating
          ? "Completing..."
          : "Complete Mission"}

      </button>

    )
  }


  // =======================================================
  // COMPLETED
  // =======================================================

  if (operation.status === "Completed") {

    return (

      <div className="
        flex
        items-center
        justify-center
        gap-2
        mt-2
        py-1.5
        rounded-lg
        bg-green-50
        dark:bg-green-950/30
        text-green-600
        dark:text-green-400
        text-xs
        font-semibold
      ">

        <CheckCircle2 className="
          w-4
          h-4
        " />

        Mission Completed

      </div>
    )
  }


  // =======================================================
  // CANCELLED
  // =======================================================

  if (operation.status === "Cancelled") {

    return (

      <div className="
        flex
        items-center
        justify-center
        mt-2
        py-1.5
        rounded-lg
        bg-red-50
        dark:bg-red-950/30
        text-red-600
        dark:text-red-400
        text-xs
        font-semibold
      ">

        Mission Cancelled

      </div>
    )
  }


  return null
}


/* =========================================================
   OVERVIEW ITEM
========================================================= */

function OverviewItem({
  icon,
  label,
  value,
  text,
}) {

  return (

    <div className="
      bg-blue-50
      dark:bg-slate-900
      border
      border-blue-200
      dark:border-slate-700
      rounded-xl
      px-4
      py-3
    ">

      <div className="
        flex
        items-center
        gap-3
      ">

        <div className={text}>

          {icon}

        </div>


        <div>

          <p className="
            text-xs
            text-slate-500
            dark:text-slate-400
          ">

            {label}

          </p>


          <p className={`
            text-xl
            font-bold
            ${text}
          `}>

            {value}

          </p>

        </div>

      </div>

    </div>
  )
}


/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  icon,
  label,
  value,
}) {

  return (

    <div className="
      flex
      items-center
      gap-3
    ">

      <div className="
        text-slate-400
      ">

        {icon && (

          <span className="
            [&>svg]:w-4
            [&>svg]:h-4
          ">

            {icon}

          </span>

        )}

      </div>


      <div>

        <p className="
          text-xs
          text-slate-500
          dark:text-slate-400
        ">

          {label}

        </p>


        <p className="
          text-sm
          font-semibold
          text-slate-900
          dark:text-white
        ">

          {value}

        </p>

      </div>

    </div>
  )
}


export default ResponseCoordination