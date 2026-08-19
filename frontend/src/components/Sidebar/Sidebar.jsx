import {
  LayoutDashboard,
  TriangleAlert,
  MapPinned,
  Package,
  Brain,
  Truck,
  BarChart3,
  Settings,
  Activity,
} from "lucide-react"

import { NavLink } from "react-router-dom"


function Sidebar() {

  const navItemClass = ({ isActive }) =>
    `w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-slate-300 hover:bg-slate-800"
    }`

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">

        <h1 className="text-xl font-bold">
          Disaster AI
        </h1>

        <p className="text-xs text-slate-400 mt-1">
          Response Management
        </p>

      </div>


      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">

        <p className="text-xs uppercase text-slate-500 font-semibold px-3 mb-3">
          Main Menu
        </p>


        <div className="space-y-2">

          {/* Dashboard */}
          <NavLink
            to="/"
            end
            className={navItemClass}
          >
            <LayoutDashboard className="w-5 h-5" />

            <span>
              Dashboard
            </span>
          </NavLink>


          {/* Disasters */}
          <NavLink
            to="/disasters"
            className={navItemClass}
          >
            <TriangleAlert className="w-5 h-5" />

            <span>
              Disasters
            </span>
          </NavLink>


          {/* Zones */}
          <NavLink
            to="/zones"
            className={navItemClass}
          >
            <MapPinned className="w-5 h-5" />

            <span>
              Zones
            </span>
          </NavLink>


          {/* Resources */}
          
          <NavLink
            to="/resources"
            className={navItemClass}
          >
            <Package className="w-5 h-5" />

            <span>
              Resources
            </span>
          </NavLink>


          {/* AI Demand */}
          <NavLink
            to="/AIdemand"
            className={navItemClass}
          >
            <Brain className="w-5 h-5" />

            <span>
              AI Demand
            </span>
          </NavLink>


          {/* Allocation */}
          <NavLink
            to="/Operations"
            className={navItemClass}
          >
            <Truck className="w-5 h-5" />

            <span>
              Allocation
            </span>
          </NavLink>


          {/* Reports */}
          <NavLink
            to="/reports"
            className={navItemClass}
          >
            <BarChart3 className="w-5 h-5" />

            <span>
              Reports
            </span>
          </NavLink>

        </div>

      </nav>


      {/* Settings */}
      <div className="px-4 py-4 border-t border-slate-700">

        <NavLink
          to="/settings"
          className={navItemClass}
        >
          <Settings className="w-5 h-5" />

          <span>
            Settings
          </span>
        </NavLink>

      </div>

    </aside>
  )
}

export default Sidebar