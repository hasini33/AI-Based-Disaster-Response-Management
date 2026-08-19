import StatCard from "../Cards/StatCard"
import ResourceChart from "../Charts/ResourceChart"
import DisasterMap from "../Map/DisasterMap"

import { useSearchParams } from "react-router-dom"

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
} from "lucide-react"

import { getDisasterImpact } from "../../services/disasterService"
import { useEffect, useState } from "react"


function Dashboard() {

  const [searchParams] = useSearchParams()
  const [selectedDisaster, setSelectedDisaster] = useState(null)

  const selectedDisasterId = searchParams.get("disasterId")


  // Load selected disaster

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


  return (

    <div className="space-y-6 pb-8">


      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">

              <Radio className="w-5 h-5 text-white" />

            </div>

            <div>

<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">                Disaster Response Command Center
              </h1>
<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Monitor incidents, affected populations, resources and relief operations.
              </p>

            </div>

          </div>

        </div>


        {/* Live status */}

        <div className="flex items-center gap-3">

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
     <span className="relative flex h-2.5 w-2.5">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>

              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>

            </span>

<span className="text-sm font-semibold text-slate-700 dark:text-slate-200">              Response System Online
            </span>

          </div>


<div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock3 className="w-4 h-4" />

            Updated recently

          </div>

        </div>

      </div>



      {/* ==================================================
          STATISTICS
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">


        <StatCard
          title="Active Disasters"
          value="12"
          icon={Activity}
          description="Currently active events"
        />


        <StatCard
          title="Affected Population"
          value="24,580"
          icon={Users}
          description="People in affected zones"
        />


        <StatCard
          title="Resources Available"
          value="156"
          icon={Package}
          description="Available relief resources"
        />


        <StatCard
          title="High Severity Zones"
          value="5"
          icon={TriangleAlert}
          description="Require immediate attention"
        />

      </div>



      {/* ==================================================
          MAIN RESPONSE AREA
      ================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">


        {/* ==================================================
            DISASTER MAP
        ================================================== */}

<div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">          {/* Map header */}

<div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div>

                <div className="flex items-center gap-2">

                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">

                    <MapPin className="w-5 h-5 text-blue-600" />

                  </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Disaster Impact Map
                  </h2>

                </div>

<p className="text-sm text-slate-500 dark:text-slate-400 mt-2">                  Monitor active incidents and affected geographical areas.
                </p>

              </div>


              {/* Map status */}

<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">                <span className="w-2 h-2 rounded-full bg-blue-500"></span>

<span className="text-xs font-medium text-slate-600 dark:text-slate-300">                  Live Incident Layer
                </span>

              </div>

            </div>

          </div>


          {/* Map */}

          <div className="p-4">

<div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
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



        {/* ==================================================
            SELECTED DISASTER
        ================================================== */}

<div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

          {/* Header */}

<div className="px-6 py-5 border-b border-slate-700">
            <div className="flex items-start gap-3">

              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">

                <ShieldAlert className="w-5 h-5 text-red-600" />

              </div>


              <div>

<h2 className="text-lg font-bold text-slate-900 dark:text-white">                  Selected Incident
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Detailed impact information
                </p>

              </div>

            </div>

          </div>



          {/* Selected disaster */}

          {selectedDisaster ? (

            <div className="p-6 space-y-5">


              {/* Disaster type */}

<div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Disaster Type
                </p>

                <p className="text-xl font-bold text-slate-900 mt-1">
                  {selectedDisaster.disaster_type}
                </p>

              </div>


              {/* Location */}

              <div className="flex items-start gap-3">

                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">

                  <MapPin className="w-4 h-4 text-blue-600" />

                </div>

                <div>

                  <p className="text-slate-500 dark:text-slate-400">
                    Coordinates
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-1">

                    {selectedDisaster.latitude},
                    {" "}
                    {selectedDisaster.longitude}

                  </p>

                </div>

              </div>



              {/* Severity */}

              <div className="flex items-start gap-3">

                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">

                  <Activity className="w-4 h-4 text-red-600" />

                </div>

                <div>

                  <p className="text-xs text-slate-500">
                    Severity Level
                  </p>

                  <div className="flex items-center gap-2 mt-1">

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">

                      Level {selectedDisaster.severity}

                    </span>

                    <span className="text-xs text-red-600 font-medium">
                      High priority
                    </span>

                  </div>

                </div>

              </div>



              {/* Impact radius */}

              <div className="flex items-start gap-3">

                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">

                  <Layers3 className="w-4 h-4 text-purple-600" />

                </div>

                <div>

                  <p className="text-xs text-slate-500">
                    Impact Radius
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-1">

                    {selectedDisaster.impact_extent?.radius_km ?? "—"} km

                  </p>

                </div>

              </div>



              {/* Zone */}

              <div className="flex items-start gap-3">

                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">

                  <MapPin className="w-4 h-4 text-amber-600" />

                </div>

                <div>

                  <p className="text-xs text-slate-500">
                    Response Zone
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-1">

                    {selectedDisaster.zone_name || "Not assigned"}

                  </p>

                </div>

              </div>



              {/* Disaster ID */}

              <div className="pt-4 border-t border-slate-100">

                <p className="text-xs text-slate-500">
                  Disaster ID
                </p>

                <p className="text-sm font-mono font-semibold text-slate-700 mt-1">

                  #{selectedDisaster.disaster_id}

                </p>

              </div>

            </div>

          ) : (

            /* ==================================================
               EMPTY STATE
            ================================================== */

            <div className="flex flex-col items-center justify-center text-center px-6 py-16">

              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">

                <Info className="w-7 h-7 text-slate-400" />

              </div>

              <h3 className="text-sm font-bold text-slate-800 mt-5">
                No incident selected
              </h3>

              <p className="text-sm text-slate-500 mt-2 max-w-xs leading-6">

                Select a disaster from the map or the Disasters page to inspect its impact.

              </p>

            </div>

          )}

        </div>

      </div>



      {/* ==================================================
          OPERATIONAL READINESS
      ================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* Resource readiness */}

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                Operational Readiness
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Current capacity of critical response resources.
              </p>

            </div>

            <Package className="w-5 h-5 text-slate-400" />

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">


            {/* Food */}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Package className="w-4 h-4 text-blue-600" />

                  <span className="text-sm font-semibold text-slate-700">
                    Food Supplies
                  </span>

                </div>

                <span className="text-sm font-bold text-slate-900">
                  82%
                </span>

              </div>

              <div className="h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">

                <div className="h-full w-[82%] bg-blue-600 rounded-full"></div>

              </div>

              <p className="text-xs text-slate-500 mt-2">
                Adequate for current demand
              </p>

            </div>



            {/* Water */}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Activity className="w-4 h-4 text-cyan-600" />

                  <span className="text-sm font-semibold text-slate-700">
                    Water Supply
                  </span>

                </div>

                <span className="text-sm font-bold text-slate-900">
                  68%
                </span>

              </div>

              <div className="h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">

                <div className="h-full w-[68%] bg-cyan-500 rounded-full"></div>

              </div>

              <p className="text-xs text-slate-500 mt-2">
                Monitor high-demand zones
              </p>

            </div>



            {/* Medical */}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <HeartPulse className="w-4 h-4 text-red-500" />

                  <span className="text-sm font-semibold text-slate-700">
                    Medical Kits
                  </span>

                </div>

                <span className="text-sm font-bold text-slate-900">
                  54%
                </span>

              </div>

              <div className="h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">

                <div className="h-full w-[54%] bg-red-500 rounded-full"></div>

              </div>

              <p className="text-xs text-red-600 mt-2 font-medium">
                Replenishment recommended
              </p>

            </div>



            {/* Shelter */}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Home className="w-4 h-4 text-purple-600" />

                  <span className="text-sm font-semibold text-slate-700">
                    Shelter Capacity
                  </span>

                </div>

                <span className="text-sm font-bold text-slate-900">
                  73%
                </span>

              </div>

              <div className="h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">

                <div className="h-full w-[73%] bg-purple-600 rounded-full"></div>

              </div>

              <p className="text-xs text-slate-500 mt-2">
                Capacity available
              </p>

            </div>

          </div>

        </div>



        {/* Response operations */}

        <div className="bg-slate-900 rounded-2xl shadow-sm p-6 text-white">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Response Operations
              </p>

              <h2 className="text-lg font-bold mt-1">
                Teams in Action
              </h2>

            </div>

            <Truck className="w-5 h-5 text-blue-400" />

          </div>


          <div className="space-y-4 mt-6">


            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">

                  <Truck className="w-4 h-4 text-blue-400" />

                </div>

                <div>

                  <p className="text-sm font-semibold">
                    Supply Vehicles
                  </p>

                  <p className="text-xs text-slate-400">
                    Active transport
                  </p>

                </div>

              </div>

              <span className="text-sm font-bold">
                08
              </span>

            </div>



            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">

                  <HeartPulse className="w-4 h-4 text-red-400" />

                </div>

                <div>

                  <p className="text-sm font-semibold">
                    Medical Teams
                  </p>

                  <p className="text-xs text-slate-400">
                    Deployed
                  </p>

                </div>

              </div>

              <span className="text-sm font-bold">
                12
              </span>

            </div>



            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">

                  <Users className="w-4 h-4 text-purple-400" />

                </div>

                <div>

                  <p className="text-sm font-semibold">
                    Rescue Teams
                  </p>

                  <p className="text-xs text-slate-400">
                    On standby
                  </p>

                </div>

              </div>

              <span className="text-sm font-bold">
                06
              </span>

            </div>

          </div>


          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">

            <ArrowUpRight className="w-4 h-4 text-emerald-400" />

            <span className="text-xs text-slate-400">
              Response operations are being monitored continuously.
            </span>

          </div>

        </div>

      </div>



      {/* ==================================================
          RESOURCE DEMAND
      ================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">


        <div className="px-6 py-5 border-b border-slate-100">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">

              <Package className="w-5 h-5 text-indigo-600" />

            </div>

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                Resource Demand
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Current resource requirements across affected areas.
              </p>

            </div>

          </div>

        </div>


        <div className="p-6">

          <ResourceChart />

        </div>

      </div>

    </div>
  )
}


export default Dashboard