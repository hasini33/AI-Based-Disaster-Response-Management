import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import DisasterMap from "../Map/DisasterMap"
import ResourceChart from "../Charts/ResourceChart"

import {
  Activity,
  Users,
  Package,
  TriangleAlert,
  MapPin,
  ShieldAlert,
  Layers3,
  Info,
  Clock3,
  Radio,
  Truck,
  HeartPulse,
  Home,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react"

import { getDisasterImpact } from "../../services/disasterService"


function Dashboard() {

  const [searchParams] = useSearchParams()

  const [selectedDisaster, setSelectedDisaster] = useState(null)

  const selectedDisasterId = searchParams.get("disasterId")


  // =====================================================
  // LOAD SELECTED DISASTER
  // =====================================================

  useEffect(() => {

    if (!selectedDisasterId) {
      setSelectedDisaster(null)
      return
    }

    getDisasterImpact(Number(selectedDisasterId))
      .then((data) => {
        setSelectedDisaster(data)
      })
      .catch((error) => {
        console.error("Failed to load selected disaster:", error)
        setSelectedDisaster(null)
      })

  }, [selectedDisasterId])


  // =====================================================
  // STAT CARD DATA
  // =====================================================

  const stats = [
    {
      title: "Active Disasters",
      value: "12",
      description: "Currently active events",
      icon: Activity,
      iconBg: "bg-blue-50 dark:bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Affected Population",
      value: "24,580",
      description: "People in affected zones",
      icon: Users,
      iconBg: "bg-purple-50 dark:bg-purple-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Resources Available",
      value: "156",
      description: "Relief resources ready",
      icon: Package,
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "High Severity Zones",
      value: "5",
      description: "Require immediate attention",
      icon: TriangleAlert,
      iconBg: "bg-red-50 dark:bg-red-500/10",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ]


  return (

    <div className="space-y-5 pb-6">


      {/* =====================================================
          PAGE INTRO
      ===================================================== */}

      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">

        <div>

          {/* Small page identifier */}

          <div className="flex items-center gap-2 mb-2">

            <span className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-blue-600 dark:text-blue-400">

              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />

              Live Response

            </span>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

            <span className="text-xs text-slate-400">
              Operational Overview
            </span>

          </div>


          {/* Main page heading */}

          <h1 className="text-3xl  font-bold text-slate-900 dark:text-white">

            Situation Overview

          </h1>


          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">

            Monitor incidents, population impact, resources and response readiness.

          </p>

        </div>


        {/* System status */}

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 shadow-sm">

            <span className="relative flex h-2.5 w-2.5">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />

              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />

            </span>

            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              System Online
            </span>

          </div>


          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">

            <Clock3 className="w-3.5 h-3.5" />

            Updated recently

          </div>

        </div>

      </section>



      {/* =====================================================
          KEY METRICS
      ===================================================== */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {stats.map((stat) => {

          const Icon = stat.icon

          return (

            <div
              key={stat.title}
              className="group bg-blue-50 dark:bg-blue-950 rounded-2xl border border-blue-300 dark:border-blue-800 shadow-sm hover:shadow-md transition-all duration-200 p-5"            >

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>

                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {stat.value}
                  </p>

                </div>


                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}
                >

                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />

                </div>

              </div>


              <div className="flex items-center gap-1.5 mt-4">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.description}
                </p>

              </div>

            </div>

          )

        })}

      </section>



      {/* =====================================================
          LIVE RESPONSE AREA
      ===================================================== */}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">


        {/* ===================================================
            MAP
        =================================================== */}

<div className="xl:col-span-2 bg-blue-50 dark:bg-blue-950 rounded-2xl border border-blue-400 dark:border-blue-800 shadow-sm overflow-hidden">
          {/* Map header */}

          <div className="px-5 py-4 border-b border-blue-400 dark:border-blue-800">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">

                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                </div>

                <div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Disaster Impact Map
                  </h2>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live incident locations and affected areas
                  </p>

                </div>

              </div>


              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/60 border border-indigo-600 dark:border-indigo-800">

                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />

                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Live Layer
                </span>

              </div>

            </div>

          </div>


          {/* Map */}

          <div className="p-3">

            <div className="h-[430px] rounded-xl overflow-hidden border border-blue-500 dark:border-blue-800">

              <DisasterMap
                selectedDisasterId={
                  selectedDisasterId
                    ? Number(selectedDisasterId)
                    : null
                }
              />

            </div>

          </div>

        </div>



        {/* ===================================================
            SELECTED INCIDENT
        =================================================== */}

<div className="bg-blue-50 dark:bg-blue-950 rounded-2xl border border-blue-500 dark:border-blue-900 shadow-sm overflow-hidden">
          {/* Header */}

<div className="px-5 py-4 border-b border-blue-500 dark:border-blue-800">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">

                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />

              </div>

              <div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Selected Incident
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Detailed impact information
                </p>

              </div>

            </div>

          </div>



          {/* Incident selected */}

          {selectedDisaster ? (

            <div className="p-5 space-y-4">


              {/* Disaster type */}

<div className="p-4 rounded-xl bg-indigo-200 dark:bg-indigo-900/60 border border-indigo-500 dark:border-indigo-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Disaster Type
                </p>

                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedDisaster.disaster_type}
                </p>

              </div>


              {/* Coordinates */}

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">

                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />

                </div>

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Coordinates
                  </p>

                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">

                    {selectedDisaster.latitude},{" "}
                    {selectedDisaster.longitude}

                  </p>

                </div>

              </div>


              {/* Severity */}

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">

                  <Activity className="w-4 h-4 text-red-600 dark:text-red-400" />

                </div>

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Severity Level
                  </p>

                  <div className="flex items-center gap-2 mt-1">

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400">
                      Level {selectedDisaster.severity}
                    </span>

                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      High priority
                    </span>

                  </div>

                </div>

              </div>


              {/* Impact radius */}

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">

                  <Layers3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />

                </div>

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Impact Radius
                  </p>

                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">

                    {selectedDisaster.impact_extent?.radius_km ?? "—"} km

                  </p>

                </div>

              </div>


              {/* Zone */}

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">

                  <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />

                </div>

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Response Zone
                  </p>

                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">

                    {selectedDisaster.zone_name || "Not assigned"}

                  </p>

                </div>

              </div>


              {/* ID */}

              <div className="pt-4 border-t border-blue-200 dark:border-blue-800">

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Disaster ID
                </p>

                <p className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300 mt-1">

                  #{selectedDisaster.disaster_id}

                </p>

              </div>

            </div>

          ) : (

            /* Empty state */

            <div className="min-h-[430px] flex flex-col items-center justify-center text-center px-6">

              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">

                <Info className="w-6 h-6 text-slate-400 dark:text-slate-500" />

              </div>

              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-4">
                No incident selected
              </h3>

              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400 mt-2 max-w-xs">

                Select a disaster from the map or Disasters page to inspect its impact.

              </p>

            </div>

          )}

        </div>

      </section>



      {/* =====================================================
          OPERATIONAL READINESS
      ===================================================== */}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">


        {/* Resource readiness */}

        <div className="lg:col-span-2 bg-blue-50 dark:bg-blue-950 rounded-2xl border border-blue-500 dark:border-blue-800 shadow-sm overflow-hidden">

          <div className="px-5 py-4 border-b border-slate-400 dark:border-slate-700">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Operational Readiness
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Current capacity of critical response resources
                </p>

              </div>

              <Package className="w-5 h-5 text-slate-400" />

            </div>

          </div>


          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">


            {/* Food */}

            <ReadinessCard
              icon={Package}
              title="Food Supplies"
              percentage="82%"
              width="82%"
              color="bg-blue-600"
              description="Adequate for current demand"
            />


            {/* Water */}

            <ReadinessCard
              icon={Activity}
              title="Water Supply"
              percentage="68%"
              width="68%"
              color="bg-cyan-500"
              description="Monitor high-demand zones"
            />


            {/* Medical */}

            <ReadinessCard
              icon={HeartPulse}
              title="Medical Kits"
              percentage="54%"
              width="54%"
              color="bg-red-500"
              description="Replenishment recommended"
              warning
            />


            {/* Shelter */}

            <ReadinessCard
              icon={Home}
              title="Shelter Capacity"
              percentage="73%"
              width="73%"
              color="bg-purple-600"
              description="Capacity available"
            />

          </div>

        </div>



        {/* Response operations */}

<div className="bg-indigo-900 dark:bg-indigo-950 rounded-2xl border border-indigo-800 dark:border-indigo-800 shadow-sm p-5 text-indigo-50">
          <div className="flex items-center justify-between">

            <div>

              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                Response Operations
              </p>

              <h2 className="text-lg font-bold mt-1">
                Teams in Action
              </h2>

            </div>

            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">

              <Truck className="w-5 h-5 text-blue-400" />

            </div>

          </div>


          <div className="space-y-3 mt-5">


            <OperationRow
              icon={Truck}
              iconColor="text-blue-400"
              title="Supply Vehicles"
              description="Active transport"
              value="08"
            />


            <OperationRow
              icon={HeartPulse}
              iconColor="text-red-400"
              title="Medical Teams"
              description="Deployed"
              value="12"
            />


            <OperationRow
              icon={Users}
              iconColor="text-purple-400"
              title="Rescue Teams"
              description="On standby"
              value="06"
            />

          </div>


          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10">

            <ArrowUpRight className="w-4 h-4 text-emerald-400" />

            <span className="text-xs text-slate-400 leading-5">
              Response operations are monitored continuously.
            </span>

          </div>

        </div>

      </section>



      {/* =====================================================
          RESOURCE DEMAND
      ===================================================== */}

<section className="bg-blue-50 dark:bg-blue-950 rounded-2xl border border-blue-400 dark:border-blue-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-blue-500 dark:border-blue-800">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">

              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />

            </div>

            <div>

              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Resource Demand
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Current resource requirements across affected areas
              </p>

            </div>

          </div>

        </div>


        <div className="p-5">

          <ResourceChart />

        </div>

      </section>


    </div>
  )
}


/* =========================================================
   READINESS CARD
========================================================= */

function ReadinessCard({
  icon: Icon,
  title,
  percentage,
  width,
  color,
  description,
  warning = false,
}) {

  return (

<div className="p-4 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-500 dark:border-indigo-800">
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />

          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {title}
          </span>

        </div>

        <span className="text-sm font-black text-slate-900 dark:text-white">
          {percentage}
        </span>

      </div>


<div className="h-2 bg-indigo-200 dark:bg-indigo-800 rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width }}
        />

      </div>


      <p
        className={`text-xs mt-2 ${
          warning
            ? "text-red-600 dark:text-red-400 font-medium"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {description}
      </p>

    </div>

  )
}


/* =========================================================
   OPERATION ROW
========================================================= */

function OperationRow({
  icon: Icon,
  iconColor,
  title,
  description,
  value,
}) {

  return (

    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">

      <div className="flex items-center gap-3">

        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">

          <Icon className={`w-4 h-4 ${iconColor}`} />

        </div>

        <div>

          <p className="text-sm font-semibold">
            {title}
          </p>

          <p className="text-xs text-slate-400">
            {description}
          </p>

        </div>

      </div>

      <span className="text-sm font-black">
        {value}
      </span>

    </div>

  )
}


export default Dashboard