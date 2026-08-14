import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'

import Dashboard from './components/Dashboard/Dashboard'
import Disasters from './pages/Disaster'


function App() {
  return (
    <BrowserRouter>

      <div className="bg-slate-100 min-h-screen">

        <Navbar />

        <div className="flex">

          <Sidebar />

          <main className="flex-1 p-6">

            <Routes>

              <Route path="/" element={<Dashboard />} />

              <Route path="/disasters" element={<Disasters />} />

            </Routes>

          </main>

        </div>

      </div>

    </BrowserRouter>
  )
}

export default App