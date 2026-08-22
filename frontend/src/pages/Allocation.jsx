import { useMemo, useState } from "react"

import {
  Boxes,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck,
  Users,
  BrainCircuit,
  ChevronRight,
  Minus,
  Plus,
  ShieldAlert,
  Send,
  RotateCcw,
  X,
} from "lucide-react"


function Allocation() {

  // --------------------------------------------------
  // SELECTED ZONE
  // --------------------------------------------------

  const [selectedZoneId, setSelectedZoneId] = useState("Z-001")

  const [showReview, setShowReview] = useState(false)

  const [deployed, setDeployed] = useState(false)


  // --------------------------------------------------
  // DISASTER ZONES
  // --------------------------------------------------

  const zones = [
    {
      id: "Z-001",
      name: "Guwahati",
      state: "Assam",
      severity: "Critical",
      affected: "8,400",
      population: 8400,
      status: "Immediate Response",
    },

    {
      id: "Z-002",
      name: "Dibrugarh",
      state: "Assam",
      severity: "Critical",
      affected: "6,200",
      population: 6200,
      status: "Evacuation Required",
    },

    {
      id: "Z-003",
      name: "Patna",
      state: "Bihar",
      severity: "High",
      affected: "5,100",
      population: 5100,
      status: "Relief Required",
    },

    {
      id: "Z-004",
      name: "Silchar",
      state: "Assam",
      severity: "Medium",
      affected: "3,200",
      population: 3200,
      status: "Monitoring",
    },
  ]


  // --------------------------------------------------
  // RESOURCES
  // --------------------------------------------------

  const [resources, setResources] = useState({
    water: 1200,
    food: 900,
    medical: 180,
    shelter: 80,
  })


  // --------------------------------------------------
  // AVAILABLE RESOURCES
  // --------------------------------------------------

  const availableResources = {
    water: 5000,
    food: 3500,
    medical: 700,
    shelter: 300,
  }


  // --------------------------------------------------
  // AI RECOMMENDATIONS
  // --------------------------------------------------

  const recommendations = {
    "Z-001": {
      water: 1200,
      food: 900,
      medical: 180,
      shelter: 80,
    },

    "Z-002": {
      water: 950,
      food: 700,
      medical: 140,
      shelter: 100,
    },

    "Z-003": {
      water: 700,
      food: 550,
      medical: 90,
      shelter: 60,
    },

    "Z-004": {
      water: 400,
      food: 300,
      medical: 50,
      shelter: 30,
    },
  }


  // --------------------------------------------------
  // CURRENT ZONE
  // --------------------------------------------------

  const selectedZone = zones.find(
    (zone) => zone.id === selectedZoneId
  )


  // --------------------------------------------------
  // CHANGE ZONE
  // --------------------------------------------------

  function selectZone(zone) {

    setSelectedZoneId(zone.id)

    setResources({
      ...recommendations[zone.id],
    })

    setDeployed(false)
  }


  // --------------------------------------------------
  // CHANGE RESOURCE QUANTITY
  // --------------------------------------------------

  function updateResource(resource, amount) {

    setResources((current) => {

      const newValue = current[resource] + amount

      if (newValue < 0) {
        return current
      }

      if (newValue > availableResources[resource]) {
        return current
      }

      return {
        ...current,
        [resource]: newValue,
      }

    })

    setDeployed(false)
  }


  // --------------------------------------------------
  // RESET TO AI RECOMMENDATION
  // --------------------------------------------------

  function resetAllocation() {

    setResources({
      ...recommendations[selectedZoneId],
    })

    setDeployed(false)
  }


  // --------------------------------------------------
  // TOTAL RESOURCE UNITS
  // --------------------------------------------------

  const totalAllocated = useMemo(() => {

    return Object.values(resources).reduce(
      (total, value) => total + value,
      0
    )

  }, [resources])


  // --------------------------------------------------
  // DEPLOY
  // --------------------------------------------------

  function deployResources() {

    setDeployed(true)
    setShowReview(false)
  }


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
            Allocate emergency resources to affected disaster zones.
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
                    Select a zone to allocate resources
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
                  key={zone.id}
                  onClick={() => selectZone(zone)}
                  className={`
                    w-full text-left p-4 rounded-lg border transition
                    ${
                      selectedZoneId === zone.id
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
                          {zone.name}
                        </span>

                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                        {zone.state}
                      </p>

                    </div>


                    <SeverityBadge
                      severity={zone.severity}
                    />

                  </div>


                  <div className="flex items-center justify-between mt-4">

                    <div>

                      <p className="text-[11px] text-gray-400">
                        Affected population
                      </p>

                      <p className="text-sm font-semibold mt-0.5">
                        {zone.affected}
                      </p>

                    </div>

                    <ChevronRight
                      className={`
                        w-4 h-4
                        ${
                          selectedZoneId === zone.id
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


            {/* HEADER */}

            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">

              <div className="flex items-center justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <MapPin className="w-4 h-4 text-blue-600" />

                    <h2 className="font-semibold">
                      {selectedZone.name}
                    </h2>

                    <SeverityBadge
                      severity={selectedZone.severity}
                    />

                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedZone.status}
                  </p>

                </div>


                <button
                  onClick={resetAllocation}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>

              </div>

            </div>


            {/* RESOURCE CONTROLS */}

            <div className="p-5 space-y-4">


              <ResourceControl
                icon={<span>💧</span>}
                label="Water"
                unit="liters"
                value={resources.water}
                available={availableResources.water}
                onDecrease={() =>
                  updateResource("water", -100)
                }
                onIncrease={() =>
                  updateResource("water", 100)
                }
              />


              <ResourceControl
                icon={<span>📦</span>}
                label="Food Packets"
                unit="packets"
                value={resources.food}
                available={availableResources.food}
                onDecrease={() =>
                  updateResource("food", -100)
                }
                onIncrease={() =>
                  updateResource("food", 100)
                }
              />


              <ResourceControl
                icon={<span>🩺</span>}
                label="Medical Kits"
                unit="kits"
                value={resources.medical}
                available={availableResources.medical}
                onDecrease={() =>
                  updateResource("medical", -10)
                }
                onIncrease={() =>
                  updateResource("medical", 10)
                }
              />


              <ResourceControl
                icon={<span>⛺</span>}
                label="Shelter Capacity"
                unit="people"
                value={resources.shelter}
                available={availableResources.shelter}
                onDecrease={() =>
                  updateResource("shelter", -10)
                }
                onIncrease={() =>
                  updateResource("shelter", 10)
                }
              />


            </div>


            {/* ALLOCATION SUMMARY */}

            <div className="mx-5 mb-5 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total allocated units
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {totalAllocated.toLocaleString()}
                  </p>

                </div>

                <Package className="w-7 h-7 text-blue-600" />

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            RIGHT - AI RECOMMENDATION
        ================================================== */}

        <div className="xl:col-span-4">

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">


            {/* AI HEADER */}

            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">

                  <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400" />

                </div>

                <div>

                  <h2 className="font-semibold">
                    AI Recommendation
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Suggested allocation for this zone
                  </p>

                </div>

              </div>

            </div>


            {/* AI BODY */}

            <div className="p-5">

              <div className="rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-4">

                <div className="flex items-start gap-3">

                  <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />

                  <div>

                    <p className="text-sm font-semibold">
                      Priority: {selectedZone.severity}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      Based on affected population, disaster
                      severity and current zone priority.
                    </p>

                  </div>

                </div>

              </div>


              <div className="mt-5 space-y-3">


                <RecommendationRow
                  label="Water"
                  value={recommendations[selectedZoneId].water}
                  unit="L"
                />

                <RecommendationRow
                  label="Food"
                  value={recommendations[selectedZoneId].food}
                  unit="packets"
                />

                <RecommendationRow
                  label="Medical"
                  value={recommendations[selectedZoneId].medical}
                  unit="kits"
                />

                <RecommendationRow
                  label="Shelter"
                  value={recommendations[selectedZoneId].shelter}
                  unit="capacity"
                />


              </div>


              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-800">

                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">

                  <CheckCircle2 className="w-4 h-4" />

                  AI recommendation available

                </div>

              </div>

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
                  Nearest Resource Depot
                </p>

                <p className="text-sm font-semibold mt-1">
                  Central Relief Depot
                </p>

                <p className="text-xs text-gray-400 mt-0.5">
                  Dispatch available
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

              {deployed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Send className="w-5 h-5 text-blue-600" />
              )}

            </div>


            <div>

              <p className="font-semibold">

                {deployed
                  ? "Resources deployed successfully"
                  : `Ready to allocate resources to ${selectedZone.name}`
                }

              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">

                {deployed
                  ? "Deployment has been recorded for this response zone."
                  : `${totalAllocated.toLocaleString()} total resource units selected`
                }

              </p>

            </div>

          </div>


          <div className="flex items-center gap-3">

            {!deployed && (

              <button
                onClick={() => setShowReview(true)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Review Allocation
              </button>

            )}


            {deployed && (

              <button
                onClick={() => {
                  setDeployed(false)
                  resetAllocation()
                }}
                className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                New Allocation
              </button>

            )}

          </div>

        </div>

      </div>


      {/* ==================================================
          REVIEW MODAL
      ================================================== */}

      {showReview && (

        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">


            {/* MODAL HEADER */}

            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">

              <div>

                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  ALLOCATION REVIEW
                </p>

                <h2 className="text-lg font-bold mt-1">
                  {selectedZone.name}
                </h2>

              </div>


              <button
                onClick={() => setShowReview(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>

            </div>


            {/* MODAL BODY */}

            <div className="p-5 space-y-4">


              <ReviewRow
                label="Water"
                value={`${resources.water.toLocaleString()} L`}
              />

              <ReviewRow
                label="Food Packets"
                value={`${resources.food.toLocaleString()}`}
              />

              <ReviewRow
                label="Medical Kits"
                value={`${resources.medical.toLocaleString()}`}
              />

              <ReviewRow
                label="Shelter Capacity"
                value={`${resources.shelter.toLocaleString()}`}
              />


              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50">

                <div className="flex gap-2">

                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />

                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Please verify the allocation before
                    deploying resources to the field.
                  </p>

                </div>

              </div>

            </div>


            {/* MODAL FOOTER */}

            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">

              <button
                onClick={() => setShowReview(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={deployResources}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >

                <Send className="w-4 h-4" />

                Deploy Resources

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}


/* ======================================================
   RESOURCE CONTROL
====================================================== */

function ResourceControl({
  icon,
  label,
  unit,
  value,
  available,
  onDecrease,
  onIncrease,
}) {

  const percentage = Math.min(
    Math.round((value / available) * 100),
    100
  )


  return (

    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-lg">
            {icon}
          </div>

          <div>

            <p className="text-sm font-semibold">
              {label}
            </p>

            <p className="text-xs text-gray-400">
              Available: {available.toLocaleString()} {unit}
            </p>

          </div>

        </div>


        <div className="flex items-center gap-2">

          <button
            onClick={onDecrease}
            className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Minus className="w-4 h-4" />
          </button>


          <div className="w-24 text-center">

            <p className="font-bold">
              {value.toLocaleString()}
            </p>

            <p className="text-[10px] text-gray-400">
              {unit}
            </p>

          </div>


          <button
            onClick={onIncrease}
            className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Plus className="w-4 h-4" />
          </button>

        </div>

      </div>


      <div className="mt-3">

        <div className="flex justify-between text-[10px] text-gray-400 mb-1">

          <span>Allocation</span>

          <span>{percentage}%</span>

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

    </div>

  )
}


/* ======================================================
   RECOMMENDATION ROW
====================================================== */

function RecommendationRow({
  label,
  value,
  unit,
}) {

  return (

    <div className="flex items-center justify-between py-2">

      <span className="text-sm text-gray-600 dark:text-gray-300">
        {label}
      </span>

      <span className="text-sm font-bold">
        {value.toLocaleString()} {unit}
      </span>

    </div>

  )
}


/* ======================================================
   REVIEW ROW
====================================================== */

function ReviewRow({
  label,
  value,
}) {

  return (

    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">

      <span className="text-sm text-gray-600 dark:text-gray-300">
        {label}
      </span>

      <span className="text-sm font-bold">
        {value}
      </span>

    </div>

  )
}


/* ======================================================
   SEVERITY BADGE
====================================================== */

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

  }

  return (

    <span
      className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${style}`}
    >
      {severity}
    </span>

  )
}


export default Allocation