import { useEffect, useState } from "react"
import {
  Activity,
  Bell,
  ChevronDown,
  Command,
  Menu,
  UserCircle,
  X,
} from "lucide-react"
import { Link } from "react-router-dom"



function Navbar({ sidebarOpen, setSidebarOpen }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileName, setProfileName] = useState(() => localStorage.getItem("eoc-profile-name") || "Ops Coordinator")

  useEffect(() => {
    const updateProfileName = () => setProfileName(localStorage.getItem("eoc-profile-name") || "Ops Coordinator")
    window.addEventListener("profile-updated", updateProfileName)
    return () => window.removeEventListener("profile-updated", updateProfileName)
  }, [])

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-[76px] border-b border-[hsl(var(--line))] bg-[hsl(var(--surface)/.94)] px-4 backdrop-blur-xl transition-colors duration-200 sm:px-6">
      <div className="flex h-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <button
            type="button"
            data-testid="button-toggle-sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Collapse navigation" : "Expand navigation"}
            title={sidebarOpen ? "Collapse navigation" : "Expand navigation"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--line))] text-[hsl(var(--ink-soft))] transition hover:border-[hsl(var(--teal)/.4)] hover:bg-[hsl(var(--teal-soft))] hover:text-[hsl(var(--teal))]"
          >
            {sidebarOpen ? <X size={18} strokeWidth={2.2} /> : <Menu size={18} strokeWidth={2.2} />}
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--navy))] text-[hsl(var(--amber))] shadow-[0_5px_14px_hsl(var(--navy)/.2)]">
              <Command size={17} strokeWidth={2.6} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--surface))] bg-[hsl(var(--coral))]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-extrabold tracking-[-.02em] text-[hsl(var(--foreground))] sm:text-[15px]">
                AI Disaster Response
              </p>
              <p className="hidden text-[9px] font-medium uppercase tracking-[.18em] text-[hsl(var(--ink-faint))] sm:block">
                Emergency management network
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden items-center gap-2 border-r border-[hsl(var(--line))] pr-4 text-[10px] text-[hsl(var(--ink-soft))] lg:flex">
            <Activity size={14} className="text-[hsl(var(--teal))]" />
           
          </div>

          <div className="relative">
            <button
              type="button"
              data-testid="button-open-notifications"
              onClick={() => {
                setNotificationsOpen((open) => !open)
                setProfileOpen(false)
              }}
              aria-label="Open notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[hsl(var(--ink-soft))] transition hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]"
            >
              <Bell size={18} />
              <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-[hsl(var(--coral))] ring-2 ring-[hsl(var(--surface))]" />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-12 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--surface))] p-3 shadow-2xl shadow-[hsl(var(--shadow)/.14)]">
                <div className="flex items-center justify-between border-b border-[hsl(var(--line))] px-2 pb-3">
                  <span className="text-xs font-extrabold text-[hsl(var(--foreground))]">Signal feed</span>
                  <span className="mono text-[9px] uppercase tracking-wider text-[hsl(var(--teal))]">3 unread</span>
                </div>
                <div className="space-y-1 pt-2">
                  <p className="rounded-xl bg-[hsl(var(--coral-soft))] px-3 py-2.5 text-[11px] leading-4 text-[hsl(var(--foreground))]">
                    Severity 8 incident requires coordinator review.
                  </p>
                  <p className="rounded-xl px-3 py-2.5 text-[11px] leading-4 text-[hsl(var(--ink-soft))] hover:bg-[hsl(var(--surface-muted))]">
                    Medical kit inventory dropped below watch threshold.
                  </p>
                </div>
              </div>
            )}
          </div>


          <div className="relative hidden sm:block">
            <button
              type="button"
              data-testid="button-open-profile"
              onClick={() => {
                setProfileOpen((open) => !open)
                setNotificationsOpen(false)
              }}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-[hsl(var(--surface-muted))]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--navy))] text-[11px] font-extrabold text-[hsl(var(--amber))]">AI</span>
              <span className="hidden leading-tight lg:block">
                <span className="block text-[11px] font-bold text-[hsl(var(--foreground))]">{profileName}</span>
                <span className="mono block text-[9px] uppercase tracking-wider text-[hsl(var(--ink-faint))]">Control room</span>
              </span>
              <ChevronDown size={14} className="text-[hsl(var(--ink-faint))]" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--surface))] p-2 shadow-2xl shadow-[hsl(var(--shadow)/.14)]">
                <div className="border-b border-[hsl(var(--line))] px-3 py-2">
                  <p className="text-xs font-bold text-[hsl(var(--foreground))]">Operations desk</p>
                 
                </div>
                <Link
                  to="/settings"
                  data-testid="link-profile-settings"
                  onClick={() => setProfileOpen(false)}
                  className="mt-1 block w-full rounded-lg px-3 py-2 text-[11px] font-bold text-[hsl(var(--ink-soft))] hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]"
                >
                  Profile &amp; account
                </Link>
                <button type="button" data-testid="button-close-profile" onClick={() => setProfileOpen(false)} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-[11px] text-[hsl(var(--ink-soft))] hover:bg-[hsl(var(--surface-muted))]">
                  Close panel
                </button>
              </div>
            )}
          </div>

          <UserCircle size={19} className="text-[hsl(var(--ink-faint))] sm:hidden" />
        </div>
      </div>
    </nav>
  )
}

export default Navbar