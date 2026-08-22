import {
  LayoutDashboard,
  TriangleAlert,
  MapPinned,
  Package,
  Brain,
  Truck,
  BarChart3,
} from "lucide-react"

import { NavLink } from "react-router-dom"


function Sidebar({ sidebarOpen }) {

  const navItemClass = ({ isActive }) =>
    `
      flex
      items-center
      gap-3
      px-3
      py-3
      rounded-lg
      transition-all
      duration-200
      ${
        isActive
          ? `
            bg-blue-600
            text-white
            shadow-sm
          `
          : `
            text-slate-600
            dark:text-slate-300
            hover:bg-slate-100
            dark:hover:bg-slate-800
            hover:text-slate-900
            dark:hover:text-white
          `
      }
    `


  return (

    <aside
      className={`
        fixed
        top-16
        left-0
        bottom-0
        z-40
        w-64
        overflow-y-auto
        border-r
        border-slate-200
        dark:border-slate-700
        bg-white
        dark:bg-slate-900
        transition-transform
        duration-300
        ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }
      `}
    >

      {/* ================= SIDEBAR CONTENT ================= */}

      <div className="h-full flex flex-col">

        {/* Navigation */}

        <nav className="flex-1 px-4 py-6">

          <p
            className="
              text-xs
              uppercase
              tracking-wider
              text-slate-400
              dark:text-slate-500
              font-semibold
              px-3
              mb-4
            "
          >
            Main Menu
          </p>


          <div className="space-y-2">

            {/* Dashboard */}

            <NavLink
              to="/"
              end
              className={navItemClass}
            >

              <LayoutDashboard className="w-5 h-5 shrink-0" />

              <span>
                Dashboard
              </span>

            </NavLink>


            {/* Disasters */}

            <NavLink
              to="/disasters"
              className={navItemClass}
            >

              <TriangleAlert className="w-5 h-5 shrink-0" />

              <span>
                Disasters
              </span>

            </NavLink>


            {/* Zones */}

            <NavLink
              to="/zones"
              className={navItemClass}
            >

              <MapPinned className="w-5 h-5 shrink-0" />

              <span>
                Zones
              </span>

            </NavLink>


            {/* Resources */}

            <NavLink
              to="/resources"
              className={navItemClass}
            >

              <Package className="w-5 h-5 shrink-0" />

              <span>
                Resources
              </span>

            </NavLink>


            {/* AI Demand */}

            <NavLink
              to="/AIdemand"
              className={navItemClass}
            >

              <Brain className="w-5 h-5 shrink-0" />

              <span>
                AI Demand
              </span>

            </NavLink>


            {/* Response Coordination */}

<NavLink
  to="/response"
  className={navItemClass}
>

  <Truck className="w-5 h-5 shrink-0" />

  <span>
    Response Coordination
  </span>

</NavLink>


            {/* Reports */}

            <NavLink
              to="/reports"
              className={navItemClass}
            >

              <BarChart3 className="w-5 h-5 shrink-0" />

              <span>
                Reports
              </span>

            </NavLink>

          </div>

        </nav>


        {/* ================= SYSTEM STATUS ================= */}

        <div
          className="
            m-4
            p-4
            rounded-xl
            bg-slate-100
            dark:bg-slate-800
            border
            border-slate-200
            dark:border-slate-700
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                w-9
                h-9
                rounded-lg
                bg-emerald-100
                dark:bg-emerald-900/40
                flex
                items-center
                justify-center
              "
            >

              <div
                className="
                  w-2.5
                  h-2.5
                  rounded-full
                  bg-emerald-500
                "
              />

            </div>


            <div>

              <p
                className="
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-white
                "
              >
                System Operational
              </p>

              <p
                className="
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                  mt-0.5
                "
              >
                All services online
              </p>

            </div>

          </div>

        </div>

      </div>

    </aside>
  )
}

export default Sidebar