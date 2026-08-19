import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'

import Dashboard from './components/Dashboard/Dashboard'
import Disasters from './pages/Disaster'
import Zones from './pages/Zones'
import Resources from './pages/Resources'
import Operations from "./pages/Operations"
import AIDemand from './pages/AIDemand'
import Reports from './pages/Reports'

function App() {
  return (
    <BrowserRouter>

<div className="min-h-screen bg-slate-100 text-slate-
900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        <Navbar />

        <div className="flex">

          <Sidebar />

          <main className="min-h-[calc(100vh-64px)] flex-1 bg-slate-100 p-6 dark:bg-slate-950">

            <Routes>

              <Route path="/" element={<Dashboard />} />

              <Route path="/disasters" element={<Disasters />} />

              <Route path="/zones" element={<Zones />} />

              <Route path="/resources" element={<Resources />} />

              <Route path="/operations" element={<Operations />} />

              <Route path="/AIDemand" element={<AIDemand />} />

              <Route path="/Reports" element={<Reports />} />


            </Routes>

          </main>

        </div>

      </div>

    </BrowserRouter>
  )
}

export default App