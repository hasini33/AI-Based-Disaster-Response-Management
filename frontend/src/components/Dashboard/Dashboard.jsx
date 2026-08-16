import StatCard from "../Cards/StatCard"
import ResourceChart from "../Charts/ResourceChart"
import DisasterMap from "../Map/DisasterMap"
import { useSearchParams } from "react-router-dom"
import {
  Activity,
  Users,
  Package,
  TriangleAlert,
  MapPin,
  ShieldAlert,
  Layers3,
  Info,
} from "lucide-react"
import { getDisasterImpact } from "../../services/disasterService"
import { useEffect, useState } from "react"


function Dashboard() {

  const [searchParams] = useSearchParams()
  const [selectedDisaster, setSelectedDisaster] = useState(null)
  const selectedDisasterId = searchParams.get("disasterId")

  useEffect(() => {

    if (!selectedDisasterId) {
      setSelectedDisaster(null)
      return
    }

    getDisasterImpact(Number(selectedDisasterId))
      .then((data) => {
        setSelectedDisaster(data)
      })
      .catch((error) => {
        console.error("Failed to load selected disaster:", error)
        setSelectedDisaster(null)
      })

  }, [selectedDisasterId])
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Disaster Response Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Monitor disasters, resources, affected zones, and relief operations.
        </p>
      </div>


      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        <StatCard
          title="Active Disasters"
          value="12"
          icon={Activity}
          description="Currently active events"
        />

        <StatCard
          title="Affected Population"
          value="24,580"
          icon={Users}
          description="People in affected zones"
        />

        <StatCard
          title="Resources Available"
          value="156"
          icon={Package}
          description="Available relief resources"
        />

        <StatCard
          title="High Severity Zones"
          value="5"
          icon={TriangleAlert}
          description="Require immediate attention"
        />

      </div>


      {/* Map + Selected Disaster */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Map */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          <div className="px-5 py-4 border-b border-gray-200">

            <h2 className="text-lg font-semibold text-gray-900">
              Disaster Impact Map
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              View active disasters and affected areas
            </p>

          </div>

          <div className="p-4">
            <DisasterMap
  selectedDisasterId={
    selectedDisasterId
      ? Number(selectedDisasterId)
      : null
  }
/>
          </div>

        </div>


        {/* Selected Disaster */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

          {/* Header */}
          <div className="flex items-start gap-3">

            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Selected Disaster
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Information about the selected event
              </p>
            </div>

          </div>


          {/* Empty State */}
         {/* Selected Disaster Information */}

{selectedDisaster ? (

  <div className="mt-8 space-y-5">

    {/* Disaster Type */}
    <div>
      <p className="text-xs text-gray-500">
        Disaster Type
      </p>

      <p className="text-lg font-semibold text-gray-900 mt-1">
        {selectedDisaster.disaster_type}
      </p>
    </div>


    {/* Location */}
    <div className="flex items-start gap-3">

      <MapPin className="w-4 h-4 text-gray-400 mt-1" />

      <div>
        <p className="text-xs text-gray-500">
          Location
        </p>

        <p className="text-sm font-medium text-gray-700 mt-1">
          {selectedDisaster.latitude},
          {" "}
          {selectedDisaster.longitude}
        </p>
      </div>

    </div>


    {/* Severity */}
    <div className="flex items-start gap-3">

      <Activity className="w-4 h-4 text-gray-400 mt-1" />

      <div>
        <p className="text-xs text-gray-500">
          Severity
        </p>

        <span className="inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          {selectedDisaster.severity}
        </span>
      </div>

    </div>


    {/* Impact Radius */}
    <div className="flex items-start gap-3">

      <Layers3 className="w-4 h-4 text-gray-400 mt-1" />

      <div>
        <p className="text-xs text-gray-500">
          Impact Radius
        </p>

        <p className="text-sm font-medium text-gray-700 mt-1">
          {selectedDisaster.impact_extent?.radius_km ?? "—"} km
        </p>
      </div>

    </div>


    {/* Zone */}
    <div>
      <p className="text-xs text-gray-500">
        Zone
      </p>

      <p className="text-sm font-medium text-gray-700 mt-1">
        {selectedDisaster.zone_name || "Not assigned"}
      </p>
    </div>


    {/* Disaster ID */}
    <div className="border-t border-gray-100 pt-4">

      <p className="text-xs text-gray-500">
        Disaster ID
      </p>

      <p className="text-sm font-medium text-gray-700 mt-1">
        {selectedDisaster.disaster_id}
      </p>

    </div>

  </div>

) : (

  /* No disaster selected */

  <div className="mt-8">

    <div className="flex flex-col items-center justify-center text-center py-8">

      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <Info className="w-6 h-6 text-gray-400" />
      </div>

      <h3 className="text-sm font-semibold text-gray-800 mt-4">
        No disaster selected
      </h3>

      <p className="text-sm text-gray-500 mt-2 max-w-xs">
        Select a disaster from the map or the Disasters page
        to view its details.
      </p>

    </div>

  </div>

)}
</div>
</div>
      {/* Resource Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-200">

          <h2 className="text-lg font-semibold text-gray-900">
            Resource Demand
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Current resource requirements across affected areas
          </p>

        </div>

        <div className="p-5">
          <ResourceChart />
        </div>

      </div>

    </div>
  )
}

export default Dashboard