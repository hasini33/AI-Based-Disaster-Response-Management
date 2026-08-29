import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Activity,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crosshair,
  HeartPulse,
  Home,
  Layers3,
  MapPin,
  Package,
  Radio,
  RefreshCw,
  ShieldAlert,
  Truck,
  TriangleAlert,
  Users,
  Zap,
} from "lucide-react"

import {
  getDisasters,
  getDisasterImpact,
} from "../../services/disasterService"

import StatCard from "../Cards/StatCard"
import ResourceChart from "../Charts/ResourceChart"
import DisasterMap from "../Map/DisasterMap"


const stats = [
  {
    title: "Active disasters",
    value: "12",
    description: "events requiring coordination",
    trendLabel: "+2",
    icon: TriangleAlert,
    tone: "coral",
  },
  {
    title: "Population exposed",
    value: "24,580",
    description: "people inside impact zones",
    trendLabel: "+8.4%",
    icon: Users,
    tone: "violet",
  },
  {
    title: "Response inventory",
    value: "156",
    description: "resource units ready to move",
    trendLabel: "82%",
    icon: Boxes,
    tone: "teal",
  },
  {
    title: "Critical zones",
    value: "05",
    description: "priority corridors need action",
    trendLabel: "watch",
    icon: Crosshair,
    tone: "amber",
    trend: "flat",
  },
]


const readiness = [
  {
    title: "Food supplies",
    value: 82,
    detail: "Adequate for current demand",
    icon: Package,
    tone: "teal",
  },
  {
    title: "Water supply",
    value: 68,
    detail: "Watch high-demand zones",
    icon: Activity,
    tone: "amber",
  },
  {
    title: "Medical kits",
    value: 54,
    detail: "Replenishment recommended",
    icon: HeartPulse,
    tone: "coral",
  },
  {
    title: "Shelter capacity",
    value: 73,
    detail: "Capacity currently available",
    icon: Home,
    tone: "violet",
  },
]


function Dashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlDisasterId = searchParams.get("disasterId")

  const [selectedDisasterId, setSelectedDisasterId] = useState(
    urlDisasterId ? Number(urlDisasterId) : null
  )

  const [selectedDisaster, setSelectedDisaster] = useState(null)
  const [selectedLoading, setSelectedLoading] = useState(false)
  const [selectedError, setSelectedError] = useState(false)
  const [alertAcknowledged, setAlertAcknowledged] = useState(false)


  /*
   * STEP 1
   *
   * If the user comes directly to Dashboard and there is
   * no disasterId in the URL, automatically select a disaster.
   *
   * We select the highest severity disaster so the dashboard
   * immediately shows the most important incident.
   */
  useEffect(() => {
    if (urlDisasterId) {
      setSelectedDisasterId(Number(urlDisasterId))
      return
    }

    const loadDefaultDisaster = async () => {
      try {
        const disasters = await getDisasters()

        if (!disasters || disasters.length === 0) {
          return
        }

        // Find the disaster with the highest severity
        const highestSeverityDisaster = [...disasters].sort(
          (a, b) => Number(b.severity || 0) - Number(a.severity || 0)
        )[0]

        if (highestSeverityDisaster?.id) {
          setSelectedDisasterId(Number(highestSeverityDisaster.id))

          // Keep the selected incident in the URL
          navigate(
            `/?disasterId=${highestSeverityDisaster.id}`,
            { replace: true }
          )
        }
      } catch (error) {
        console.error("Unable to load default disaster:", error)
      }
    }

    loadDefaultDisaster()
  }, [urlDisasterId, navigate])


  /*
   * STEP 2
   *
   * Once we have a selected disaster ID,
   * load its impact information.
   */
  const loadSelectedImpact = () => {
    if (!selectedDisasterId) {
      setSelectedDisaster(null)
      return
    }

    setSelectedLoading(true)
    setSelectedError(false)

    getDisasterImpact(Number(selectedDisasterId))
      .then((data) => {
        setSelectedDisaster(data)
      })
      .catch((error) => {
        console.error("Unable to load selected disaster:", error)
        setSelectedDisaster(null)
        setSelectedError(true)
      })
      .finally(() => {
        setSelectedLoading(false)
      })
  }


  useEffect(() => {
    loadSelectedImpact()
  }, [selectedDisasterId])


  return (
    <div className="page-enter space-y-6">

      {/* HEADER */}

      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>

          <div className="mb-3 flex items-center gap-2">
            <span className="status-dot status-dot--pulse text-[hsl(var(--teal))]" />

            <span className="eyebrow">
              Live response / operational overview
            </span>

            <ChevronRight
              size={13}
              className="text-[hsl(var(--ink-faint))]"
            />

          </div>

          <h1 className="max-w-3xl text-[clamp(2rem,4vw,3.7rem)] font-extrabold leading-[.98] tracking-[-.075em] text-[hsl(var(--foreground))]">
            Dashboard
            <span className="text-[hsl(var(--coral))]">.</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--ink-soft))]">
            A single operating picture for incident posture, population exposure
            and the resources.
          </p>  

        </div>

        <div className="flex flex-wrap items-center gap-2">

          <div className="pill pill--live">
            <span className="status-dot status-dot--pulse" />
            System nominal
          </div>

        </div>
      </section>


      {/* STAT CARDS */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            index={index}
          />
        ))}
      </section>


      {/* MAP + SELECTED INCIDENT */}

      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,.8fr)]">

        {/* MAP */}

        <article className="section-card">

          <div className="card-header">

            <div className="flex items-start gap-3">

              <div className="icon-chip">
                <MapPin size={18} />
              </div>

              <div>
                <p className="card-title">
                  Disaster impact map
                </p>

                <p className="card-subtitle">
                  Live incident locations, perimeters and selected impact geometry
                </p>
              </div>

            </div>

            <div className="hidden items-center gap-2 sm:flex">

              <span className="mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink))]">
                Layer / 01
              </span>

              <Radio
                size={16}
                className="text-[hsl(var(--teal))]"
              />

            </div>

          </div>

          <div className="p-3 sm:p-5">

            <DisasterMap
              selectedDisasterId={
                selectedDisasterId
                  ? Number(selectedDisasterId)
                  : null
              }
            />

          </div>

        </article>


        {/* SELECTED INCIDENT */}

        <article className="section-card flex flex-col">

          <div className="card-header">

            <div className="flex items-start gap-3">

              <div className="icon-chip icon-chip--alert">
                <ShieldAlert size={18} />
              </div>

              <div>

                <p className="card-title">
                  Selected incident
                </p>

                <p className="card-subtitle">
                  Impact record and response posture
                </p>

              </div>

            </div>

            <span className="mono text-[9px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
              {selectedDisasterId
                ? `ID ${selectedDisasterId}`
                : "AUTO FOCUS"}
            </span>

          </div>


          <div className="flex flex-1 flex-col p-5">

            {/* LOADING */}

            {selectedLoading ? (

              <div className="space-y-4">

                <div className="h-20 animate-pulse rounded-xl bg-[hsl(var(--surface-muted))]" />

                <div className="h-10 animate-pulse rounded-lg bg-[hsl(var(--surface-muted))]" />

                <div className="h-10 animate-pulse rounded-lg bg-[hsl(var(--surface-muted))]" />

                <div className="h-10 animate-pulse rounded-lg bg-[hsl(var(--surface-muted))]" />

              </div>

            ) : selectedError ? (

              /* ERROR */

              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">

                <TriangleAlert
                  size={22}
                  className="text-[hsl(var(--coral))]"
                />

                <p className="mt-3 text-sm font-bold text-[hsl(var(--foreground))]">
                  Impact record unavailable
                </p>

                <button
                  type="button"
                  data-testid="button-retry-selected-impact"
                  onClick={loadSelectedImpact}
                  className="mt-4 flex items-center gap-2 rounded-lg border border-[hsl(var(--line))] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-muted))]"
                >
                  <RefreshCw size={13} />
                  Try again
                </button>

              </div>

            ) : selectedDisaster ? (

              /* INCIDENT FOUND */

              <div className="flex flex-1 flex-col">

                <div className="rounded-xl border border-[hsl(var(--coral)/.2)] bg-[hsl(var(--coral-soft)/.7)] p-4">

                  <p className="eyebrow text-[hsl(var(--coral))]">
                    Current incident
                  </p>

                  <p className="mt-2 text-2xl font-extrabold tracking-[-.05em] text-[hsl(var(--foreground))]">
                    {selectedDisaster.disaster_type}
                  </p>

                  <div className="mt-3 flex items-center gap-2">

                    <span className="rounded-full bg-[hsl(var(--coral))] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[hsl(var(--surface))]">
                      Level {selectedDisaster.severity}
                    </span>

                    <span className="text-[10px] font-bold text-[hsl(var(--coral))]">
                      Immediate attention
                    </span>

                  </div>

                </div>


                <div className="mt-5 space-y-4">

                  <IncidentFact
                    icon={MapPin}
                    label="Coordinates"
                    value={`${selectedDisaster.latitude}, ${selectedDisaster.longitude}`}
                  />

                  <IncidentFact
                    icon={Layers3}
                    label="Impact radius"
                    value={`${selectedDisaster.impact_extent?.radius_km ?? "—"} km`}
                  />

                  <IncidentFact
                    icon={Crosshair}
                    label="Response zone"
                    value={
                      selectedDisaster.zone_name ||
                      "Not assigned"
                    }
                  />

                </div>


                <div className="mt-auto border-t border-[hsl(var(--line))] pt-4">

                  <div className="flex items-center justify-between">

                    <span className="mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink))]">
                      Record reference
                    </span>

                    <span className="mono text-[10px] font-medium text-[hsl(var(--foreground))]">
                      #{selectedDisaster.disaster_id}
                    </span>

                  </div>

                </div>

              </div>

            ) : (

              /* NO DATA */

              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--surface-muted))] text-[hsl(var(--ink-faint))]">
                  <RefreshCw size={21} />
                </div>

                <p className="mt-4 text-sm font-extrabold text-[hsl(var(--foreground))]">
                  Loading incident data
                </p>

                <p className="mt-2 max-w-xs text-[11px] leading-5 text-[hsl(var(--ink-soft))]">
                  Finding the highest-priority active incident...
                </p>

              </div>

            )}

          </div>

        </article>

      </section>


      {/* OPERATIONAL READINESS */}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.8fr)]">

        <article className="section-card">

          <div className="card-header">

            <div className="flex items-start gap-3">

              <div className="icon-chip icon-chip--amber">
                <Zap size={18} />
              </div>

              <div>

                <p className="card-title">
                  Operational readiness
                </p>

                <p className="card-subtitle">
                  Capacity of critical response resources at this moment
                </p>

              </div>

            </div>

            <span className="mono text-[10px] uppercase tracking-wider text-[hsl(var(--ink))]">
              4 categories
            </span>

          </div>


          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">

            {readiness.map((item) => (
              <ReadinessItem
                key={item.title}
                {...item}
              />
            ))}

          </div>

        </article>


        {/* RESPONSE OPERATIONS */}

        <article className="overflow-hidden rounded-[18px] bg-[hsl(var(--navy))] p-5 text-[hsl(var(--surface))] shadow-[0_18px_38px_hsl(var(--navy)/.18)]">

          <div className="flex items-start justify-between">

            <div>

              <p className="mono text-[9px] uppercase tracking-[.16em] text-[hsl(var(--amber))]">
                Response operations
              </p>

              <h2 className="mt-2 text-xl font-extrabold tracking-[-.06em]">
                Teams in motion
              </h2>

            </div>

            <div className="rounded-xl bg-[hsl(var(--surface)/.1)] p-2.5 text-[hsl(var(--amber))]">
              <Truck size={18} />
            </div>

          </div>


          <div className="mt-6 space-y-2">

            <OperationRow
              icon={Truck}
              title="Supply vehicles"
              detail="Active transport"
              value="08"
            />

            <OperationRow
              icon={HeartPulse}
              title="Medical teams"
              detail="Deployed"
              value="12"
            />

            <OperationRow
              icon={Users}
              title="Rescue teams"
              detail="On standby"
              value="06"
            />

          </div>


          <button
            type="button"
            data-testid="button-open-response-board"
            onClick={() => navigate("/response")}
            className="mt-5 flex w-full items-center justify-between border-t border-[hsl(var(--surface)/.14)] pt-4 text-left text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--surface)/.7)] transition hover:text-[hsl(var(--amber))]"
          >
            Open response board
            <ArrowUpRight size={14} />
          </button>

        </article>

      </section>


      {/* RESOURCE DEMAND */}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.8fr)]">

        <article className="section-card">

          <div className="card-header">

            <div className="flex items-start gap-3">

              <div className="icon-chip icon-chip--violet">
                <Package size={18} />
              </div>

              <div>

                <p className="card-title">
                  Resource demand
                </p>

                <p className="card-subtitle">
                  Current requirement signal across affected areas
                </p>

              </div>

            </div>

          </div>

          <div className="p-5">
            <ResourceChart />
          </div>

        </article>


        {/* DESK BRIEF */}

        <article className="section-card">

          <div className="card-header">

            <div className="flex items-start gap-3">

              <div className="icon-chip">
                <CheckCircle2 size={18} />
              </div>

              <div>

                <p className="card-title">
                  Desk brief
                </p>

                <p className="card-subtitle">
                  Signals requiring a coordinator decision
                </p>

              </div>

            </div>

          </div>


          <div className="space-y-2 p-4">

            <BriefRow
              color="coral"
              time="08:36"
              text="Five critical zones remain above response threshold."
            />

            <BriefRow
              color="amber"
              time="08:21"
              text="Water demand rising in the eastern corridor."
            />

            <BriefRow
              color="teal"
              time="07:58"
              text="Supply vehicle group 08 checked in at staging."
            />


            <button
              type="button"
              data-testid="button-acknowledge-brief"
              onClick={() =>
                setAlertAcknowledged(
                  (acknowledged) => !acknowledged
                )
              }
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider transition ${
                alertAcknowledged
                  ? "border-[hsl(var(--teal)/.35)] bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]"
                  : "border-[hsl(var(--line))] text-[hsl(var(--ink-soft))] hover:bg-[hsl(var(--surface-muted))]"
              }`}
            >
              <CheckCircle2 size={13} />

              {alertAcknowledged
                ? "Brief acknowledged"
                : "Acknowledge brief"}

            </button>

          </div>

        </article>

      </section>


      {/* FOOTER */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--line))] pt-5">

        <p className="mono text-[9px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
          AI
        </p>

        <button
          type="button"
          data-testid="button-open-disaster-registry"
          onClick={() => navigate("/disasters")}
          className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--teal))] hover:text-[hsl(var(--foreground))]"
        >
          View disaster registry
          <ArrowUpRight size={18} />
        </button>

      </div>

    </div>
  )
}


/* INCIDENT FACT */

function IncidentFact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--surface-muted))] text-[hsl(var(--ink-soft))]">
        <Icon size={15} />
      </div>

      <div>

        <p className="text-[10px] text-[hsl(var(--ink-soft))]">
          {label}
        </p>

        <p className="mt-1 text-[11px] font-extrabold text-[hsl(var(--foreground))]">
          {value}
        </p>

      </div>

    </div>
  )
}


/* READINESS */

function ReadinessItem({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}) {

  const toneClass =
    tone === "coral"
      ? "text-[hsl(var(--coral))] bg-[hsl(var(--coral-soft))]"
      : tone === "amber"
      ? "text-[hsl(var(--amber))] bg-[hsl(var(--amber-soft))]"
      : tone === "violet"
      ? "text-[hsl(var(--violet))] bg-[hsl(var(--violet)/.13)]"
      : "text-[hsl(var(--teal))] bg-[hsl(var(--teal-soft))]"

  const barClass =
    tone === "coral"
      ? "bg-[hsl(var(--coral))]"
      : tone === "amber"
      ? "bg-[hsl(var(--amber))]"
      : tone === "violet"
      ? "bg-[hsl(var(--violet))]"
      : "bg-[hsl(var(--teal))]"

  return (
    <div className="rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--surface-raised)/.7)] p-4">

      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-2.5">

          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}
          >
            <Icon size={15} />
          </span>

          <span className="text-[11px] font-extrabold text-[hsl(var(--foreground))]">
            {title}
          </span>

        </div>

        <span className="mono text-[12px] font-medium text-[hsl(var(--foreground))]">
          {value}%
        </span>

      </div>


      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--line))]">

        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${value}%` }}
        />

      </div>


      <p
        className={`mt-2 text-[10px] ${
          value < 60
            ? "font-bold text-[hsl(var(--coral))]"
            : "text-[hsl(var(--ink-soft))]"
        }`}
      >
        {detail}
      </p>

    </div>
  )
}


/* OPERATION ROW */

function OperationRow({
  icon: Icon,
  title,
  detail,
  value,
}) {

  return (
    <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--surface)/.1)] bg-[hsl(var(--surface)/.06)] px-3 py-3">

      <div className="flex items-center gap-3">

        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--surface)/.1)] text-[hsl(var(--amber))]">
          <Icon size={15} />
        </span>

        <div>

          <p className="text-[11px] font-bold">
            {title}
          </p>

          <p className="mt-0.5 text-[9px] text-[hsl(var(--surface)/.55)]">
            {detail}
          </p>

        </div>

      </div>

      <span className="mono text-sm">
        {value}
      </span>

    </div>
  )
}


/* BRIEF ROW */

function BriefRow({
  color,
  time,
  text,
}) {

  const colorClass =
    color === "coral"
      ? "bg-[hsl(var(--coral))]"
      : color === "amber"
      ? "bg-[hsl(var(--amber))]"
      : "bg-[hsl(var(--teal))]"

  return (
    <div className="flex gap-3 rounded-xl px-2 py-2.5 transition hover:bg-[hsl(var(--surface-muted)/.65)]">

      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colorClass}`}
      />

      <div className="min-w-0">

        <p className="text-[11px] leading-5 text-[hsl(var(--foreground))]">
          {text}
        </p>

        <p className="mono mt-1 text-[9px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">
          {time} UTC
        </p>

      </div>

    </div>
  )
}


export default Dashboard