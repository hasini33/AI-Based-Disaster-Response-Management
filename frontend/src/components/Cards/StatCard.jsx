import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

const toneMap = {
  teal: { chip: "icon-chip", accent: "text-[hsl(var(--teal))]", bar: "bg-[hsl(var(--teal))]" },
  amber: { chip: "icon-chip icon-chip--amber", accent: "text-[hsl(var(--amber))]", bar: "bg-[hsl(var(--amber))]" },
  coral: { chip: "icon-chip icon-chip--alert", accent: "text-[hsl(var(--coral))]", bar: "bg-[hsl(var(--coral))]" },
  violet: { chip: "icon-chip icon-chip--violet", accent: "text-[hsl(var(--violet))]", bar: "bg-[hsl(var(--violet))]" },
}

function StatCard({ title, value, icon: Icon, description, trend, trendLabel, tone = "teal", index = 0 }) {
  const colors = toneMap[tone] || toneMap.teal
  const TrendIcon = trend === "down" ? ArrowDownRight : trend === "flat" ? Minus : ArrowUpRight

  return (
    <article
      data-testid={`card-stat-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      className="group relative overflow-hidden rounded-[18px] border border-[hsl(var(--line))] bg-[hsl(var(--surface)/.9)] p-5 shadow-[0_14px_32px_hsl(var(--shadow)/.045)] transition duration-300 hover:-translate-y-1 hover:border-[hsl(var(--line-strong))] hover:shadow-[0_20px_40px_hsl(var(--shadow)/.09)]"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 ${colors.bar} opacity-70`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.08em] text-[hsl(var(--ink-soft))]">{title}</p>
          <p className="mono mt-3 text-[30px] font-medium leading-none tracking-[-.08em] text-[hsl(var(--foreground))]">{value}</p>
        </div>
        <div className={colors.chip}>
          <Icon size={18} strokeWidth={1.9} />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-2">
        <p className="truncate text-[10px] text-[hsl(var(--ink-soft))]">{description}</p>
        {trendLabel && (
          <span className={`flex shrink-0 items-center gap-0.5 text-[10px] font-extrabold ${colors.accent}`}>
            <TrendIcon size={12} />
            {trendLabel}
          </span>
        )}
      </div>
    </article>
  )
}

export default StatCard