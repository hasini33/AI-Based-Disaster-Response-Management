import { useState } from "react"

import { useNavigate } from "react-router-dom"
import {
  Search,
  Package,
  Droplets,
  Utensils,
  HeartPulse,
  House,
  Truck,
  Warehouse,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  X,
  ArrowUpRight,
  Boxes,
} from "lucide-react"


const resourcesData = [
  {
    id: 1,
    name: "Food Packets",
    category: "Food",
    icon: "food",
    available: 8420,
    capacity: 12000,
    unit: "packets",
    location: "Guwahati Warehouse",
    status: "Available",
    lastUpdated: "10 min ago",
  },
  {
    id: 2,
    name: "Drinking Water",
    category: "Water",
    icon: "water",
    available: 12000,
    capacity: 15000,
    unit: "liters",
    location: "Patna Distribution Center",
    status: "Available",
    lastUpdated: "15 min ago",
  },
  {
    id: 3,
    name: "Medical Kits",
    category: "Medical",
    icon: "medical",
    available: 1240,
    capacity: 5000,
    unit: "kits",
    location: "Kolkata Medical Hub",
    status: "Low Stock",
    lastUpdated: "8 min ago",
  },
  {
    id: 4,
    name: "Shelter Capacity",
    category: "Shelter",
    icon: "shelter",
    available: 2840,
    capacity: 6000,
    unit: "people",
    location: "Bhubaneswar Relief Camp",
    status: "Low Stock",
    lastUpdated: "20 min ago",
  },
  {
    id: 5,
    name: "Rescue Equipment",
    category: "Rescue",
    icon: "rescue",
    available: 1200,
    capacity: 1500,
    unit: "units",
    location: "Hyderabad Emergency Hub",
    status: "Available",
    lastUpdated: "12 min ago",
  },
  {
    id: 6,
    name: "Emergency Food",
    category: "Food",
    icon: "food",
    available: 2100,
    capacity: 10000,
    unit: "packets",
    location: "Chennai Relief Center",
    status: "Critical",
    lastUpdated: "5 min ago",
  },
  {
    id: 7,
    name: "First Aid Kits",
    category: "Medical",
    icon: "medical",
    available: 780,
    capacity: 2500,
    unit: "kits",
    location: "Kochi Medical Center",
    status: "Low Stock",
    lastUpdated: "25 min ago",
  },
  {
    id: 8,
    name: "Temporary Shelters",
    category: "Shelter",
    icon: "shelter",
    available: 4300,
    capacity: 5000,
    unit: "people",
    location: "Ahmedabad Relief Camp",
    status: "Available",
    lastUpdated: "18 min ago",
  },
]


function Resources() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedResource, setSelectedResource] = useState(null)
  

  const filteredResources = resourcesData.filter((resource) => {

    const search = searchTerm.toLowerCase()

    const matchesSearch =
      resource.name.toLowerCase().includes(search) ||
      resource.category.toLowerCase().includes(search) ||
      resource.location.toLowerCase().includes(search)

    const matchesCategory =
      categoryFilter === "All" ||
      resource.category === categoryFilter

    const matchesStatus =
      statusFilter === "All" ||
      resource.status === statusFilter

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus
    )
  })


  function getResourceIcon(type) {

    if (type === "food") {
      return <Utensils className="w-5 h-5" />
    }

    if (type === "water") {
      return <Droplets className="w-5 h-5" />
    }

    if (type === "medical") {
      return <HeartPulse className="w-5 h-5" />
    }

    if (type === "shelter") {
      return <House className="w-5 h-5" />
    }

    return <Truck className="w-5 h-5" />
  }


  function getStatusStyle(status) {

    if (status === "Available") {
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
    }

    if (status === "Low Stock") {
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
    }

    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
  }


  function getProgressStyle(percentage) {

    if (percentage >= 60) {
      return "bg-green-500"
    }

    if (percentage >= 30) {
      return "bg-orange-500"
    }

    return "bg-red-500"
  }


  function clearFilters() {
    setSearchTerm("")
    setCategoryFilter("All")
    setStatusFilter("All")
  }


  const totalResources = resourcesData.length

  const availableResources =
    resourcesData.filter(
      (resource) => resource.status === "Available"
    ).length

  const lowStockResources =
    resourcesData.filter(
      (resource) => resource.status === "Low Stock"
    ).length

  const criticalResources =
    resourcesData.filter(
      (resource) => resource.status === "Critical"
    ).length


  return (

    <div className="space-y-5">


      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">

            <Package className="w-4 h-4" />

            Resource Operations

          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Resource Center
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Track relief supplies, stock levels and distribution readiness.
          </p>

        </div>


        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-400 dark:border-blue-900 rounded-lg px-4 py-2.5 shadow-sm">

          <Boxes className="w-5 h-5 text-blue-600 dark:text-blue-400" />

          <span className="text-sm text-gray-500 dark:text-gray-400">
            Inventory Items
          </span>

          <span className="font-bold text-gray-900 dark:text-white">
            {totalResources}
          </span>

        </div>

      </div>


      {/* RESOURCE HEALTH */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">


        <div className="bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-400 dark:border-blue-900 p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ready for Deployment
              </p>

              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {availableResources}
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">

              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />

            </div>

          </div>

          <p className="text-xs text-green-600 dark:text-green-400 mt-3">
            Stock level is healthy
          </p>

        </div>


        <div className="bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-400 dark:border-blue-900 p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Low Stock
              </p>

              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {lowStockResources}
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">

              <Clock3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />

            </div>

          </div>

          <p className="text-xs text-orange-600 dark:text-orange-400 mt-3">
            Replenishment recommended
          </p>

        </div>


        <div className="bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-400 dark:border-blue-900 p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Critical Stock
              </p>

              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {criticalResources}
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">

              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />

            </div>

          </div>

          <p className="text-xs text-red-600 dark:text-red-400 mt-3">
            Immediate attention required
          </p>

        </div>


        <div className="bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-400 dark:border-blue-900 p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Inventory
              </p>

              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {totalResources}
              </p>

            </div>

            <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">

              <Warehouse className="w-5 h-5 text-blue-600 dark:text-blue-400" />

            </div>

          </div>

          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
            Across relief centers
          </p>

        </div>

      </div>


      {/* SEARCH */}

      <div className="bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-400 dark:border-blue-900 shadow-sm p-5">

        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center gap-2">

            <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />

            <h2 className="font-semibold text-gray-900 dark:text-white">
              Find Resources
            </h2>

          </div>

          <span className="text-xs text-gray-400 dark:text-gray-500">
            {filteredResources.length} results
          </span>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search resource or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>


          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="All">All Categories</option>
            <option value="Food">Food</option>
            <option value="Water">Water</option>
            <option value="Medical">Medical</option>
            <option value="Shelter">Shelter</option>
            <option value="Rescue">Rescue</option>

          </select>


          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="All">All Stock Status</option>
            <option value="Available">Available</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Critical">Critical</option>

          </select>

        </div>


        {(searchTerm ||
          categoryFilter !== "All" ||
          statusFilter !== "All") && (

          <button
            onClick={clearFilters}
            className="flex items-center gap-2 mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >

            <X className="w-4 h-4" />

            Clear filters

          </button>

        )}

      </div>


      {/* RESOURCE CARDS */}

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredResources.length > 0 ? (

          filteredResources.map((resource) => {

            const percentage =
              Math.round(
                (resource.available / resource.capacity) * 100
              )

            return (

              <div
                key={resource.id}
              className="bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-400 dark:border-blue-900 shadow-sm p-4 hover:shadow-md transition-shadow">

                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">

                      {getResourceIcon(resource.icon)}

                    </div>

                    <div>

                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {resource.name}
                      </h3>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {resource.category}
                      </p>

                    </div>

                  </div>


                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(resource.status)}`}
                  >
                    {resource.status}
                  </span>

                </div>


                <div className="mt-3">

                  <div className="flex items-end justify-between">

                    <div>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Current Stock
                      </p>

                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">

                        {resource.available.toLocaleString()}

                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                          {resource.unit}
                        </span>

                      </p>

                    </div>

                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {percentage}%
                    </span>

                  </div>


                  <div className="mt-3 h-2 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">

                    <div
                      className={`h-full rounded-full ${getProgressStyle(percentage)}`}
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />

                  </div>


                  <div className="flex justify-between mt-2">

                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Available
                    </span>

                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Capacity: {resource.capacity.toLocaleString()}
                    </span>

                  </div>

                </div>


                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">

                  <div className="flex items-center gap-2 min-w-0">

                    <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />

                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {resource.location}
                    </span>

                  </div>

                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-3 whitespace-nowrap">
                    {resource.lastUpdated}
                  </span>

                </div>


                <div className="mt-4 flex items-center gap-3">

                  <button
                    onClick={() => setSelectedResource(resource)}
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >

                    View Details

                    <ArrowUpRight className="w-4 h-4" />

                  </button>


                  <button
  onClick={() => navigate("/allocation")}
  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
>
  <Truck className="w-4 h-4" />

  Allocate
</button>

                </div>

              </div>

            )
          })

        ) : (

          <div className="lg:col-span-2 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-400 dark:border-blue-900 p-12 text-center">

            <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />

            <p className="text-gray-500 dark:text-gray-400 mt-3">
              No resources match your filters.
            </p>

            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-2 hover:underline"
            >
              Clear filters
            </button>

          </div>

        )}

      </div>


      {/* RESOURCE MODAL */}

      {selectedResource && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">

          <div className="bg-blue-50 dark:bg-blue-950 w-full max-w-lg rounded-xl shadow-xl overflow-hidden">


            <div className="px-6 py-5 border-b border-blue-400 dark:border-blue-900 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">

                  {getResourceIcon(selectedResource.icon)}

                </div>

                <div>

                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedResource.name}
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedResource.category} resource
                  </p>

                </div>

              </div>


              <button
                onClick={() => setSelectedResource(null)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
              >

                <X className="w-5 h-5" />

              </button>

            </div>


            <div className="p-6 space-y-5">


              <div className="grid grid-cols-2 gap-4">

                <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Available
                  </p>

                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {selectedResource.available.toLocaleString()}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedResource.unit}
                  </p>

                </div>


                <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Capacity
                  </p>

                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {selectedResource.capacity.toLocaleString()}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedResource.unit}
                  </p>

                </div>

              </div>


              <div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Stock Status
                </p>

                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(selectedResource.status)}`}
                >
                  {selectedResource.status}
                </span>

              </div>


              <div className="flex items-start gap-3">

                <Warehouse className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />

                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Storage Location
                  </p>

                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
                    {selectedResource.location}
                  </p>

                </div>

              </div>


              <div className="flex items-start gap-3">

                <Clock3 className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />

                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last Inventory Update
                  </p>

                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
                    {selectedResource.lastUpdated}
                  </p>

                </div>

              </div>


              <button
                onClick={() => setSelectedResource(null)}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Allocate Resource
              </button>


              <button
                onClick={() => setSelectedResource(null)}
                className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}


export default Resources