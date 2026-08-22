import { useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar/Navbar"
import Sidebar from "./components/Sidebar/Sidebar"

import Dashboard from "./components/Dashboard/Dashboard"
import Disasters from "./pages/Disaster"
import Zones from "./pages/Zones"
import Resources from "./pages/Resources"
import ResponseCoordination from "./pages/ResponseCoordination."
import AIDemand from "./pages/AIDemand"
import Reports from "./pages/Reports"


function App() {

  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <BrowserRouter>

<div className="
        min-h-screen
        bg-sky-100
        dark:bg-slate-950
        text-slate-900
        dark:text-slate-100
        transition-colors
        duration-200
      ">        {/* ================= NAVBAR ================= */}

        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />


        {/* ================= SIDEBAR ================= */}

        <Sidebar
          sidebarOpen={sidebarOpen}
        />


        {/* ================= MAIN CONTENT ================= */}

        <main
          className={`
            min-h-screen
            pt-16
            transition-all
            duration-300
            ${sidebarOpen ? "ml-64" : "ml-0"}
          `}
        >

          <Routes>

            {/* ================= NORMAL PAGES ================= */}

            <Route
              path="/"
              element={
                <div className="p-6">
                  <Dashboard />
                </div>
              }
            />

            <Route
              path="/disasters"
              element={
                <div className="p-6">
                  <Disasters />
                </div>
              }
            />

            <Route
              path="/zones"
              element={
                <div className="p-6">
                  <Zones />
                </div>
              }
            />

            <Route
              path="/resources"
              element={
                <div className="p-6">
                  <Resources />
                </div>
              }
            />

          


            {/* ================= AI DEMAND ================= */}

            <Route
              path="/AIdemand"
              element={
                <div className="w-full">
                  <AIDemand />
                </div>
              }
            />


            {/* ================= REPORTS ================= */}

            <Route
              path="/reports"
              element={
                <div className="p-6">
                  <Reports />
                </div>
              }
            />


            {/* ================= ALLOCATION ================= */}
               <Route
    path="/response"
    element={<ResponseCoordination />}
  />

            

          </Routes>

        </main>

      </div>

    </BrowserRouter>
  )
}

export default App