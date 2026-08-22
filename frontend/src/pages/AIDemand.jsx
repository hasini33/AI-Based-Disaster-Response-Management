import { useMemo, useState } from "react"

import {
  BrainCircuit,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck,
  ChevronRight,
  Minus,
  Plus,
  ShieldAlert,
  Send,
  RotateCcw,
  X,
  Droplets,
  HeartPulse,
  Tent,
  Boxes,
} from "lucide-react"


function AIDemand() {

  // =========================================================
  // STATE
  // =========================================================

  const [selectedZoneId, setSelectedZoneId] = useState("Z-001")
  const [showReview, setShowReview] = useState(false)
  const [deployed, setDeployed] = useState(false)


  // =========================================================
  // ZONES
  // =========================================================

  const zones = [
    {
      id: "Z-001",
      name: "Guwahati",
      state: "Assam",
      severity: "Critical",
      affected: "8,400",
      population: 8400,
      status: "Immediate Response",
      confidence: 94,
    },
    {
      id: "Z-002",
      name: "Dibrugarh",
      state: "Assam",
      severity: "Critical",
      affected: "6,200",
      population: 6200,
      status: "Evacuation Required",
      confidence: 91,
    },
    {
      id: "Z-003",
      name: "Patna",
      state: "Bihar",
      severity: "High",
      affected: "5,100",
      population: 5100,
      status: "Relief Required",
      confidence: 88,
    },
    {
      id: "Z-004",
      name: "Silchar",
      state: "Assam",
      severity: "Medium",
      affected: "3,200",
      population: 3200,
      status: "Monitoring",
      confidence: 86,
    },
  ]


  // =========================================================
  // AVAILABLE RESOURCES
  // =========================================================

  const availableResources = {
    water: 5000,
    food: 3500,
    medical: 700,
    shelter: 300,
  }


  // =========================================================
  // AI RECOMMENDATIONS
  // =========================================================

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


  // =========================================================
  // RESOURCE STATE
  // =========================================================

  const [resources, setResources] = useState({
    ...recommendations["Z-001"],
  })


  // =========================================================
  // SELECTED ZONE
  // =========================================================

  const selectedZone = zones.find(
    (zone) => zone.id === selectedZoneId
  )


  // =========================================================
  // TOTAL ALLOCATION
  // =========================================================

  const totalAllocated = useMemo(() => {
    return Object.values(resources).reduce(
      (total, value) => total + value,
      0
    )
  }, [resources])


  // =========================================================
  // SELECT ZONE
  // =========================================================

  function selectZone(zone) {

    setSelectedZoneId(zone.id)

    setResources({
      ...recommendations[zone.id],
    })

    setDeployed(false)
  }


  // =========================================================
  // UPDATE RESOURCE
  // =========================================================

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


  // =========================================================
  // RESET
  // =========================================================

  function resetAllocation() {

    setResources({
      ...recommendations[selectedZoneId],
    })

    setDeployed(false)
  }


  // =========================================================
  // DEPLOY
  // =========================================================

  function deployResources() {

    setDeployed(true)

    setShowReview(false)
  }


  return (

    <div className="w-full max-w-none space-y-5">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">

            <BrainCircuit className="w-4 h-4" />

            AI-Powered Resource Planning

          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-1">

            AI Demand & Allocation

          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">

            Predict emergency resource demand and review allocations
            for affected disaster zones.

          </p>

        </div>


        {/* AI ENGINE STATUS */}

        <div className="
          flex items-center gap-2
          px-4 py-2.5
          rounded-lg
          border border-[#C9E0F5] dark:border-slate-700
          bg-[#F2F8FF] dark:bg-slate-900
          shrink-0
        ">

          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />

          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">

            AI Engine Ready

          </span>

        </div>

      </div>


      {/* =====================================================
          AFFECTED ZONES
      ===================================================== */}

      <div className="
        bg-[#F2F8FF]
        dark:bg-slate-900
        border border-[#C9E0F5]
        dark:border-slate-700
        rounded-xl
        overflow-hidden
      ">

        {/* HEADER */}

        <div className="
          px-5 py-4
          border-b border-[#D6E7F6]
          dark:border-slate-700
        ">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-semibold text-sm text-slate-900 dark:text-white">

                Affected Zones

              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">

                Select a disaster zone to view AI demand prediction

              </p>

            </div>


            <span className="
              text-xs
              font-semibold
              px-2 py-1
              rounded-md
              bg-[#E8F3FF]
              text-blue-600
              dark:bg-blue-950/50
              dark:text-blue-400
            ">

              {zones.length} zones

            </span>

          </div>

        </div>


        {/* ZONE CARDS */}

        <div className="p-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

            {zones.map((zone) => (

              <button
                key={zone.id}
                onClick={() => selectZone(zone)}
                className={`
                  w-full
                  text-left
                  rounded-xl
                  border
                  p-4
                  transition-all
                  ${
                    selectedZoneId === zone.id
                      ? `
                        border-blue-500
                        bg-[#E3F0FF]
                        dark:bg-blue-950/50
                        shadow-sm
                      `
                      : `
                        border-[#C9E0F5]
                        bg-[#F2F8FF]
                        hover:bg-[#E8F3FF]
                        hover:border-blue-300
                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:hover:bg-slate-800
                      `
                  }
                `}
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex items-center gap-2 min-w-0">

                    <MapPin
                      className={`
                        w-4 h-4
                        shrink-0
                        ${
                          selectedZoneId === zone.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-400"
                        }
                      `}
                    />

                    <div className="min-w-0">

                      <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">

                        {zone.name}

                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">

                        {zone.state}

                      </p>

                    </div>

                  </div>


                  <SeverityBadge
                    severity={zone.severity}
                  />

                </div>


                <div className="flex items-end justify-between mt-4">

                  <div>

                    <p className="text-[11px] text-slate-400">

                      Affected population

                    </p>

                    <p className="text-sm font-semibold mt-0.5 text-slate-900 dark:text-white">

                      {zone.affected}

                    </p>

                  </div>


                  <ChevronRight
                    className={`
                      w-4 h-4
                      ${
                        selectedZoneId === zone.id
                          ? "text-blue-600"
                          : "text-slate-400"
                      }
                    `}
                  />

                </div>

              </button>

            ))}

          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">


        {/* ===================================================
            LEFT / MAIN AREA
        =================================================== */}

        <div className="min-w-0 space-y-5">


          {/* =================================================
              SELECTED ZONE + AI DEMAND
          ================================================= */}

          <div className="
            bg-[#F2F8FF]
            dark:bg-slate-900
            border border-[#C9E0F5]
            dark:border-slate-700
            rounded-xl
            overflow-hidden
          ">

            {/* HEADER */}

            <div className="
              px-5 py-4
              border-b border-[#D6E7F6]
              dark:border-slate-700
            ">

              <div className="flex items-center justify-between gap-4">

                <div className="min-w-0">

                  <div className="flex items-center gap-2 flex-wrap">

                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />

                    <h2 className="font-semibold text-slate-900 dark:text-white">

                      {selectedZone.name}

                    </h2>

                    <SeverityBadge
                      severity={selectedZone.severity}
                    />

                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">

                    {selectedZone.status}

                  </p>

                </div>


                <button
                  onClick={resetAllocation}
                  className="
                    flex items-center gap-1.5
                    text-xs font-medium
                    text-slate-500
                    hover:text-blue-600
                    dark:hover:text-blue-400
                    shrink-0
                  "
                >

                  <RotateCcw className="w-3.5 h-3.5" />

                  Reset

                </button>

              </div>

            </div>


            {/* AI DEMAND */}

            <div className="p-5">

              <div className="
                flex flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-3
                mb-4
              ">

                <div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">

                    AI Demand Prediction

                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">

                    Estimated emergency requirements

                  </p>

                </div>


                <div className="
                  flex items-center gap-1.5
                  text-xs font-semibold
                  text-green-600 dark:text-green-400
                ">

                  <CheckCircle2 className="w-4 h-4" />

                  {selectedZone.confidence}% confidence

                </div>

              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                <DemandCard
                  icon={<Droplets />}
                  label="Water"
                  value={recommendations[selectedZoneId].water}
                  unit="L"
                />

                <DemandCard
                  icon={<Boxes />}
                  label="Food"
                  value={recommendations[selectedZoneId].food}
                  unit="packets"
                />

                <DemandCard
                  icon={<HeartPulse />}
                  label="Medical"
                  value={recommendations[selectedZoneId].medical}
                  unit="kits"
                />

                <DemandCard
                  icon={<Tent />}
                  label="Shelter"
                  value={recommendations[selectedZoneId].shelter}
                  unit="capacity"
                />

              </div>

            </div>

          </div>


          {/* =================================================
              RESOURCE ALLOCATION
          ================================================= */}

          <div className="
            bg-[#F2F8FF]
            dark:bg-slate-900
            border border-[#C9E0F5]
            dark:border-slate-700
            rounded-xl
            overflow-hidden
          ">

            <div className="
              px-5 py-4
              border-b border-[#D6E7F6]
              dark:border-slate-700
            ">

              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">

                Resource Allocation

              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">

                Adjust the AI recommendation if required

              </p>

            </div>


            <div className="p-5 space-y-3">

              <ResourceControl
                icon={<Droplets />}
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
                icon={<Boxes />}
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
                icon={<HeartPulse />}
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
                icon={<Tent />}
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


            {/* TOTAL */}

            <div className="
              mx-5 mb-5
              p-4
              rounded-lg
              bg-[#E8F3FF]
              dark:bg-blue-950/50
              border border-[#C9E0F5]
              dark:border-blue-900
            ">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">

                    Total allocated units

                  </p>

                  <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">

                    {totalAllocated.toLocaleString()}

                  </p>

                </div>


                <Package className="w-7 h-7 text-blue-600 dark:text-blue-400" />

              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            RIGHT SIDEBAR
        =================================================== */}

        <div className="min-w-0 space-y-5">


          {/* =================================================
              AI RECOMMENDATION
          ================================================= */}

          <div className="
            bg-[#F2F8FF]
            dark:bg-slate-900
            border border-[#C9E0F5]
            dark:border-slate-700
            rounded-xl
            overflow-hidden
          ">

            <div className="
              px-5 py-4
              border-b border-[#D6E7F6]
              dark:border-slate-700
            ">

              <div className="flex items-center gap-3">

                <div className="
                  w-10 h-10
                  shrink-0
                  rounded-lg
                  bg-[#E8F3FF]
                  dark:bg-blue-950/50
                  flex items-center justify-center
                ">

                  <BrainCircuit className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                </div>

                <div>

                  <h2 className="font-semibold text-slate-900 dark:text-white">

                    AI Recommendation

                  </h2>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">

                    Suggested allocation for this zone

                  </p>

                </div>

              </div>

            </div>


            <div className="p-5">

              {/* PRIORITY */}

              <div className="
                rounded-lg
                border border-[#C9E0F5]
                dark:border-blue-900
                bg-[#E8F3FF]
                dark:bg-blue-950/50
                p-4
              ">

                <div className="flex items-start gap-3">

                  <ShieldAlert className="
                    w-5 h-5
                    text-blue-600
                    dark:text-blue-400
                    shrink-0
                    mt-0.5
                  " />

                  <div>

                    <p className="text-sm font-semibold text-slate-900 dark:text-white">

                      Priority: {selectedZone.severity}

                    </p>

                    <p className="
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                      mt-1
                      leading-relaxed
                    ">

                      Based on affected population, disaster severity
                      and current zone priority.

                    </p>

                  </div>

                </div>

              </div>


              {/* VALUES */}

              <div className="mt-5 space-y-1">

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


              {/* STATUS */}

              <div className="
                mt-4 pt-4
                border-t border-[#D6E7F6]
                dark:border-slate-700
              ">

                <div className="
                  flex items-center gap-2
                  text-xs
                  text-green-600
                  dark:text-green-400
                ">

                  <CheckCircle2 className="w-4 h-4" />

                  AI recommendation available

                </div>

              </div>


              {/* CONFIDENCE */}

              <div className="mt-4">

                <div className="flex items-center justify-between mb-1.5">

                  <span className="text-xs text-slate-500 dark:text-slate-400">

                    Prediction confidence

                  </span>

                  <span className="text-xs font-semibold text-slate-900 dark:text-white">

                    {selectedZone.confidence}%

                  </span>

                </div>


                <div className="
                  h-1.5
                  rounded-full
                  bg-slate-200
                  dark:bg-slate-800
                  overflow-hidden
                ">

                  <div
                    className="
                      h-full
                      rounded-full
                      bg-blue-500
                      transition-all
                      duration-300
                    "
                    style={{
                      width: `${selectedZone.confidence}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              RESOURCE DEPOT
          ================================================= */}

          <div className="
            bg-[#F2F8FF]
            dark:bg-slate-900
            border border-[#C9E0F5]
            dark:border-slate-700
            rounded-xl
            p-5
          ">

            <div className="flex items-center gap-3">

              <div className="
                w-10 h-10
                shrink-0
                rounded-lg
                bg-[#E8F3FF]
                dark:bg-blue-950/50
                flex items-center justify-center
              ">

                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />

              </div>

              <div>

                <p className="text-xs text-slate-500 dark:text-slate-400">

                  Nearest Resource Depot

                </p>

                <p className="text-sm font-semibold mt-1 text-slate-900 dark:text-white">

                  Central Relief Depot

                </p>

                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">

                  Dispatch available

                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              RESPONSE PRIORITY
          ================================================= */}

          <div className="
            bg-[#F2F8FF]
            dark:bg-slate-900
            border border-[#C9E0F5]
            dark:border-slate-700
            rounded-xl
            p-5
          ">

            <div className="flex items-start gap-3">

              <div className="
                w-10 h-10
                shrink-0
                rounded-lg
                bg-orange-50
                dark:bg-orange-950/30
                flex items-center justify-center
              ">

                <AlertTriangle className="
                  w-5 h-5
                  text-orange-600
                  dark:text-orange-400
                " />

              </div>

              <div>

                <p className="text-sm font-semibold text-slate-900 dark:text-white">

                  Response Priority

                </p>

                <p className="
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                  mt-1
                  leading-relaxed
                ">

                  {selectedZone.status}. Resource deployment should
                  be verified before dispatching to the field.

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          DEPLOYMENT FOOTER
      ===================================================== */}

      <div className="
        bg-[#F2F8FF]
        dark:bg-slate-900
        border border-[#C9E0F5]
        dark:border-slate-700
        rounded-xl
        p-5
      ">

        <div className="
          flex flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-4
        ">

          <div className="flex items-center gap-4 min-w-0">

            <div className="
              w-11 h-11
              shrink-0
              rounded-lg
              bg-[#E8F3FF]
              dark:bg-blue-950/50
              flex items-center justify-center
            ">

              {deployed ? (

                <CheckCircle2 className="
                  w-5 h-5
                  text-green-600
                  dark:text-green-400
                " />

              ) : (

                <Send className="
                  w-5 h-5
                  text-blue-600
                  dark:text-blue-400
                " />

              )}

            </div>


            <div className="min-w-0">

              <p className="font-semibold text-slate-900 dark:text-white">

                {deployed
                  ? "Resources deployed successfully"
                  : `Ready to allocate resources to ${selectedZone.name}`
                }

              </p>

              <p className="
                text-xs
                text-slate-500
                dark:text-slate-400
                mt-1
              ">

                {deployed
                  ? "Deployment has been recorded for this response zone."
                  : `${totalAllocated.toLocaleString()} total resource units selected`
                }

              </p>

            </div>

          </div>


          <div className="flex items-center gap-3 shrink-0">

            {!deployed && (

              <button
                onClick={() => setShowReview(true)}
                className="
                  px-5 py-2.5
                  rounded-lg
                  border border-slate-300
                  dark:border-slate-700
                  text-sm font-semibold
                  text-slate-700
                  dark:text-slate-200
                  hover:bg-white
                  dark:hover:bg-slate-800
                  transition
                "
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
                className="
                  px-5 py-2.5
                  rounded-lg
                  border border-slate-300
                  dark:border-slate-700
                  text-sm font-semibold
                  text-slate-700
                  dark:text-slate-200
                  hover:bg-white
                  dark:hover:bg-slate-800
                  transition
                "
              >

                New Allocation

              </button>

            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          REVIEW MODAL
      ===================================================== */}

      {showReview && (

        <div className="
          fixed inset-0
          z-50
          bg-black/60
          flex items-center justify-center
          p-4
        ">

          <div className="
            w-full
            max-w-md
            bg-[#F2F8FF]
            dark:bg-slate-900
            rounded-xl
            shadow-2xl
            overflow-hidden
          ">

            {/* HEADER */}

            <div className="
              px-5 py-4
              border-b border-[#D6E7F6]
              dark:border-slate-700
              flex items-center justify-between
            ">

              <div>

                <p className="
                  text-xs
                  text-blue-600
                  dark:text-blue-400
                  font-semibold
                ">

                  ALLOCATION REVIEW

                </p>

                <h2 className="
                  text-lg
                  font-bold
                  mt-1
                  text-slate-900
                  dark:text-white
                ">

                  {selectedZone.name}

                </h2>

              </div>


              <button
                onClick={() => setShowReview(false)}
                className="
                  p-2
                  rounded-lg
                  hover:bg-[#E8F3FF]
                  dark:hover:bg-slate-800
                "
              >

                <X className="w-5 h-5" />

              </button>

            </div>


            {/* BODY */}

            <div className="p-5 space-y-3">

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


              <div className="
                p-3
                rounded-lg
                bg-yellow-50
                dark:bg-yellow-950/20
                border border-yellow-200
                dark:border-yellow-900/50
              ">

                <div className="flex gap-2">

                  <AlertTriangle className="
                    w-4 h-4
                    text-yellow-600
                    dark:text-yellow-400
                    mt-0.5
                    shrink-0
                  " />

                  <p className="
                    text-xs
                    text-yellow-700
                    dark:text-yellow-400
                  ">

                    Please verify the allocation before deploying
                    resources to the field.

                  </p>

                </div>

              </div>

            </div>


            {/* FOOTER */}

            <div className="
              px-5 py-4
              bg-[#E8F3FF]
              dark:bg-slate-800
              border-t border-[#C9E0F5]
              dark:border-slate-700
              flex justify-end
              gap-3
            ">

              <button
                onClick={() => setShowReview(false)}
                className="
                  px-4 py-2
                  rounded-lg
                  text-sm font-medium
                  border border-slate-300
                  dark:border-slate-700
                  hover:bg-white
                  dark:hover:bg-slate-900
                  transition
                "
              >

                Cancel

              </button>


              <button
                onClick={deployResources}
                className="
                  flex items-center gap-2
                  px-4 py-2
                  rounded-lg
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  text-sm font-semibold
                  transition
                "
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


/* =========================================================
   DEMAND CARD
========================================================= */

function DemandCard({
  icon,
  label,
  value,
  unit,
}) {

  return (

    <div className="
      border border-[#C9E0F5]
      dark:border-slate-700
      bg-[#E8F3FF]
      dark:bg-slate-800
      rounded-lg
      p-3.5
    ">

      <div className="flex items-center gap-3">

        <div className="
          w-9 h-9
          shrink-0
          rounded-lg
          bg-[#DCEEFF]
          dark:bg-blue-950/60
          flex items-center
          justify-center
          text-blue-600
          dark:text-blue-400
        ">

          <span className="[&>svg]:w-4 [&>svg]:h-4">

            {icon}

          </span>

        </div>


        <div className="min-w-0">

          <p className="text-xs text-slate-500 dark:text-slate-400">

            {label}

          </p>

          <p className="
            text-sm
            font-bold
            mt-0.5
            text-slate-900
            dark:text-white
          ">

            {value.toLocaleString()} {unit}

          </p>

        </div>

      </div>

    </div>

  )
}


/* =========================================================
   RESOURCE CONTROL
========================================================= */

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

    <div className="
      border border-[#C9E0F5]
      dark:border-slate-700
      bg-[#E8F3FF]
      dark:bg-slate-800
      rounded-lg
      p-4
    ">

      <div className="
        flex flex-col
        sm:flex-row
        sm:items-center
        gap-4
      ">

        {/* ICON */}

        <div className="
          w-10 h-10
          shrink-0
          rounded-lg
          bg-[#DCEEFF]
          dark:bg-blue-950/60
          flex items-center
          justify-center
          text-blue-600
          dark:text-blue-400
        ">

          <span className="[&>svg]:w-5 [&>svg]:h-5">

            {icon}

          </span>

        </div>


        {/* INFO */}

        <div className="flex-1 min-w-0">

          <p className="
            text-sm
            font-semibold
            text-slate-900
            dark:text-white
          ">

            {label}

          </p>

          <p className="text-xs text-slate-400 mt-0.5">

            Available: {available.toLocaleString()} {unit}

          </p>

        </div>


        {/* CONTROLS */}

        <div className="
          flex items-center gap-2
          self-start
          sm:self-center
        ">

          <button
            onClick={onDecrease}
            className="
              w-9 h-9
              rounded-md
              border border-[#C9E0F5]
              dark:border-slate-600
              flex items-center
              justify-center
              text-slate-600
              dark:text-slate-300
              hover:bg-white
              dark:hover:bg-slate-700
              transition
            "
          >

            <Minus className="w-4 h-4" />

          </button>


          <div className="w-20 text-center">

            <p className="
              font-bold
              text-sm
              text-slate-900
              dark:text-white
            ">

              {value.toLocaleString()}

            </p>

            <p className="text-[10px] text-slate-400">

              {unit}

            </p>

          </div>


          <button
            onClick={onIncrease}
            className="
              w-9 h-9
              rounded-md
              border border-[#C9E0F5]
              dark:border-slate-600
              flex items-center
              justify-center
              text-slate-600
              dark:text-slate-300
              hover:bg-white
              dark:hover:bg-slate-700
              transition
            "
          >

            <Plus className="w-4 h-4" />

          </button>

        </div>

      </div>


      {/* PROGRESS */}

      <div className="mt-3">

        <div className="
          flex items-center justify-between
          text-[10px]
          text-slate-400
          mb-1
        ">

          <span>Allocation</span>

          <span>{percentage}%</span>

        </div>


        <div className="
          h-1.5
          rounded-full
          bg-slate-200
          dark:bg-slate-700
          overflow-hidden
        ">

          <div
            className="
              h-full
              bg-blue-500
              rounded-full
              transition-all
              duration-300
            "
            style={{
              width: `${percentage}%`,
            }}
          />

        </div>

      </div>

    </div>

  )
}


/* =========================================================
   RECOMMENDATION ROW
========================================================= */

function RecommendationRow({
  label,
  value,
  unit,
}) {

  return (

    <div className="
      flex
      items-center
      justify-between
      gap-4
      py-2.5
    ">

      <span className="text-sm text-slate-600 dark:text-slate-300">

        {label}

      </span>

      <span className="
        text-sm
        font-bold
        text-right
        text-slate-900
        dark:text-white
      ">

        {value.toLocaleString()} {unit}

      </span>

    </div>

  )
}


/* =========================================================
   REVIEW ROW
========================================================= */

function ReviewRow({
  label,
  value,
}) {

  return (

    <div className="
      flex
      items-center
      justify-between
      gap-4
      p-3
      rounded-lg
      bg-[#E8F3FF]
      dark:bg-slate-800
    ">

      <span className="text-sm text-slate-600 dark:text-slate-300">

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

  let style =
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"


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
      className={`
        px-2
        py-1
        rounded-full
        text-[10px]
        font-semibold
        whitespace-nowrap
        shrink-0
        ${style}
      `}
    >

      {severity}

    </span>

  )
}


export default AIDemand