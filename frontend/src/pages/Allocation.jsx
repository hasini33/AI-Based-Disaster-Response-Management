import { useEffect, useMemo, useState } from "react"

import {
  Boxes,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck,
  BrainCircuit,
  ChevronRight,
  ShieldAlert,
  Send,
  RotateCcw,
  X,
  Clock,
  Check,
  Ban,
} from "lucide-react"

import {
  getOptimizedAllocation,
  getZoneAllocation,
  requestAllocation,
  approveAllocation,
  rejectAllocation,
  completeAllocation,
} from "../services/allocationService"


function Allocation() {

  // ==================================================
  // STATE
  // ==================================================

  const [allocationData, setAllocationData] = useState(null)
  const [selectedZoneId, setSelectedZoneId] = useState(null)
  const [zoneAllocation, setZoneAllocation] = useState(null)

  const [loading, setLoading] = useState(true)
  const [zoneLoading, setZoneLoading] = useState(false)

  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")

  const [showReview, setShowReview] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)

  const [actionLoading, setActionLoading] = useState(null)

  const [requestResult, setRequestResult] = useState(null)


  // ==================================================
  // LOAD OPTIMIZED ALLOCATION
  // ==================================================

  async function loadAllocation() {

    try {

      setLoading(true)
      setError("")

      const data = await getOptimizedAllocation()

      setAllocationData(data)

      if (
        data?.allocation?.length &&
        selectedZoneId === null
      ) {

        setSelectedZoneId(
          data.allocation[0].zone_id
        )

      }

    } catch (err) {

      console.error(err)

      setError(
        err.message ||
        "Unable to load allocation data."
      )

    } finally {

      setLoading(false)

    }
  }


  // ==================================================
  // LOAD SELECTED ZONE
  // ==================================================

  async function loadZoneAllocation(zoneId) {

    try {

      setZoneLoading(true)
      setActionError("")

      const data = await getZoneAllocation(zoneId)

      setZoneAllocation(data)

    } catch (err) {

      console.error(err)

      setActionError(
        err.message ||
        "Unable to load zone allocation."
      )

    } finally {

      setZoneLoading(false)

    }
  }


  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {

    loadAllocation()

  }, [])


  // ==================================================
  // LOAD ZONE WHEN SELECTED
  // ==================================================

  useEffect(() => {

    if (selectedZoneId !== null) {

      loadZoneAllocation(
        selectedZoneId
      )

    }

  }, [selectedZoneId])


  // ==================================================
  // ZONES
  // ==================================================

  const zones =
    allocationData?.allocation || []


  // ==================================================
  // SELECTED ZONE
  // ==================================================

  const selectedZone = zones.find(
    (zone) =>
      zone.zone_id === selectedZoneId
  )


  // ==================================================
  // RESOURCES
  // ==================================================

  const resources =
    selectedZone?.resources || {}


  // ==================================================
  // TOTAL ALLOCATION
  // ==================================================

  const totalAllocated = useMemo(() => {

    return Object.values(resources).reduce(
      (total, resource) =>
        total + Number(resource.allocated || 0),
      0
    )

  }, [resources])


  const totalRequired = useMemo(() => {

    return Object.values(resources).reduce(
      (total, resource) =>
        total + Number(resource.required || 0),
      0
    )

  }, [resources])


  // ==================================================
  // RESOURCE HELPERS
  // ==================================================

  const resourceConfig = {

    water_liters: {
      label: "Water",
      unit: "liters",
      icon: "💧",
    },

    food_packets: {
      label: "Food Packets",
      unit: "packets",
      icon: "📦",
    },

    medical_kits: {
      label: "Medical Kits",
      unit: "kits",
      icon: "🩺",
    },

    shelter_capacity: {
      label: "Shelter Capacity",
      unit: "people",
      icon: "⛺",
    },

  }


  // ==================================================
  // REQUEST ALLOCATION
  // ==================================================

  async function handleRequestAllocation() {

    if (!selectedZoneId) {
      return
    }

    try {

      setRequestLoading(true)
      setActionError("")

      const result =
        await requestAllocation(
          selectedZoneId
        )

      setRequestResult(result)

      setShowReview(false)

      await loadAllocation()

      await loadZoneAllocation(
        selectedZoneId
      )

    } catch (err) {

      console.error(err)

      setActionError(
        err.message ||
        "Unable to create allocation request."
      )

    } finally {

      setRequestLoading(false)

    }
  }


  // ==================================================
  // APPROVE
  // ==================================================

  async function handleApprove(allocationId) {

    try {

      setActionLoading(allocationId)
      setActionError("")

      await approveAllocation(
        allocationId
      )

      await loadAllocation()

      await loadZoneAllocation(
        selectedZoneId
      )

      if (requestResult) {

        setRequestResult((current) => {

          if (!current?.allocations) {
            return current
          }

          return {
            ...current,
            allocations:
              current.allocations.map(
                (item) =>
                  item.id === allocationId
                    ? {
                        ...item,
                        status: "Approved",
                      }
                    : item
              ),
          }

        })

      }

    } catch (err) {

      console.error(err)

      setActionError(
        err.message ||
        "Unable to approve allocation."
      )

    } finally {

      setActionLoading(null)

    }
  }


  // ==================================================
  // REJECT
  // ==================================================

  async function handleReject(allocationId) {

    try {

      setActionLoading(allocationId)
      setActionError("")

      await rejectAllocation(
        allocationId
      )

      await loadAllocation()

      await loadZoneAllocation(
        selectedZoneId
      )

    } catch (err) {

      console.error(err)

      setActionError(
        err.message ||
        "Unable to reject allocation."
      )

    } finally {

      setActionLoading(null)

    }
  }


  // ==================================================
  // COMPLETE
  // ==================================================

  async function handleComplete(allocationId) {

    try {

      setActionLoading(allocationId)
      setActionError("")

      await completeAllocation(
        allocationId
      )

      await loadAllocation()

      await loadZoneAllocation(
        selectedZoneId
      )

      if (requestResult) {

        setRequestResult((current) => {

          if (!current?.allocations) {
            return current
          }

          return {
            ...current,
            allocations:
              current.allocations.map(
                (item) =>
                  item.id === allocationId
                    ? {
                        ...item,
                        status: "Completed",
                      }
                    : item
              ),
          }

        })

      }

    } catch (err) {

      console.error(err)

      setActionError(
        err.message ||
        "Unable to complete allocation."
      )

    } finally {

      setActionLoading(null)

    }
  }


  // ==================================================
  // RESET
  // ==================================================

  async function resetAllocation() {

    setRequestResult(null)
    setActionError("")

    await loadAllocation()

    if (selectedZoneId !== null) {

      await loadZoneAllocation(
        selectedZoneId
      )

    }

  }


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {

    return (

      <div className="flex items-center justify-center min-h-[400px]">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Loading optimized allocation...
          </p>

        </div>

      </div>

    )

  }


  // ==================================================
  // ERROR
  // ==================================================

  if (error) {

    return (

      <div className="p-6">

        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-5">

          <div className="flex items-center gap-3">

            <AlertTriangle className="w-5 h-5 text-red-600" />

            <div>

              <p className="font-semibold text-red-700 dark:text-red-400">
                Unable to load allocation
              </p>

              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>

            </div>

          </div>

          <button
            onClick={loadAllocation}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold"
          >
            Retry
          </button>

        </div>

      </div>

    )

  }


  // ==================================================
  // MAIN UI
  // ==================================================

  return (

    <div className="space-y-6 text-gray-900 dark:text-gray-100">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">

            <Boxes className="w-5 h-5" />

            <span className="text-sm font-semibold">
              Resource Coordination
            </span>

          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            Resource Allocation
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            OR-Tools optimized allocation across disaster zones.
          </p>

        </div>


        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />

            <span className="text-sm font-medium">
              Allocation Engine Ready
            </span>

          </div>

        </div>

      </div>


      {/* ==================================================
          GLOBAL SUMMARY
      ================================================== */}

      {allocationData && (

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <SummaryCard
            label="Total Required"
            value={allocationData.total_required}
          />

          <SummaryCard
            label="Total Allocated"
            value={allocationData.total_allocated}
          />

          <SummaryCard
            label="Coverage"
            value={`${allocationData.overall_coverage_percent}%`}
          />

          <SummaryCard
            label="Zones"
            value={zones.length}
          />

        </div>

      )}


      {/* ==================================================
          ERROR / ACTION MESSAGE
      ================================================== */}

      {actionError && (

        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">

          <AlertTriangle className="w-5 h-5 text-red-600" />

          <p className="text-sm text-red-700 dark:text-red-400">
            {actionError}
          </p>

          <button
            onClick={() => setActionError("")}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

      )}


      {/* ==================================================
          REQUEST RESULT
      ================================================== */}

      {requestResult && (

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5">

          <div className="flex items-center justify-between">

            <div>

              <div className="flex items-center gap-2">

                <CheckCircle2 className="w-5 h-5 text-blue-600" />

                <h2 className="font-semibold">
                  Allocation Request Created
                </h2>

              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Request status: {requestResult.status}
              </p>

            </div>

          </div>


          <div className="mt-4 space-y-2">

            {requestResult.allocations?.map(
              (item) => (

                <AllocationRequestRow
                  key={item.id}
                  allocation={item}
                  loading={actionLoading === item.id}
                  onApprove={() =>
                    handleApprove(item.id)
                  }
                  onReject={() =>
                    handleReject(item.id)
                  }
                  onComplete={() =>
                    handleComplete(item.id)
                  }
                />

              )
            )}

          </div>

        </div>

      )}


      {/* ==================================================
          MAIN WORKSPACE
      ================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">


        {/* ==================================================
            LEFT - ZONES
        ================================================== */}

        <div className="xl:col-span-3">

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">

            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="font-semibold">
                    Affected Zones
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select a zone
                  </p>

                </div>

                <span className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  {zones.length}
                </span>

              </div>

            </div>


            <div className="p-3 space-y-2">

              {zones.map((zone) => (

                <button
                  key={zone.zone_id}
                  onClick={() => {
                    setSelectedZoneId(zone.zone_id)
                    setRequestResult(null)
                    setActionError("")
                  }}
                  className={`
                    w-full text-left p-4 rounded-lg border transition
                    ${
                      selectedZoneId === zone.zone_id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-800"
                    }
                  `}
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <div className="flex items-center gap-2">

                        <MapPin className="w-4 h-4 text-gray-400" />

                        <span className="text-sm font-semibold">
                          {zone.zone_name}
                        </span>

                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                        Severity {Number(zone.severity).toFixed(2)}
                      </p>

                    </div>

                    <SeverityBadge
                      severity={zone.priority}
                    />

                  </div>


                  <div className="flex items-center justify-between mt-4">

                    <div>

                      <p className="text-[11px] text-gray-400">
                        Priority
                      </p>

                      <p className="text-sm font-semibold mt-0.5">
                        {zone.priority}
                      </p>

                    </div>

                    <ChevronRight
                      className={`
                        w-4 h-4
                        ${
                          selectedZoneId === zone.zone_id
                            ? "text-blue-600"
                            : "text-gray-400"
                        }
                      `}
                    />

                  </div>

                </button>

              ))}

            </div>

          </div>

        </div>


        {/* ==================================================
            CENTER - ALLOCATION
        ================================================== */}

        <div className="xl:col-span-5">

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">


            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">

              <div className="flex items-center justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <MapPin className="w-4 h-4 text-blue-600" />

                    <h2 className="font-semibold">
                      {selectedZone?.zone_name || "Select Zone"}
                    </h2>

                    {selectedZone && (

                      <SeverityBadge
                        severity={selectedZone.priority}
                      />

                    )}

                  </div>

                  {selectedZone && (

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">

                      Severity:{" "}
                      {Number(
                        selectedZone.severity
                      ).toFixed(2)}

                    </p>

                  )}

                </div>


                <button
                  onClick={resetAllocation}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Refresh
                </button>

              </div>

            </div>


            <div className="p-5 space-y-4">

              {zoneLoading ? (

                <div className="py-10 text-center">

                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

                  <p className="text-xs text-gray-500 mt-3">
                    Loading zone allocation...
                  </p>

                </div>

              ) : (

                Object.entries(resources).map(
                  ([resourceType, data]) => {

                    const config =
                      resourceConfig[
                        resourceType
                      ] || {
                        label: resourceType,
                        unit: "",
                        icon: "📦",
                      }

                    return (

                      <ResourceControl
                        key={resourceType}
                        icon={config.icon}
                        label={config.label}
                        unit={config.unit}
                        required={data.required}
                        allocated={data.allocated}
                        available={data.available}
                        shortage={data.shortage}
                      />

                    )

                  }
                )

              )}

            </div>


            <div className="mx-5 mb-5 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total allocated
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {totalAllocated.toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 2,
                      }
                    )}
                  </p>

                </div>

                <Package className="w-7 h-7 text-blue-600" />

              </div>


              <div className="mt-3 flex items-center justify-between text-xs">

                <span className="text-gray-500 dark:text-gray-400">
                  Required
                </span>

                <span className="font-semibold">
                  {totalRequired.toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            RIGHT - AI RECOMMENDATION
        ================================================== */}

        <div className="xl:col-span-4">

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">


            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">

                  <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400" />

                </div>

                <div>

                  <h2 className="font-semibold">
                    AI / OR-Tools Recommendation
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Optimized using current demand and inventory
                  </p>

                </div>

              </div>

            </div>


            <div className="p-5">

              {selectedZone && (

                <>

                  <div className="rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-4">

                    <div className="flex items-start gap-3">

                      <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />

                      <div>

                        <p className="text-sm font-semibold">
                          Priority: {selectedZone.priority}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">

                          Severity score:{" "}
                          {Number(
                            selectedZone.severity
                          ).toFixed(2)}

                          <br />

                          Priority weight:{" "}
                          {selectedZone.priority_weight}

                        </p>

                      </div>

                    </div>

                  </div>


                  <div className="mt-5 space-y-3">

                    {Object.entries(resources).map(
                      ([resourceType, data]) => {

                        const config =
                          resourceConfig[
                            resourceType
                          ] || {
                            label: resourceType,
                            unit: "",
                          }

                        return (

                          <RecommendationRow
                            key={resourceType}
                            label={config.label}
                            value={data.allocated}
                            required={data.required}
                            unit={config.unit}
                          />

                        )

                      }
                    )}

                  </div>


                  <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-800">

                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">

                      <CheckCircle2 className="w-4 h-4" />

                      Optimization result available

                    </div>

                  </div>

                </>

              )}

            </div>

          </div>


          {/* DEPOT STATUS */}

          <div className="mt-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">

                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />

              </div>

              <div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Resource Availability
                </p>

                <p className="text-sm font-semibold mt-1">
                  Current Inventory
                </p>

                <p className="text-xs text-gray-400 mt-0.5">
                  Based on available backend resources
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ==================================================
          DEPLOYMENT FOOTER
      ================================================== */}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="flex items-center gap-4">

            <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">

              <Send className="w-5 h-5 text-blue-600" />

            </div>

            <div>

              <p className="font-semibold">

                Ready to request optimized allocation

              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">

                This will create Pending allocation requests
                in the backend.

              </p>

            </div>

          </div>


          <div className="flex items-center gap-3">

            <button
              onClick={resetAllocation}
              className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Refresh
            </button>


            <button
              onClick={() => setShowReview(true)}
              disabled={!selectedZone}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold"
            >

              <Send className="w-4 h-4" />

              Request Allocation

            </button>

          </div>

        </div>

      </div>


      {/* ==================================================
          REVIEW MODAL
      ================================================== */}

      {showReview && selectedZone && (

        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">


            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">

              <div>

                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  ALLOCATION REVIEW
                </p>

                <h2 className="text-lg font-bold mt-1">
                  {selectedZone.zone_name}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Priority: {selectedZone.priority}
                </p>

              </div>


              <button
                onClick={() => setShowReview(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>

            </div>


            <div className="p-5 space-y-3">

              {Object.entries(resources).map(
                ([resourceType, data]) => {

                  const config =
                    resourceConfig[
                      resourceType
                    ] || {
                      label: resourceType,
                      unit: "",
                    }

                  return (

                    <ReviewRow
                      key={resourceType}
                      label={config.label}
                      value={`${Number(
                        data.allocated || 0
                      ).toLocaleString()} ${config.unit}`}
                      shortage={data.shortage}
                    />

                  )

                }
              )}


              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50">

                <div className="flex gap-2">

                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />

                  <p className="text-xs text-yellow-700 dark:text-yellow-400">

                    This creates a Pending allocation request.
                    Inventory is not deducted until the allocation
                    is approved.

                  </p>

                </div>

              </div>

            </div>


            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">

              <button
                onClick={() => setShowReview(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700"
              >
                Cancel
              </button>


              <button
                onClick={handleRequestAllocation}
                disabled={requestLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold"
              >

                {requestLoading ? (

                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>

                ) : (

                  <>
                    <Send className="w-4 h-4" />
                    Create Request
                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  )
}


// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
  label,
  value,
}) {

  return (

    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="text-xl font-bold mt-1">
        {typeof value === "number"
          ? value.toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )
          : value}
      </p>

    </div>

  )
}


// ======================================================
// RESOURCE CONTROL
// ======================================================

function ResourceControl({
  icon,
  label,
  unit,
  required,
  allocated,
  available,
  shortage,
}) {

  const percentage =
    required > 0
      ? Math.min(
          Math.round(
            (allocated / required) * 100
          ),
          100
        )
      : 0


  return (

    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">

      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-lg">
            {icon}
          </div>

          <div>

            <p className="text-sm font-semibold">
              {label}
            </p>

            <p className="text-xs text-gray-400">
              Available:{" "}
              {Number(
                available || 0
              ).toLocaleString()}{" "}
              {unit}
            </p>

          </div>

        </div>


        <div className="text-right">

          <p className="font-bold">
            {Number(
              allocated || 0
            ).toLocaleString()}
          </p>

          <p className="text-[10px] text-gray-400">
            allocated
          </p>

        </div>

      </div>


      <div className="mt-3">

        <div className="flex justify-between text-[10px] text-gray-400 mb-1">

          <span>
            Coverage
          </span>

          <span>
            {percentage}%
          </span>

        </div>

        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">

          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
            }}
          />

        </div>

      </div>


      <div className="mt-3 flex items-center justify-between text-xs">

        <span className="text-gray-500 dark:text-gray-400">
          Required
        </span>

        <span className="font-medium">
          {Number(
            required || 0
          ).toLocaleString()}{" "}
          {unit}
        </span>

      </div>


      {Number(shortage || 0) > 0 && (

        <div className="mt-2 flex items-center justify-between text-xs">

          <span className="text-red-500">
            Shortage
          </span>

          <span className="font-semibold text-red-600 dark:text-red-400">
            {Number(
              shortage
            ).toLocaleString()}{" "}
            {unit}
          </span>

        </div>

      )}

    </div>

  )
}


// ======================================================
// RECOMMENDATION ROW
// ======================================================

function RecommendationRow({
  label,
  value,
  required,
  unit,
}) {

  return (

    <div className="flex items-center justify-between py-2">

      <span className="text-sm text-gray-600 dark:text-gray-300">
        {label}
      </span>

      <div className="text-right">

        <span className="text-sm font-bold">
          {Number(
            value || 0
          ).toLocaleString()}{" "}
          {unit}
        </span>

        <p className="text-[10px] text-gray-400">
          of {Number(
            required || 0
          ).toLocaleString()} required
        </p>

      </div>

    </div>

  )
}


// ======================================================
// REVIEW ROW
// ======================================================

function ReviewRow({
  label,
  value,
  shortage,
}) {

  return (

    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">

      <div className="flex items-center justify-between">

        <span className="text-sm text-gray-600 dark:text-gray-300">
          {label}
        </span>

        <span className="text-sm font-bold">
          {value}
        </span>

      </div>

      {Number(shortage || 0) > 0 && (

        <p className="text-xs text-red-500 mt-1">
          Shortage:{" "}
          {Number(
            shortage
          ).toLocaleString()}
        </p>

      )}

    </div>

  )
}


// ======================================================
// ALLOCATION REQUEST ROW
// ======================================================

function AllocationRequestRow({
  allocation,
  loading,
  onApprove,
  onReject,
  onComplete,
}) {

  const status = allocation.status


  return (

    <div className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-800 rounded-lg p-4">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">


        <div>

          <div className="flex items-center gap-2">

            <span className="text-sm font-semibold">
              {formatResourceType(
                allocation.resource_type
              )}
            </span>

            <StatusBadge
              status={status}
            />

          </div>


          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">

            <span>
              Required:{" "}
              {Number(
                allocation.required || 0
              ).toLocaleString()}
            </span>

            <span>
              Allocated:{" "}
              {Number(
                allocation.allocated || 0
              ).toLocaleString()}
            </span>

            <span>
              Shortage:{" "}
              {Number(
                allocation.shortage || 0
              ).toLocaleString()}
            </span>

          </div>

        </div>


        <div className="flex items-center gap-2">


          {status === "Pending" && (

            <>

              <button
                onClick={onReject}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
              >

                <Ban className="w-3.5 h-3.5" />

                Reject

              </button>


              <button
                onClick={onApprove}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
              >

                <Check className="w-3.5 h-3.5" />

                Approve

              </button>

            </>

          )}


          {status === "Approved" && (

            <button
              onClick={onComplete}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold disabled:opacity-50"
            >

              <CheckCircle2 className="w-3.5 h-3.5" />

              Complete

            </button>

          )}


          {loading && (

            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />

          )}

        </div>

      </div>

    </div>

  )
}


// ======================================================
// STATUS BADGE
// ======================================================

function StatusBadge({
  status,
}) {

  let style =
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"

  if (status === "Pending") {

    style =
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400"

  } else if (status === "Approved") {

    style =
      "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"

  } else if (status === "Completed") {

    style =
      "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"

  } else if (status === "Rejected") {

    style =
      "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"

  }

  return (

    <span
      className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${style}`}
    >
      {status}
    </span>

  )
}


// ======================================================
// SEVERITY BADGE
// ======================================================

function SeverityBadge({
  severity,
}) {

  let style =
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"

  if (severity === "Critical") {

    style =
      "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"

  } else if (severity === "High") {

    style =
      "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400"

  } else if (severity === "Medium") {

    style =
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400"

  } else if (severity === "Low") {

    style =
      "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"

  }

  return (

    <span
      className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${style}`}
    >
      {severity}
    </span>

  )
}


// ======================================================
// RESOURCE NAME
// ======================================================

function formatResourceType(
  resourceType
) {

  const names = {

    food_packets: "Food Packets",

    water_liters: "Water",

    medical_kits: "Medical Kits",

    shelter_capacity: "Shelter Capacity",

  }

  return (
    names[resourceType] ||
    resourceType
  )

}


export default Allocation