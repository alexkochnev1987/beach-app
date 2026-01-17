'use client'

import { useEffect, useState } from "react"
import EditorPageClient from "@/components/map/EditorPageClient"
import { useManagerZoneData } from "@/hooks/useManagerZoneData"

type HotelOption = { id: string; name: string }

export default function ManagerEditorClient({
  hotels,
  initialHotelId,
}: {
  hotels: HotelOption[]
  initialHotelId: string
}) {
  const [selectedHotelId, setSelectedHotelId] = useState(initialHotelId)
  const { zone, isLoading, error } = useManagerZoneData(selectedHotelId)

  useEffect(() => {
    setSelectedHotelId(initialHotelId)
  }, [initialHotelId])

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (isLoading && !zone) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Loading map...
      </div>
    )
  }

  if (!zone) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        No zone found for this hotel.
      </div>
    )
  }

  return (
    <EditorPageClient
      key={zone.id}
      hotels={hotels}
      currentHotelId={selectedHotelId}
      onHotelChange={setSelectedHotelId}
      initialSunbeds={zone.sunbeds}
      initialObjects={zone.objects}
      hotelMapImages={zone.hotelMapImages}
      zone={{
        id: zone.id,
        width: zone.width,
        height: zone.height,
        zoomLevel: zone.zoomLevel || 1.0,
      }}
    />
  )
}
