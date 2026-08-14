import {
  LayoutDashboard,
  TriangleAlert,
  MapPinned,
  Package,
  Brain,
  Truck,
  BarChart3,
  Settings,
} from "lucide-react"
import { NavLink } from "react-router-dom"

function Sidebar() {
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
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-blue-600 text-white">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>


          {/* Disasters */}
          <NavLink
  to="/disasters"
  className={({ isActive }) =>
    `w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-slate-300 hover:bg-slate-800"
    }`
  }
>
  <TriangleAlert className="w-5 h-5" />
  <span>Disasters</span>
</NavLink>

          {/* Zones */}
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
            <MapPinned className="w-5 h-5" />
            <span>Zones</span>
          </button>


          {/* Resources */}
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
            <Package className="w-5 h-5" />
            <span>Resources</span>
          </button>


          {/* AI Demand */}
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
            <Brain className="w-5 h-5" />
            <span>AI Demand</span>
          </button>


          {/* Allocation */}
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
            <Truck className="w-5 h-5" />
            <span>Allocation</span>
          </button>


          {/* Reports */}
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
            <BarChart3 className="w-5 h-5" />
            <span>Reports</span>
          </button>

        </div>
      </nav>


      {/* Settings */}
      <div className="px-4 py-4 border-t border-slate-700">

        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>

      </div>

    </aside>
  )
}

export default Sidebar