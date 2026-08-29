import { useState } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import "./App.css"

import Navbar from "./components/Navbar/Navbar"
import Sidebar from "./components/Sidebar/Sidebar"

import Login from "./pages/Login"
import Settings from "./pages/Settings"

import Dashboard from "./components/Dashboard/Dashboard"
import Disasters from "./pages/Disaster"
import Zones from "./pages/Zones"
import Resources from "./pages/Resources"
import ResponseCoordination from "./pages/ResponseCoordination."
import AIDemand from "./pages/AIDemand"
import Reports from "./pages/Reports"

function OperationsShell() {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 768
  )

  const location = useLocation()

  // Login page should not show Navbar/Sidebar
  if (location.pathname === "/login") {
    return <Login />
  }

  return (
    <div className="app-shell">
      <div className="app-noise" aria-hidden="true" />

      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <Sidebar
        sidebarOpen={sidebarOpen}
        onNavigate={() => {
          if (window.innerWidth < 768) {
            setSidebarOpen(false)
          }
        }}
      />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="mobile-scrim md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={`app-main ${sidebarOpen ? "app-main--wide" : ""}`}>
        <Routes>
          <Route
            path="/"
            element={
              <div className="app-main__inner">
                <Dashboard />
              </div>
            }
          />

          <Route
            path="/disasters"
            element={
              <div className="app-main__inner page-enter">
                <Disasters />
              </div>
            }
          />

          <Route
            path="/zones"
            element={
              <div className="app-main__inner page-enter">
                <Zones />
              </div>
            }
          />

          <Route
            path="/resources"
            element={
              <div className="app-main__inner page-enter">
                <Resources />
              </div>
            }
          />

          <Route
            path="/AIdemand"
            element={
              <div className="app-main__inner page-enter">
                <AIDemand />
              </div>
            }
          />

          <Route
            path="/reports"
            element={
              <div className="app-main__inner page-enter">
                <Reports />
              </div>
            }
          />

          <Route
            path="/response"
            element={
              <div className="app-main__inner page-enter">
                <ResponseCoordination />
              </div>
            }
          />

          <Route
            path="/settings"
            element={
              <div className="app-main__inner page-enter">
                <Settings />
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <OperationsShell />
    </BrowserRouter>
  )
}

export default App