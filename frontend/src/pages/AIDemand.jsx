import { useEffect, useMemo, useState } from "react"

import {
  BrainCircuit,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck,
  ChevronRight,
  ChevronLeft,
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
  Loader2,
} from "lucide-react"


// =========================================================
// BACKEND
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000"


// =========================================================
// HELPERS
// =========================================================

function getSeverityFromScore(score) {
  const value = Number(score || 0)

  if (value >= 8) return "Critical"
  if (value >= 6) return "High"
  if (value >= 4) return "Medium"
  if (value >= 1) return "Low"

  return "Not rated"
}


function getSeverityFromDisaster(disaster, zone) {

  // Prefer disaster severity if the backend provides it.
  const disasterSeverity =
    disaster?.severity ??
    disaster?.severity_score ??
    disaster?.severityScore

  if (typeof disasterSeverity === "string") {
    const normalized = disasterSeverity.toLowerCase()

    if (normalized.includes("critical")) return "Critical"
    if (normalized.includes("high")) return "High"
    if (normalized.includes("medium")) return "Medium"
    if (normalized.includes("low")) return "Low"
  }

  if (disasterSeverity !== undefined && disasterSeverity !== null) {
    return getSeverityFromScore(disasterSeverity)
  }

  // Otherwise use the zone's actual severity score.
  return getSeverityFromScore(zone?.severity_score)
}


function getZoneIdFromDisaster(disaster) {
  return (
    disaster?.zone_id ??
    disaster?.zoneId ??
    disaster?.zone?.id ??
    disaster?.zone?.zone_id ??
    null
  )
}


function getLatestDisasterForZone(zone, disasters) {

  const zoneId = Number(zone.id)

  const matching = disasters.filter((disaster) => {
    const disasterZoneId = getZoneIdFromDisaster(disaster)

    return (
      disasterZoneId !== null &&
      Number(disasterZoneId) === zoneId
    )
  })

  if (matching.length === 0) {
    return null
  }

  // Same logic as your backend:
  // latest disaster is the highest ID.
  return matching.sort(
    (a, b) => Number(b.id || 0) - Number(a.id || 0)
  )[0]
}


function getSeverityStyle(severity) {

  if (severity === "Critical") {
    return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
  }

  if (severity === "High") {
    return "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400"
  }

  if (severity === "Medium") {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400"
  }

  if (severity === "Low") {
    return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
  }

  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
}


function formatNumber(value) {

  const number = Number(value)

  if (!Number.isFinite(number)) {
    return "—"
  }

  return number.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })
}


function getPrediction(predictedDemand, key) {
  return Number(
    predictedDemand?.[key]?.predicted ?? 0
  )
}


function getConfidenceInterval(predictedDemand, key) {

  const interval =
    predictedDemand?.[key]?.confidence_interval

  if (!interval) {
    return null
  }

  return {
    lower: Number(interval.lower ?? 0),
    upper: Number(interval.upper ?? 0),
  }
}


function getIntervalText(predictedDemand, key, unit) {

  const interval = getConfidenceInterval(
    predictedDemand,
    key
  )

  if (!interval) {
    return "Prediction interval unavailable"
  }

  return `${formatNumber(interval.lower)} – ${formatNumber(interval.upper)} ${unit}`
}


// =========================================================
// MAIN COMPONENT
// =========================================================

function AIDemand() {

  // =======================================================
  // ZONE / BACKEND STATE
  // =======================================================

  const [affectedZones, setAffectedZones] = useState([])

  const [selectedIndex, setSelectedIndex] = useState(0)

  const [demandData, setDemandData] = useState(null)

  const [loadingZones, setLoadingZones] = useState(true)

  const [loadingDemand, setLoadingDemand] = useState(false)

  const [error, setError] = useState("")


  // =======================================================
  // UI STATE
  // =======================================================

  const [showReview, setShowReview] = useState(false)

  const [deployed, setDeployed] = useState(false)


  // =======================================================
  // FETCH ZONES + DISASTERS
  // =======================================================

  useEffect(() => {

    let cancelled = false

    async function loadAffectedZones() {

      try {

        setLoadingZones(true)
        setError("")

        const [zonesResponse, disastersResponse] =
          await Promise.all([
            fetch(`${API_BASE_URL}/zones/`),
            fetch(`${API_BASE_URL}/disasters`),
          ])


        if (!zonesResponse.ok) {
          throw new Error(
            `Failed to fetch zones (${zonesResponse.status})`
          )
        }


        if (!disastersResponse.ok) {
          throw new Error(
            `Failed to fetch disasters (${disastersResponse.status})`
          )
        }


        const zonesData = await zonesResponse.json()

        const disastersData = await disastersResponse.json()


        const zones = Array.isArray(zonesData)
          ? zonesData
          : zonesData?.zones || []


        const disasters = Array.isArray(disastersData)
          ? disastersData
          : disastersData?.disasters || []


        // -------------------------------------------------
        // IMPORTANT:
        // Only keep zones that actually have a disaster.
        // -------------------------------------------------

        const affected = zones
          .map((zone) => {

            const disaster =
              getLatestDisasterForZone(
                zone,
                disasters
              )

            if (!disaster) {
              return null
            }


            return {
              ...zone,
              disaster,
              severity: getSeverityFromDisaster(
                disaster,
                zone
              ),
            }

          })
          .filter(Boolean)


        if (cancelled) return


        setAffectedZones(affected)

        setSelectedIndex((currentIndex) => {

          if (affected.length === 0) {
            return 0
          }

          return Math.min(
            currentIndex,
            affected.length - 1
          )

        })

      } catch (err) {

        if (cancelled) return

        console.error(
          "Failed to load affected zones:",
          err
        )

        setError(
          err.message ||
          "Unable to load affected zones."
        )

      } finally {

        if (!cancelled) {
          setLoadingZones(false)
        }

      }

    }


    loadAffectedZones()


    return () => {
      cancelled = true
    }

  }, [])


  // =======================================================
  // SELECTED ZONE
  // =======================================================

  const selectedZone =
    affectedZones[selectedIndex] || null


  // =======================================================
  // FETCH REAL AI DEMAND
  // =======================================================

  useEffect(() => {

    let cancelled = false


    async function loadDemand() {

      if (!selectedZone?.id) {

        setDemandData(null)

        return

      }


      try {

        setLoadingDemand(true)

        setError("")

        const response = await fetch(
          `${API_BASE_URL}/demand/${selectedZone.id}`
        )


        const data = await response.json()


        if (!response.ok) {

          throw new Error(
            data?.detail ||
            `Failed to fetch demand (${response.status})`
          )

        }


        if (cancelled) return


        setDemandData(data)

      } catch (err) {

        if (cancelled) return

        console.error(
          "Failed to load demand:",
          err
        )

        setDemandData(null)

        setError(
          err.message ||
          "Unable to load AI demand prediction."
        )

      } finally {

        if (!cancelled) {
          setLoadingDemand(false)
        }

      }

    }


    loadDemand()


    return () => {
      cancelled = true
    }

  }, [selectedZone?.id])


  // =======================================================
  // REAL PREDICTIONS
  // =======================================================

  const predictedDemand =
    demandData?.predicted_demand || {}


  const waterPrediction =
    getPrediction(
      predictedDemand,
      "water_liters"
    )


  const foodPrediction =
    getPrediction(
      predictedDemand,
      "food_packets"
    )


  const medicalPrediction =
    getPrediction(
      predictedDemand,
      "medical_kits"
    )


  const shelterPrediction =
    getPrediction(
      predictedDemand,
      "shelter_capacity"
    )


  // =======================================================
  // RESOURCE STATE
  // =======================================================

  const [resources, setResources] = useState({
    water: 0,
    food: 0,
    medical: 0,
    shelter: 0,
  })


  // =======================================================
  // WHEN NEW REAL DEMAND ARRIVES
  // =======================================================

  useEffect(() => {

    if (!demandData?.predicted_demand) {
      return
    }


    setResources({

      water: waterPrediction,

      food: foodPrediction,

      medical: medicalPrediction,

      shelter: shelterPrediction,

    })


    setDeployed(false)

  }, [
    demandData,
    waterPrediction,
    foodPrediction,
    medicalPrediction,
    shelterPrediction,
  ])


  // =======================================================
  // TOTAL ALLOCATION
  // =======================================================

  const totalAllocated = useMemo(() => {

    return Object.values(resources).reduce(
      (total, value) =>
        total + Number(value || 0),
      0
    )

  }, [resources])


  // =======================================================
  // NAVIGATION
  // =======================================================

  function goPrevious() {

    if (affectedZones.length === 0) {
      return
    }

    setSelectedIndex((current) => {

      if (current === 0) {
        return affectedZones.length - 1
      }

      return current - 1

    })

    setShowReview(false)
    setDeployed(false)

  }


  function goNext() {

    if (affectedZones.length === 0) {
      return
    }

    setSelectedIndex((current) => {

      if (current === affectedZones.length - 1) {
        return 0
      }

      return current + 1

    })

    setShowReview(false)
    setDeployed(false)

  }


  // =======================================================
  // UPDATE RESOURCE
  // =======================================================

  function updateResource(resource, amount) {

    setResources((current) => {

      const currentValue =
        Number(current[resource] || 0)

      const newValue =
        currentValue + amount


      if (newValue < 0) {
        return current
      }


      return {
        ...current,
        [resource]: newValue,
      }

    })


    setDeployed(false)

  }


  // =======================================================
  // RESET
  // =======================================================

  function resetAllocation() {

    if (!demandData?.predicted_demand) {
      return
    }


    setResources({

      water: waterPrediction,

      food: foodPrediction,

      medical: medicalPrediction,

      shelter: shelterPrediction,

    })


    setDeployed(false)

  }


  // =======================================================
  // DEPLOY
  // =======================================================

  function deployResources() {

    /*
      IMPORTANT:

      This button currently represents the UI review/deployment
      state only.

      Your actual allocation backend flow is separate:
      AI Demand
          ↓
      /allocation/optimize
          ↓
      Request
          ↓
      Approve
          ↓
      Complete
          ↓
      Mission

      We are NOT pretending this button has already called
      the allocation backend.
    */

    setDeployed(true)

    setShowReview(false)

  }


  // =======================================================
  // LOADING
  // =======================================================

  if (loadingZones) {

    return (

      <div className="
        w-full
        max-w-none
        min-h-[400px]
        flex
        items-center
        justify-center
      ">

        <div className="
          flex
          items-center
          gap-3
          text-sm
          text-slate-500
          dark:text-slate-400
        ">

          <Loader2 className="w-5 h-5 animate-spin" />

          Loading affected zones...

        </div>

      </div>

    )

  }


  // =======================================================
  // NO AFFECTED ZONES
  // =======================================================

  if (affectedZones.length === 0) {

    return (

      <div className="w-full max-w-none space-y-5">

        <div>

          <div className="
            flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-blue-600
            dark:text-blue-400
          ">

            <BrainCircuit className="w-4 h-4" />

            AI-Powered Resource Planning

          </div>


          <h1 className="
            text-2xl
            lg:text-3xl
            font-bold
            text-slate-900
            dark:text-white
            mt-1
          ">

            AI Demand & Allocation

          </h1>


          <p className="
            text-sm
            text-slate-500
            dark:text-slate-400
            mt-1
          ">

            Predict emergency resource demand and review allocations
            for affected disaster zones.

          </p>

        </div>


        <div className="
          rounded-xl
          border
          border-yellow-200
          dark:border-yellow-900/50
          bg-yellow-50
          dark:bg-yellow-950/20
          p-6
        ">

          <div className="flex items-start gap-3">

            <AlertTriangle className="
              w-5
              h-5
              text-yellow-600
              dark:text-yellow-400
              mt-0.5
              shrink-0
            " />


            <div>

              <p className="
                text-sm
                font-semibold
                text-yellow-800
                dark:text-yellow-300
              ">

                No affected zones found

              </p>


              <p className="
                text-xs
                mt-1
                text-yellow-700
                dark:text-yellow-400
              ">

                The backend returned zones, but none of them currently
                have a disaster assigned through the disasters endpoint.

              </p>

            </div>

          </div>

        </div>

      </div>

    )

  }


  // =======================================================
  // MAIN UI
  // =======================================================

  return (

    <div className="w-full max-w-none space-y-5">


      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        sm:justify-between
        gap-4
      ">

        <div>

          <div className="
            flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-blue-600
            dark:text-blue-400
          ">

            <BrainCircuit className="w-4 h-4" />

            AI-Powered Resource Planning

          </div>


          <h1 className="
            text-2xl
            lg:text-3xl
            font-bold
            text-slate-900
            dark:text-white
            mt-1
          ">

            AI Demand & Allocation

          </h1>


          <p className="
            text-sm
            text-slate-500
            dark:text-slate-400
            mt-1
          ">

            Predict emergency resource demand and review allocations
            for affected disaster zones.

          </p>

        </div>


        {/* AI ENGINE STATUS */}

        <div className="
          flex
          items-center
          gap-2
          px-4
          py-2.5
          rounded-lg
          border
          border-[#C9E0F5]
          dark:border-slate-700
          bg-[#F2F8FF]
          dark:bg-slate-900
          shrink-0
        ">

          <span className="
            w-2.5
            h-2.5
            rounded-full
            bg-green-500
          " />


          <span className="
            text-sm
            font-medium
            text-slate-700
            dark:text-slate-200
          ">

            AI Engine Ready

          </span>

        </div>

      </div>


      {/* ===================================================
          AFFECTED ZONES SLIDER
          ONLY THIS CARD IS MADE NARROWER
      =================================================== */}

      <div className="
        bg-[#F2F8FF]
        dark:bg-slate-900
        border
        border-[#C9E0F5]
        dark:border-slate-700
        rounded-xl
        overflow-hidden
      ">

        {/* HEADER */}

        <div className="
          px-5
          py-4
          border-b
          border-[#D6E7F6]
          dark:border-slate-700
        ">

          <div className="
            flex
            items-center
            justify-between
          ">

            <div>

              <h2 className="
                font-semibold
                text-sm
                text-slate-900
                dark:text-white
              ">

                Affected Zones

              </h2>


              <p className="
                text-xs
                text-slate-500
                dark:text-slate-400
                mt-1
              ">

                Browse disaster zones to view AI demand prediction

              </p>

            </div>


            <span className="
              text-xs
              font-semibold
              px-2
              py-1
              rounded-md
              bg-[#E8F3FF]
              text-blue-600
              dark:bg-blue-950/50
              dark:text-blue-400
            ">

              {affectedZones.length} zones

            </span>

          </div>

        </div>


        {/* SLIDER */}

        <div className="
          px-6
          py-6
        ">

          <div className="
            flex
            items-center
            justify-center
            gap-3
          ">


            {/* PREVIOUS */}

            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous affected zone"
              className="
                w-11
                h-11
                shrink-0
                rounded-lg
                border
                border-[#C9E0F5]
                dark:border-slate-700
                bg-[#E8F3FF]
                dark:bg-slate-800
                flex
                items-center
                justify-center
                text-slate-700
                dark:text-slate-200
                hover:bg-white
                dark:hover:bg-slate-700
                transition
              "
            >

              <ChevronLeft className="w-5 h-5" />

            </button>


            {/* ============================================
                NARROWER AFFECTED ZONE CARD

                max-w-5xl ONLY applies to this card.
                Other cards below are unchanged.
            ============================================ */}

            <div className="
              w-full
              max-w-5xl
              rounded-xl
              border
              border-[#2B8A78]
              bg-[#D8F1EA]
              dark:bg-emerald-950/30
              dark:border-emerald-700
              px-5
              py-4
            ">

              <div className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
              ">


                {/* LEFT */}

                <div className="
                  flex
                  items-center
                  gap-3
                  min-w-0
                ">

                  <div className="
                    w-12
                    h-12
                    shrink-0
                    rounded-lg
                    bg-white/80
                    dark:bg-slate-900/70
                    flex
                    items-center
                    justify-center
                  ">

                    <MapPin className="
                      w-6
                      h-6
                      text-[#278A76]
                      dark:text-emerald-400
                    " />

                  </div>


                  <div className="min-w-0">

                    <div className="
                      flex
                      items-center
                      gap-2
                      flex-wrap
                    ">

                      <p className="
                        text-lg
                        font-bold
                        text-slate-900
                        dark:text-white
                        truncate
                      ">

                        {selectedZone.zone_name}

                      </p>


                      <SeverityBadge
                        severity={selectedZone.severity}
                      />

                    </div>


                    <p className="
                      text-xs
                      text-slate-600
                      dark:text-slate-400
                      mt-1
                    ">

                      Zone ID: {selectedZone.id}

                    </p>

                  </div>

                </div>


                {/* RIGHT */}

                <div className="
                  flex
                  items-center
                  gap-8
                  shrink-0
                ">

                  <div>

                    <p className="
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    ">

                      Population

                    </p>

                    <p className="
                      text-sm
                      font-bold
                      text-slate-900
                      dark:text-white
                      mt-1
                    ">

                      {formatNumber(
                        selectedZone.estimated_population
                      )}

                    </p>

                  </div>


                  <div>

                    <p className="
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    ">

                      Damage

                    </p>

                    <p className="
                      text-sm
                      font-bold
                      text-slate-900
                      dark:text-white
                      mt-1
                    ">

                      {Number(
                        selectedZone.damage_percent || 0
                      ).toFixed(1)}%

                    </p>

                  </div>

                </div>

              </div>

            </div>


            {/* NEXT */}

            <button
              type="button"
              onClick={goNext}
              aria-label="Next affected zone"
              className="
                w-11
                h-11
                shrink-0
                rounded-lg
                border
                border-[#C9E0F5]
                dark:border-slate-700
                bg-[#E8F3FF]
                dark:bg-slate-800
                flex
                items-center
                justify-center
                text-slate-700
                dark:text-slate-200
                hover:bg-white
                dark:hover:bg-slate-700
                transition
              "
            >

              <ChevronRight className="w-5 h-5" />

            </button>

          </div>


          {/* POSITION */}

          <div className="
            flex
            flex-col
            items-center
            mt-5
          ">

            <p className="
              text-xs
              text-slate-500
              dark:text-slate-400
            ">

              Zone {selectedIndex + 1} of {affectedZones.length}

            </p>


            <div className="
              flex
              items-center
              justify-center
              gap-2
              mt-2
              flex-wrap
            ">

              {affectedZones.map((zone, index) => (

                <button
                  key={zone.id}
                  type="button"
                  aria-label={`Go to ${zone.zone_name}`}
                  onClick={() => {
                    setSelectedIndex(index)
                    setShowReview(false)
                    setDeployed(false)
                  }}
                  className={`
                    h-2.5
                    rounded-full
                    transition-all
                    ${
                      index === selectedIndex
                        ? "w-7 bg-[#278A76]"
                        : "w-2.5 bg-slate-300 dark:bg-slate-600"
                    }
                  `}
                />

              ))}

            </div>

          </div>

        </div>

      </div>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (

        <div className="
          rounded-xl
          border
          border-red-200
          dark:border-red-900/50
          bg-red-50
          dark:bg-red-950/20
          p-4
        ">

          <div className="flex items-start gap-3">

            <AlertTriangle className="
              w-5
              h-5
              text-red-600
              dark:text-red-400
              shrink-0
            " />

            <div>

              <p className="
                text-sm
                font-semibold
                text-red-800
                dark:text-red-300
              ">

                Unable to load AI demand

              </p>


              <p className="
                text-xs
                text-red-700
                dark:text-red-400
                mt-1
              ">

                {error}

              </p>

            </div>

          </div>

        </div>

      )}


      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="
        grid
        grid-cols-1
        2xl:grid-cols-[minmax(0,1fr)_360px]
        gap-5
        items-start
      ">


        {/* =================================================
            LEFT
        ================================================= */}

        <div className="min-w-0 space-y-5">


          {/* =================================================
              SELECTED ZONE + AI DEMAND
          ================================================= */}

          <div className="
            bg-[#F2F8FF]
            dark:bg-slate-900
            border
            border-[#C9E0F5]
            dark:border-slate-700
            rounded-xl
            overflow-hidden
          ">

            {/* HEADER */}

            <div className="
              px-5
              py-4
              border-b
              border-[#D6E7F6]
              dark:border-slate-700
            ">

              <div className="
                flex
                items-center
                justify-between
                gap-4
              ">

                <div className="min-w-0">

                  <div className="
                    flex
                    items-center
                    gap-2
                    flex-wrap
                  ">

                    <MapPin className="
                      w-4
                      h-4
                      text-blue-600
                      dark:text-blue-400
                    " />


                    <h2 className="
                      font-semibold
                      text-slate-900
                      dark:text-white
                    ">

                      {selectedZone.zone_name}

                    </h2>


                    <SeverityBadge
                      severity={selectedZone.severity}
                    />

                  </div>


                  <p className="
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                    mt-1
                  ">

                    Disaster:{" "}

                    {demandData?.disaster_type ||
                      selectedZone.disaster?.disaster_type ||
                      "Assigned"}

                  </p>

                </div>


                <button
                  type="button"
                  onClick={resetAllocation}
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-xs
                    font-medium
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
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-3
                mb-4
              ">

                <div>

                  <h3 className="
                    text-sm
                    font-semibold
                    text-slate-900
                    dark:text-white
                  ">

                    AI Demand Prediction

                  </h3>


                  <p className="
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                    mt-1
                  ">

                    Estimated emergency requirements from the demand
                    prediction service

                  </p>

                </div>


                {loadingDemand ? (

                  <div className="
                    flex
                    items-center
                    gap-1.5
                    text-xs
                    font-semibold
                    text-blue-600
                    dark:text-blue-400
                  ">

                    <Loader2 className="
                      w-4
                      h-4
                      animate-spin
                    " />

                    Loading prediction...

                  </div>

                ) : demandData ? (

                  <div className="
                    flex
                    items-center
                    gap-1.5
                    text-xs
                    font-semibold
                    text-green-600
                    dark:text-green-400
                  ">

                    <CheckCircle2 className="w-4 h-4" />

                    Prediction available

                  </div>

                ) : null}

              </div>


              {loadingDemand ? (

                <div className="
                  min-h-[150px]
                  flex
                  items-center
                  justify-center
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <Loader2 className="
                      w-5
                      h-5
                      animate-spin
                    " />

                    Fetching AI demand...

                  </div>

                </div>

              ) : demandData ? (

                <div className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  lg:grid-cols-4
                  gap-3
                ">

                  <DemandCard
                    icon={<Droplets />}
                    label="Water"
                    value={waterPrediction}
                    unit="L"
                    interval={getIntervalText(
                      predictedDemand,
                      "water_liters",
                      "L"
                    )}
                  />


                  <DemandCard
                    icon={<Boxes />}
                    label="Food"
                    value={foodPrediction}
                    unit="packets"
                    interval={getIntervalText(
                      predictedDemand,
                      "food_packets",
                      "packets"
                    )}
                  />


                  <DemandCard
                    icon={<HeartPulse />}
                    label="Medical"
                    value={medicalPrediction}
                    unit="kits"
                    interval={getIntervalText(
                      predictedDemand,
                      "medical_kits",
                      "kits"
                    )}
                  />


                  <DemandCard
                    icon={<Tent />}
                    label="Shelter"
                    value={shelterPrediction}
                    unit="capacity"
                    interval={getIntervalText(
                      predictedDemand,
                      "shelter_capacity",
                      "people"
                    )}
                  />

                </div>

              ) : (

                <div className="
                  rounded-lg
                  border
                  border-yellow-200
                  dark:border-yellow-900/50
                  bg-yellow-50
                  dark:bg-yellow-950/20
                  p-4
                ">

                  <div className="flex items-start gap-3">

                    <AlertTriangle className="
                      w-5
                      h-5
                      text-yellow-600
                      dark:text-yellow-400
                    " />

                    <p className="
                      text-sm
                      text-yellow-700
                      dark:text-yellow-400
                    ">

                      AI demand prediction is currently unavailable.

                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>


          {/* =================================================
              RESOURCE ALLOCATION
          ================================================= */}

          <div className="
            bg-[#F2F8FF]
            dark:bg-slate-900
            border
            border-[#C9E0F5]
            dark:border-slate-700
            rounded-xl
            overflow-hidden
          ">

            <div className="
              px-5
              py-4
              border-b
              border-[#D6E7F6]
              dark:border-slate-700
            ">

              <h3 className="
                text-sm
                font-semibold
                text-slate-900
                dark:text-white
              ">

                Resource Allocation

              </h3>


              <p className="
                text-xs
                text-slate-500
                dark:text-slate-400
                mt-1
              ">

                Adjust the AI recommendation if required

              </p>

            </div>


            <div className="p-5 space-y-3">

              <ResourceControl
                icon={<Droplets />}
                label="Water"
                unit="liters"
                value={resources.water}
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
              mx-5
              mb-5
              p-4
              rounded-lg
              bg-[#E8F3FF]
              dark:bg-blue-950/50
              border
              border-[#C9E0F5]
              dark:border-blue-900
            ">

              <div className="
                flex
                items-center
                justify-between
              ">

                <div>

                  <p className="
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  ">

                    Total allocated units

                  </p>


                  <p className="
                    text-2xl
                    font-bold
                    mt-1
                    text-slate-900
                    dark:text-white
                  ">

                    {formatNumber(totalAllocated)}

                  </p>

                </div>


                <Package className="
                  w-7
                  h-7
                  text-blue-600
                  dark:text-blue-400
                " />

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            RIGHT SIDEBAR
        ================================================= */}

        <div className="min-w-0 space-y-5">


          {/* =================================================
              AI RECOMMENDATION
          ================================================= */}

          <div className="
            bg-[#F2F8FF]
            dark:bg-slate-900
            border
            border-[#C9E0F5]
            dark:border-slate-700
            rounded-xl
            overflow-hidden
          ">

            <div className="
              px-5
              py-4
              border-b
              border-[#D6E7F6]
              dark:border-slate-700
            ">

              <div className="
                flex
                items-center
                gap-3
              ">

                <div className="
                  w-10
                  h-10
                  shrink-0
                  rounded-lg
                  bg-[#E8F3FF]
                  dark:bg-blue-950/50
                  flex
                  items-center
                  justify-center
                ">

                  <BrainCircuit className="
                    w-5
                    h-5
                    text-blue-600
                    dark:text-blue-400
                  " />

                </div>


                <div>

                  <h2 className="
                    font-semibold
                    text-slate-900
                    dark:text-white
                  ">

                    AI Recommendation

                  </h2>


                  <p className="
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                    mt-1
                  ">

                    Suggested allocation for this zone

                  </p>

                </div>

              </div>

            </div>


            <div className="p-5">


              {/* PRIORITY */}

              <div className="
                rounded-lg
                border
                border-[#C9E0F5]
                dark:border-blue-900
                bg-[#E8F3FF]
                dark:bg-blue-950/50
                p-4
              ">

                <div className="
                  flex
                  items-start
                  gap-3
                ">

                  <ShieldAlert className="
                    w-5
                    h-5
                    text-blue-600
                    dark:text-blue-400
                    shrink-0
                    mt-0.5
                  " />


                  <div>

                    <p className="
                      text-sm
                      font-semibold
                      text-slate-900
                      dark:text-white
                    ">

                      Priority: {selectedZone.severity}

                    </p>


                    <p className="
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                      mt-1
                      leading-relaxed
                    ">

                      Based on the zone severity score, population
                      and current damage percentage.

                    </p>

                  </div>

                </div>

              </div>


              {/* VALUES */}

              <div className="mt-5 space-y-1">

                <RecommendationRow
                  label="Water"
                  value={waterPrediction}
                  unit="L"
                />


                <RecommendationRow
                  label="Food"
                  value={foodPrediction}
                  unit="packets"
                />


                <RecommendationRow
                  label="Medical"
                  value={medicalPrediction}
                  unit="kits"
                />


                <RecommendationRow
                  label="Shelter"
                  value={shelterPrediction}
                  unit="capacity"
                />

              </div>


              {/* STATUS */}

              <div className="
                mt-4
                pt-4
                border-t
                border-[#D6E7F6]
                dark:border-slate-700
              ">

                <div className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-green-600
                  dark:text-green-400
                ">

                  <CheckCircle2 className="w-4 h-4" />

                  AI recommendation available

                </div>

              </div>


              {/* PREDICTION INTERVAL */}

              <div className="mt-4">

                <p className="
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                  mb-2
                ">

                  Model prediction interval

                </p>


                <div className="
                  space-y-1
                  text-[11px]
                  text-slate-600
                  dark:text-slate-300
                ">

                  <p>
                    Water:{" "}
                    {getIntervalText(
                      predictedDemand,
                      "water_liters",
                      "L"
                    )}
                  </p>

                  <p>
                    Food:{" "}
                    {getIntervalText(
                      predictedDemand,
                      "food_packets",
                      "packets"
                    )}
                  </p>

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
            border
            border-[#C9E0F5]
            dark:border-slate-700
            rounded-xl
            p-5
          ">

            <div className="
              flex
              items-center
              gap-3
            ">

              <div className="
                w-10
                h-10
                shrink-0
                rounded-lg
                bg-[#E8F3FF]
                dark:bg-blue-950/50
                flex
                items-center
                justify-center
              ">

                <Truck className="
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

                  Resource Planning

                </p>


                <p className="
                  text-sm
                  font-semibold
                  mt-1
                  text-slate-900
                  dark:text-white
                ">

                  Allocation Review

                </p>


                <p className="
                  text-xs
                  text-green-600
                  dark:text-green-400
                  mt-0.5
                ">

                  Ready for verification

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
            border
            border-[#C9E0F5]
            dark:border-slate-700
            rounded-xl
            p-5
          ">

            <div className="
              flex
              items-start
              gap-3
            ">

              <div className="
                w-10
                h-10
                shrink-0
                rounded-lg
                bg-orange-50
                dark:bg-orange-950/30
                flex
                items-center
                justify-center
              ">

                <AlertTriangle className="
                  w-5
                  h-5
                  text-orange-600
                  dark:text-orange-400
                " />

              </div>


              <div>

                <p className="
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                ">

                  Response Priority

                </p>


                <p className="
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                  mt-1
                  leading-relaxed
                ">

                  {selectedZone.severity} priority zone.
                  Resource deployment should be verified before
                  dispatching to the field.

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
        border
        border-[#C9E0F5]
        dark:border-slate-700
        rounded-xl
        p-5
      ">

        <div className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-4
        ">

          <div className="
            flex
            items-center
            gap-4
            min-w-0
          ">

            <div className="
              w-11
              h-11
              shrink-0
              rounded-lg
              bg-[#E8F3FF]
              dark:bg-blue-950/50
              flex
              items-center
              justify-center
            ">

              {deployed ? (

                <CheckCircle2 className="
                  w-5
                  h-5
                  text-green-600
                  dark:text-green-400
                " />

              ) : (

                <Send className="
                  w-5
                  h-5
                  text-blue-600
                  dark:text-blue-400
                " />

              )}

            </div>


            <div className="min-w-0">

              <p className="
                font-semibold
                text-slate-900
                dark:text-white
              ">

                {deployed
                  ? "Allocation reviewed successfully"
                  : `Ready to review resources for ${selectedZone.zone_name}`
                }

              </p>


              <p className="
                text-xs
                text-slate-500
                dark:text-slate-400
                mt-1
              ">

                {deployed
                  ? "The selected allocation is ready for the next allocation workflow."
                  : `${formatNumber(totalAllocated)} total resource units selected`
                }

              </p>

            </div>

          </div>


          <div className="
            flex
            items-center
            gap-3
            shrink-0
          ">

            {!deployed && (

              <button
                type="button"
                onClick={() => setShowReview(true)}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  border
                  border-slate-300
                  dark:border-slate-700
                  text-sm
                  font-semibold
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
                type="button"
                onClick={() => {
                  setDeployed(false)
                  resetAllocation()
                }}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  border
                  border-slate-300
                  dark:border-slate-700
                  text-sm
                  font-semibold
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
          fixed
          inset-0
          z-50
          bg-black/60
          flex
          items-center
          justify-center
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
              px-5
              py-4
              border-b
              border-[#D6E7F6]
              dark:border-slate-700
              flex
              items-center
              justify-between
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

                  {selectedZone.zone_name}

                </h2>

              </div>


              <button
                type="button"
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
                value={`${formatNumber(resources.water)} L`}
              />


              <ReviewRow
                label="Food Packets"
                value={formatNumber(resources.food)}
              />


              <ReviewRow
                label="Medical Kits"
                value={formatNumber(resources.medical)}
              />


              <ReviewRow
                label="Shelter Capacity"
                value={formatNumber(resources.shelter)}
              />


              <div className="
                p-3
                rounded-lg
                bg-yellow-50
                dark:bg-yellow-950/20
                border
                border-yellow-200
                dark:border-yellow-900/50
              ">

                <div className="flex gap-2">

                  <AlertTriangle className="
                    w-4
                    h-4
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
              px-5
              py-4
              bg-[#E8F3FF]
              dark:bg-slate-800
              border-t
              border-[#C9E0F5]
              dark:border-slate-700
              flex
              justify-end
              gap-3
            ">

              <button
                type="button"
                onClick={() => setShowReview(false)}
                className="
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                  font-medium
                  border
                  border-slate-300
                  dark:border-slate-700
                  hover:bg-white
                  dark:hover:bg-slate-900
                  transition
                "
              >

                Cancel

              </button>


              <button
                type="button"
                onClick={deployResources}
                className="
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-lg
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  text-sm
                  font-semibold
                  transition
                "
              >

                <Send className="w-4 h-4" />

                Confirm Review

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  )

}


// =========================================================
// DEMAND CARD
// =========================================================

function DemandCard({
  icon,
  label,
  value,
  unit,
  interval,
}) {

  return (

    <div className="
      border
      border-[#C9E0F5]
      dark:border-slate-700
      bg-[#E8F3FF]
      dark:bg-slate-800
      rounded-lg
      p-3.5
    ">

      <div className="
        flex
        items-center
        gap-3
      ">

        <div className="
          w-9
          h-9
          shrink-0
          rounded-lg
          bg-[#DCEEFF]
          dark:bg-blue-950/60
          flex
          items-center
          justify-center
          text-blue-600
          dark:text-blue-400
        ">

          <span className="
            [&>svg]:w-4
            [&>svg]:h-4
          ">

            {icon}

          </span>

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
            text-sm
            font-bold
            mt-0.5
            text-slate-900
            dark:text-white
          ">

            {formatNumber(value)} {unit}

          </p>

        </div>

      </div>


      <p className="
        text-[9px]
        text-slate-400
        dark:text-slate-500
        mt-2
        truncate
      ">

        CI: {interval}

      </p>

    </div>

  )

}


// =========================================================
// RESOURCE CONTROL
// =========================================================

function ResourceControl({
  icon,
  label,
  unit,
  value,
  onDecrease,
  onIncrease,
}) {

  return (

    <div className="
      border
      border-[#C9E0F5]
      dark:border-slate-700
      bg-[#E8F3FF]
      dark:bg-slate-800
      rounded-lg
      p-4
    ">

      <div className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        gap-4
      ">


        {/* ICON */}

        <div className="
          w-10
          h-10
          shrink-0
          rounded-lg
          bg-[#DCEEFF]
          dark:bg-blue-950/60
          flex
          items-center
          justify-center
          text-blue-600
          dark:text-blue-400
        ">

          <span className="
            [&>svg]:w-5
            [&>svg]:h-5
          ">

            {icon}

          </span>

        </div>


        {/* INFO */}

        <div className="
          flex-1
          min-w-0
        ">

          <p className="
            text-sm
            font-semibold
            text-slate-900
            dark:text-white
          ">

            {label}

          </p>


          <p className="
            text-xs
            text-slate-400
            mt-0.5
          ">

            AI recommended amount

          </p>

        </div>


        {/* CONTROLS */}

        <div className="
          flex
          items-center
          gap-2
          self-start
          sm:self-center
        ">

          <button
            type="button"
            onClick={onDecrease}
            className="
              w-9
              h-9
              rounded-md
              border
              border-[#C9E0F5]
              dark:border-slate-600
              flex
              items-center
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

              {formatNumber(value)}

            </p>


            <p className="
              text-[10px]
              text-slate-400
            ">

              {unit}

            </p>

          </div>


          <button
            type="button"
            onClick={onIncrease}
            className="
              w-9
              h-9
              rounded-md
              border
              border-[#C9E0F5]
              dark:border-slate-600
              flex
              items-center
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


      {/* ALLOCATION BAR */}

      <div className="mt-3">

        <div className="
          flex
          items-center
          justify-between
          text-[10px]
          text-slate-400
          mb-1
        ">

          <span>Selected</span>

          <span>{formatNumber(value)} {unit}</span>

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
              width: "100%",
            }}
          />

        </div>

      </div>

    </div>

  )

}


// =========================================================
// RECOMMENDATION ROW
// =========================================================

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

      <span className="
        text-sm
        text-slate-600
        dark:text-slate-300
      ">

        {label}

      </span>


      <span className="
        text-sm
        font-bold
        text-right
        text-slate-900
        dark:text-white
      ">

        {formatNumber(value)} {unit}

      </span>

    </div>

  )

}


// =========================================================
// REVIEW ROW
// =========================================================

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

      <span className="
        text-sm
        text-slate-600
        dark:text-slate-300
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


// =========================================================
// SEVERITY BADGE
// =========================================================

function SeverityBadge({
  severity,
}) {

  return (

    <span className={`
      px-2
      py-1
      rounded-full
      text-[10px]
      font-semibold
      whitespace-nowrap
      shrink-0
      ${getSeverityStyle(severity)}
    `}>

      {severity}

    </span>

  )

}


export default AIDemand