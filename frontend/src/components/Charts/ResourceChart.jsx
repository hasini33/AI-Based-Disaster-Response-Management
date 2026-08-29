import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { getDisasters } from "../../services/disasterService"

const API_BASE_URL = "http://127.0.0.1:8000"

const RESOURCE_CONFIG = [
  {
    key: "food_packets",
    name: "Food",
    unit: "packets",
    color: "#288b83",
  },
  {
    key: "water_liters",
    name: "Water",
    unit: "liters",
    color: "#d99a2b",
  },
  {
    key: "medical_kits",
    name: "Medical",
    unit: "kits",
    color: "#d65b4f",
  },
  {
    key: "shelter_capacity",
    name: "Shelter",
    unit: "people",
    color: "#8170bf",
  },
]

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  const item = entry.payload

  return (
    <div className="rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--surface))] px-3 py-2 shadow-xl shadow-[hsl(var(--shadow)/.12)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--ink-soft))]">
        {item.name} demand
      </p>

      <p className="mono mt-1 text-sm font-bold text-[hsl(var(--foreground))]">
        {Number(item.units).toLocaleString()} {item.unit}
      </p>

      {item.zoneCount > 1 && (
        <p className="mt-1 text-[9px] text-[hsl(var(--ink-faint))]">
          Combined across {item.zoneCount} zones
        </p>
      )}

      {item.lower != null && item.upper != null && (
        <p className="mono mt-1 text-[9px] text-[hsl(var(--ink-faint))]">
          Range: {Number(item.lower).toLocaleString()} –{" "}
          {Number(item.upper).toLocaleString()}
        </p>
      )}
    </div>
  )
}

function ResourceChart() {
  const [disasters, setDisasters] = useState([])
  const [demandResults, setDemandResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // --------------------------------------------------
  // LOAD DISASTERS AND THEIR ZONE DEMAND
  // --------------------------------------------------

  useEffect(() => {
    async function loadDemand() {
      try {
        setLoading(true)
        setError("")

        // Get current disasters
        const disasterData = await getDisasters()

        const disasterList = Array.isArray(disasterData)
          ? disasterData
          : []

        setDisasters(disasterList)

        // --------------------------------------------------
        // Get unique zones that currently have disasters
        // --------------------------------------------------

        const zoneIds = [
          ...new Set(
            disasterList
              .map((disaster) => disaster.zone_id)
              .filter(
                (zoneId) =>
                  zoneId !== null &&
                  zoneId !== undefined &&
                  Number.isFinite(Number(zoneId))
              )
              .map(Number)
          ),
        ]

        if (zoneIds.length === 0) {
          setDemandResults([])
          return
        }

        // --------------------------------------------------
        // Call the ML demand endpoint for every affected zone
        // --------------------------------------------------

        const results = await Promise.all(
          zoneIds.map(async (zoneId) => {
            const response = await fetch(
              `${API_BASE_URL}/demand/${zoneId}`
            )

            if (!response.ok) {
              throw new Error(
                `Demand request failed for zone ${zoneId}`
              )
            }

            return response.json()
          })
        )

        setDemandResults(results)

        console.log(
          "ML demand results:",
          results
        )
      } catch (err) {
        console.error(
          "Failed to load ML demand:",
          err
        )

        setError(
          "Unable to load AI-generated demand."
        )
      } finally {
        setLoading(false)
      }
    }

    loadDemand()
  }, [])

  // --------------------------------------------------
  // COMBINE ML PREDICTIONS FROM ALL AFFECTED ZONES
  // --------------------------------------------------

  const chartData = useMemo(() => {
    return RESOURCE_CONFIG.map((resource) => {
      let totalPredicted = 0
      let totalLower = 0
      let totalUpper = 0
      let zoneCount = 0

      demandResults.forEach((result) => {
        const prediction =
          result?.predicted_demand?.[resource.key]

        if (!prediction) return

        const predicted = Number(
          prediction.predicted || 0
        )

        const lower = Number(
          prediction.confidence_interval?.lower || 0
        )

        const upper = Number(
          prediction.confidence_interval?.upper || 0
        )

        totalPredicted += predicted
        totalLower += lower
        totalUpper += upper

        zoneCount += 1
      })

      return {
        name: resource.name,
        units: Math.round(totalPredicted),
        lower: Math.round(totalLower),
        upper: Math.round(totalUpper),
        unit: resource.unit,
        color: resource.color,
        zoneCount,
      }
    })
  }, [demandResults])

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-4 flex items-center gap-2">
          <span className="status-dot text-[hsl(var(--amber))]" />

          <span className="text-[10px] font-bold uppercase tracking-[.11em] text-[hsl(var(--ink-soft))]">
            AI-generated demand
          </span>
        </div>

        <div className="h-72 min-h-[250px] animate-pulse rounded-xl bg-[hsl(var(--surface-muted)/.55)]" />

        <p className="mono mt-3 text-right text-[9px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
          Running ML demand predictions...
        </p>
      </div>
    )
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--coral-soft))] text-[hsl(var(--coral))]">
          !
        </div>

        <p className="mt-4 text-sm font-extrabold text-[hsl(var(--foreground))]">
          AI demand unavailable
        </p>

        <p className="mt-2 max-w-sm text-[11px] leading-5 text-[hsl(var(--ink-soft))]">
          Make sure the FastAPI backend is running and
          that affected disasters are assigned to zones.
        </p>
      </div>
    )
  }

  // --------------------------------------------------
  // NO DATA
  // --------------------------------------------------

  const hasDemand =
    demandResults.length > 0 &&
    chartData.some((item) => item.units > 0)

  if (!hasDemand) {
    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--surface-muted))] text-[hsl(var(--ink-faint))]">
          —
        </div>

        <p className="mt-4 text-sm font-extrabold text-[hsl(var(--foreground))]">
          No demand prediction available
        </p>

        <p className="mt-2 max-w-sm text-[11px] leading-5 text-[hsl(var(--ink-soft))]">
          Current disasters need to be assigned to response
          zones before the ML demand model can generate predictions.
        </p>
      </div>
    )
  }

  // --------------------------------------------------
  // MAIN CHART
  // --------------------------------------------------

  return (
    <div className="w-full">

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-2">
          <span className="status-dot text-[hsl(var(--amber))]" />

          <span className="text-[10px] font-bold uppercase tracking-[.11em] text-[hsl(var(--ink-soft))]">
            AI-generated demand
          </span>
        </div>

        <div className="pill">
          ML prediction / live
        </div>

      </div>

      <div className="h-72 min-h-[250px] w-full">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <BarChart
            data={chartData}
            margin={{
              top: 8,
              right: 8,
              left: -14,
              bottom: 0,
            }}
            barCategoryGap="22%"
          >

            <CartesianGrid
              stroke="hsl(var(--line))"
              strokeOpacity={0.75}
              strokeDasharray="2 4"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 10,
                fill: "hsl(var(--ink-soft))",
                fontFamily: "Manrope",
              }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 9,
                fill: "hsl(var(--ink-faint))",
                fontFamily: "DM Mono",
              }}
              tickFormatter={(value) =>
                value >= 1000
                  ? `${(value / 1000).toFixed(0)}k`
                  : value
              }
              width={38}
            />

            <Tooltip
              content={<ChartTooltip />}
              cursor={{
                fill: "hsl(var(--teal) / .06)",
              }}
            />

            <Bar
              dataKey="units"
              radius={[7, 7, 2, 2]}
              animationDuration={550}
            >

              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                />
              ))}

            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">

        <p className="mono text-[9px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
          Source: FastAPI ML demand model
        </p>

        <p className="mono text-[9px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
          {demandResults.length} affected zone
          {demandResults.length !== 1 ? "s" : ""}
        </p>

      </div>

    </div>
  )
}

export default ResourceChart