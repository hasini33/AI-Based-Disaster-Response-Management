import { useMemo, useState } from "react"

import {
  Search,
  ShieldCheck,
  Users,
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
} from "lucide-react"


function ResponseCoordination() {

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedOperation, setSelectedOperation] = useState(null)


  // =========================================================
  // OPERATIONS DATA
  // =========================================================

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


  // =========================================================
  // FILTERING
  // =========================================================

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


  // =========================================================
  // STATISTICS
  // =========================================================

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


  // =========================================================
  // BOARD GROUPS
  // =========================================================

  const criticalMissions = filteredOperations.filter(
    (operation) => operation.priority === "Critical"
  )

  const activeMissions = filteredOperations.filter(
    (operation) =>
      operation.priority !== "Critical" &&
      (
        operation.status === "Active" ||
        operation.status === "In Progress"
      )
  )

  const standbyMissions = filteredOperations.filter(
    (operation) =>
      operation.status === "Pending" ||
      operation.status === "Completed"
  )


  // =========================================================
  // STATUS STYLES
  // =========================================================

  function getStatusStyle(status) {

    if (status === "Active") {
      return `
        bg-green-100
        text-green-700
        dark:bg-green-950/50
        dark:text-green-400
      `
    }

    if (status === "In Progress") {
      return `
        bg-blue-100
        text-blue-700
        dark:bg-blue-950/50
        dark:text-blue-400
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

    return `
      bg-yellow-100
      text-yellow-700
      dark:bg-yellow-950/50
      dark:text-yellow-400
    `
  }


  function getPriorityStyle(priority) {

    if (priority === "Critical") {
      return "text-red-600 dark:text-red-400"
    }

    if (priority === "High") {
      return "text-orange-600 dark:text-orange-400"
    }

    return "text-slate-500 dark:text-slate-400"
  }


  function getRoadStyle(status) {

    if (status === "Blocked") {
      return "text-red-600 dark:text-red-400"
    }

    if (status === "Partially Blocked") {
      return "text-orange-600 dark:text-orange-400"
    }

    return "text-green-600 dark:text-green-400"
  }


  return (

    <div className="w-full space-y-5 text-slate-900 dark:text-slate-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">

            <Radio className="w-4 h-4" />

            Emergency Coordination

          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Mission Control
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor field teams, response missions and route conditions.
          </p>

        </div>


        <div className="flex items-center gap-3">

          {/* LIVE OPERATIONS */}

          <div
            className="
              flex items-center gap-2
              px-4 py-2.5
              rounded-lg
              border border-blue-200 dark:border-blue-800
              bg-blue-50 dark:bg-blue-950
            "
          >

            <span className="relative flex h-2.5 w-2.5">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />

              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />

            </span>

            <span className="text-sm font-medium">
              Live Operations
            </span>

          </div>


          {/* MISSION COUNT */}

          <div className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm">
            {operations.length} Missions
          </div>

        </div>

      </div>


      {/* =====================================================
          OPERATION OVERVIEW
      ===================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <OverviewItem
          icon={<Siren className="w-4 h-4" />}
          label="Active"
          value={activeOperations}
          text="text-green-600 dark:text-green-400"
        />

        <OverviewItem
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Critical"
          value={criticalOperations}
          text="text-red-600 dark:text-red-400"
        />

        <OverviewItem
          icon={<Users className="w-4 h-4" />}
          label="Personnel"
          value={totalPersonnel}
          text="text-blue-600 dark:text-blue-400"
        />

        <OverviewItem
          icon={<Route className="w-4 h-4" />}
          label="Route Warnings"
          value={blockedRoutes}
          text="text-orange-600 dark:text-orange-400"
        />

      </div>


      {/* =====================================================
          CONTROL BAR
      ===================================================== */}

      <div
        className="
          flex flex-col md:flex-row gap-3
          p-4
          rounded-xl
          bg-blue-50 dark:bg-blue-950
          border border-blue-200 dark:border-blue-800
        "
      >

        <div className="relative flex-1">

          <Search
            className="
              absolute left-3 top-1/2
              -translate-y-1/2
              w-4 h-4
              text-slate-400
            "
          />

          <input
            type="text"
            placeholder="Search mission, team or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full
              bg-blue-50 dark:bg-blue-950
              border border-blue-200 dark:border-blue-800
              rounded-lg
              pl-10 pr-4 py-2.5
              text-sm
              text-slate-900 dark:text-slate-100
              placeholder-slate-400
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
            "
          />

        </div>


        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="
            md:w-52
            bg-blue-50 dark:bg-blue-950
            border border-blue-200 dark:border-blue-800
            rounded-lg
            px-4 py-2.5
            text-sm
            text-slate-900 dark:text-slate-100
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-blue-500
          "
        >

          <option value="All">All Operations</option>
          <option value="Active">Active</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>

        </select>

      </div>


      {/* =====================================================
          MISSION CONTROL BOARD
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <MissionColumn
          title="Critical Response"
          subtitle="Immediate attention"
          count={criticalMissions.length}
          icon={<Siren className="w-4 h-4" />}
          accent="red"
          operations={criticalMissions}
          onSelect={setSelectedOperation}
          getStatusStyle={getStatusStyle}
          getPriorityStyle={getPriorityStyle}
          getRoadStyle={getRoadStyle}
        />


        <MissionColumn
          title="Active Missions"
          subtitle="Teams currently deployed"
          count={activeMissions.length}
          icon={<Activity className="w-4 h-4" />}
          accent="green"
          operations={activeMissions}
          onSelect={setSelectedOperation}
          getStatusStyle={getStatusStyle}
          getPriorityStyle={getPriorityStyle}
          getRoadStyle={getRoadStyle}
        />


        <MissionColumn
          title="Standby / Completed"
          subtitle="Pending or finished missions"
          count={standbyMissions.length}
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent="gray"
          operations={standbyMissions}
          onSelect={setSelectedOperation}
          getStatusStyle={getStatusStyle}
          getPriorityStyle={getPriorityStyle}
          getRoadStyle={getRoadStyle}
        />

      </div>


      {/* =====================================================
          MODAL
      ===================================================== */}

      {selectedOperation && (

        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">

          <div
            className="
              bg-blue-50 dark:bg-slate-900
              w-full max-w-lg
              rounded-xl
              shadow-2xl
              border border-blue-200 dark:border-slate-700
              overflow-hidden
            "
          >

            {/* HEADER */}

            <div
              className="
                flex items-center justify-between
                px-6 py-4
                border-b border-blue-200 dark:border-slate-700
              "
            >

              <div>

                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  {selectedOperation.id}
                </p>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {selectedOperation.mission}
                </h2>

              </div>

              <button
                onClick={() => setSelectedOperation(null)}
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


            {/* BODY */}

            <div className="p-6 space-y-5">

              <div className="flex items-center gap-3">

                <div
                  className="
                    w-10 h-10
                    rounded-lg
                    bg-blue-100 dark:bg-blue-950
                    flex items-center justify-center
                  "
                >

                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                </div>

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Response Team
                  </p>

                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedOperation.team}
                  </p>

                </div>

              </div>


              <div className="grid grid-cols-2 gap-4">

                <DetailItem
                  icon={<MapPin />}
                  label="Location"
                  value={selectedOperation.location}
                />

                <DetailItem
                  icon={<Users />}
                  label="Personnel"
                  value={selectedOperation.members}
                />

                <DetailItem
                  icon={<Truck />}
                  label="Vehicle"
                  value={selectedOperation.vehicle}
                />

                <DetailItem
                  icon={<Clock />}
                  label="Started"
                  value={selectedOperation.started}
                />

              </div>


              {/* ROUTE CONDITION */}

              <div
                className="
                  border border-blue-200 dark:border-slate-700
                  rounded-lg
                  p-4
                  bg-blue-50 dark:bg-slate-900
                "
              >

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <Navigation className="w-4 h-4 text-slate-400" />

                    <span className="text-sm font-medium">
                      Route Condition
                    </span>

                  </div>

                  <span
                    className={`text-sm font-semibold ${getRoadStyle(
                      selectedOperation.roadStatus
                    )}`}
                  >
                    {selectedOperation.roadStatus}
                  </span>

                </div>

              </div>


              <div className="flex gap-2">

                <span
                  className={`
                    px-3 py-1
                    rounded-full
                    text-xs
                    font-semibold
                    ${getStatusStyle(selectedOperation.status)}
                  `}
                >
                  {selectedOperation.status}
                </span>

                <span
                  className={`
                    px-3 py-1
                    rounded-full
                    text-xs
                    font-semibold
                    bg-slate-100 dark:bg-slate-800
                    ${getPriorityStyle(selectedOperation.priority)}
                  `}
                >
                  {selectedOperation.priority}
                </span>

              </div>

            </div>


            {/* FOOTER */}

            <div
              className="
                px-6 py-4
                bg-blue-100 dark:bg-slate-800
                border-t border-blue-200 dark:border-slate-700
              "
            >

              <button
                onClick={() => setSelectedOperation(null)}
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
}) {

  const accentStyles = {

    red: {
      border: "border-red-200 dark:border-red-900",
      header: "bg-red-50 dark:bg-red-950/40",
      icon: "text-red-600 dark:text-red-400",
    },

    green: {
      border: "border-green-200 dark:border-green-900",
      header: "bg-green-50 dark:bg-green-950/40",
      icon: "text-green-600 dark:text-green-400",
    },

    gray: {
      border: "border-slate-200 dark:border-slate-700",
      header: "bg-slate-50 dark:bg-slate-800",
      icon: "text-slate-600 dark:text-slate-400",
    },

  }

  const style = accentStyles[accent]


  return (

    <div
      className={`
        border
        rounded-xl
        overflow-hidden
        bg-blue-50 dark:bg-slate-900
        ${style.border}
      `}
    >

      {/* COLUMN HEADER */}

      <div className={`px-4 py-3 ${style.header}`}>

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <span className={style.icon}>
              {icon}
            </span>

            <div>

              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {title}
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>

            </div>

          </div>

          <span
            className="
              text-xs font-bold
              bg-blue-100 dark:bg-slate-800
              px-2 py-1
              rounded-md
            "
          >
            {count}
          </span>

        </div>

      </div>


      {/* MISSION ITEMS */}

      <div
        className="
          p-3
          space-y-3
          bg-blue-50 dark:bg-slate-950
          min-h-[420px]
        "
      >

        {operations.length > 0 ? (

          operations.map((operation) => (

            <MissionItem
              key={operation.id}
              operation={operation}
              onSelect={onSelect}
              getStatusStyle={getStatusStyle}
              getPriorityStyle={getPriorityStyle}
              getRoadStyle={getRoadStyle}
            />

          ))

        ) : (

          <div className="flex flex-col items-center justify-center h-40 text-center">

            <CheckCircle2 className="w-7 h-7 text-slate-300 dark:text-slate-700" />

            <p className="text-sm text-slate-400 mt-2">
              No missions here
            </p>

          </div>

        )}

      </div>

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
}) {

  return (

    <div
      className="
        border border-blue-200 dark:border-slate-700
        rounded-lg
        p-4
        hover:shadow-md
        transition-shadow
        bg-blue-50 dark:bg-slate-900
      "
    >

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {operation.mission}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            {operation.id}
          </p>

        </div>

        <span
          className={`
            px-2 py-1
            rounded-full
            text-[11px]
            font-semibold
            whitespace-nowrap
            ${getStatusStyle(operation.status)}
          `}
        >
          {operation.status}
        </span>

      </div>


      {/* LOCATION */}

      <div className="flex items-center gap-2 mt-4">

        <MapPin className="w-3.5 h-3.5 text-slate-400" />

        <span className="text-xs text-slate-600 dark:text-slate-300">
          {operation.location}
        </span>

      </div>


      {/* PERSONNEL / PRIORITY */}

      <div className="flex items-center justify-between mt-3">

        <div className="flex items-center gap-2">

          <Users className="w-3.5 h-3.5 text-slate-400" />

          <span className="text-xs text-slate-600 dark:text-slate-300">
            {operation.members} personnel
          </span>

        </div>

        <span
          className={`
            text-xs
            font-semibold
            ${getPriorityStyle(operation.priority)}
          `}
        >
          {operation.priority}
        </span>

      </div>


      {/* VEHICLE / ROAD */}

      <div
        className="
          flex items-center justify-between
          mt-3 pt-3
          border-t
          border-blue-100 dark:border-slate-700
        "
      >

        <div className="flex items-center gap-2">

          <Truck className="w-3.5 h-3.5 text-slate-400" />

          <span className="text-xs text-slate-500 dark:text-slate-400">
            {operation.vehicle}
          </span>

        </div>

        <span
          className={`
            text-xs
            font-medium
            ${getRoadStyle(operation.roadStatus)}
          `}
        >
          {operation.roadStatus}
        </span>

      </div>


      {/* DETAILS */}

      <button
        onClick={() => onSelect(operation)}
        className="
          w-full
          mt-3
          flex items-center justify-between
          text-xs
          font-semibold
          text-blue-600
          dark:text-blue-400
          hover:text-blue-800
          dark:hover:text-blue-300
        "
      >

        View mission details

        <ChevronRight className="w-4 h-4" />

      </button>

    </div>
  )
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

    <div
      className="
        bg-blue-50 dark:bg-slate-900
        border border-blue-200 dark:border-slate-700
        rounded-xl
        px-4 py-3
      "
    >

      <div className="flex items-center gap-3">

        <div className={text}>
          {icon}
        </div>

        <div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className={`text-xl font-bold ${text}`}>
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

    <div className="flex items-center gap-3">

      <div className="text-slate-400">

        {icon && (
          <span className="[&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </span>
        )}

      </div>

      <div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {label}
        </p>

        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {value}
        </p>

      </div>

    </div>
  )
}


export default ResponseCoordination