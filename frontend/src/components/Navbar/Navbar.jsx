import {
  Menu,
  X,
  Bell,
  UserCircle,
} from "lucide-react"

import ThemeToggle from "../Theme/ThemeToggle"


function Navbar({
  sidebarOpen,
  setSidebarOpen,
}) {

  return (

    <nav
      className="
        fixed
        top-0
        left-0
        right-0
        z-50
        h-16
        bg-white
        dark:bg-slate-900
        border-b
        border-slate-200
        dark:border-slate-700
        shadow-sm
        flex
        items-center
        justify-between
        px-5
        transition-colors
        duration-200
      "
    >

      {/* LEFT SIDE */}

      <div className="flex items-center gap-4">

        {/* Sidebar Toggle */}

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="
            w-10
            h-10
            flex
            items-center
            justify-center
            rounded-lg
            text-slate-600
            dark:text-slate-300
            hover:bg-slate-100
            dark:hover:bg-slate-800
            transition
          "
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >

          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}

        </button>


        {/* ONE WEBSITE NAME */}

        <div className="flex items-center gap-2">

          <div
            className="
              w-8
              h-8
              rounded-lg
              bg-blue-600
              text-white
              flex
              items-center
              justify-center
              font-bold
              text-sm
            "
          >
            DR
          </div>

          <h1
            className="
              text-lg
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Disaster Response AI
          </h1>

        </div>

      </div>


      {/* RIGHT SIDE */}

      <div className="flex items-center gap-2">

        {/* Notifications */}

        <button
          className="
            w-10
            h-10
            rounded-lg
            flex
            items-center
            justify-center
            text-slate-600
            dark:text-slate-300
            hover:bg-slate-100
            dark:hover:bg-slate-800
            transition
          "
          title="Notifications"
        >

          <Bell className="w-5 h-5" />

        </button>


        {/* Admin */}

        <button
          className="
            hidden
            sm:flex
            items-center
            gap-2
            px-3
            py-2
            rounded-lg
            text-sm
            font-medium
            text-slate-700
            dark:text-slate-300
            hover:bg-slate-100
            dark:hover:bg-slate-800
            transition
          "
        >

          <UserCircle className="w-5 h-5" />

          Admin

        </button>


        {/* Dark / Light Mode */}

        <ThemeToggle />

      </div>

    </nav>
  )
}

export default Navbar