import {
  BarChart3,
  BrainCircuit,
  Boxes,
  LayoutDashboard,
  MapPinned,
  RadioTower,
  Settings as SettingsIcon,
  ShieldAlert,
  Truck,
} from "lucide-react"
import { NavLink } from "react-router-dom"

const primaryLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/disasters", label: "Disasters", icon: ShieldAlert },
  { to: "/zones", label: "Impact zones", icon: MapPinned },
  { to: "/resources", label: "Resource", icon: Boxes },
]

const operationsLinks = [
  { to: "/AIdemand", label: "Demand forecast", icon: BrainCircuit },
  { to: "/response", label: "Response coordination", icon: Truck },
  { to: "/reports", label: "Reports & review", icon: BarChart3 },
  { to: "/settings", label: "Profile & account", icon: SettingsIcon },
]

function Sidebar({ sidebarOpen, onNavigate }) {
  const navItemClass = ({ isActive }) =>
    `sidebar-nav-link ${isActive ? "active" : ""}`

  const renderLink = ({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={navItemClass}
      onClick={onNavigate}
      title={!sidebarOpen ? label : undefined}
      data-testid={`link-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
    >
      <Icon className="shrink-0" size={18} strokeWidth={1.9} />
      <span className="sidebar-label text-[13px] font-bold tracking-[-.01em]">{label}</span>
    </NavLink>
  )

  return (
    <aside className={`sidebar-shell ${sidebarOpen ? "" : "sidebar-shell--collapsed"} ${sidebarOpen ? "sidebar-shell--open" : ""}`}>
      <div className="flex h-full min-w-0 flex-col px-3 py-5">
        <div className="sidebar-section-label mb-5 px-4">
          <p className="eyebrow">Command console</p>
          <p className="mt-2 text-[13px] leading-4 text-[hsl(var(--ink))]">
            Monitor. Prioritise. Analyze.
          </p>
        </div>

        <nav aria-label="Primary navigation" className="space-y-1">
          {primaryLinks.map(renderLink)}
        </nav>

        <div className="sidebar-rule my-5" />

        <div className="sidebar-section-label mb-3 px-3">
          <p className="mono text-[9px] font-medium uppercase tracking-[.22em] text-[hsl(var(--ink))]">Operations</p>
        </div>
        <nav aria-label="Operations navigation" className="space-y-1">
          {operationsLinks.map(renderLink)}
        </nav>

        <div className="mt-auto">
          <div className="sidebar-rule mb-4" />
          <div className="rounded-xl border border-[hsl(var(--line))] bg-[hsl(var(--surface-muted)/.55)] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]">
                <RadioTower size={16} />
              </div>
              <div className="sidebar-status-copy min-w-0">
                
                <p className="mono mt-1 truncate text-[10px] uppercase tracking-wider text-[hsl(var(--ink))]">All feeds online</p>
              </div>
              <span className="status-dot status-dot--pulse ml-auto shrink-0 text-[hsl(var(--teal))]" />
            </div>
          </div>
          
        </div>
      </div>
    </aside>
  )
}

export default Sidebar