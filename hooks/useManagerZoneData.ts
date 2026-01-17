import { useEffect, useState } from "react"
import type { HotelMapImage, MapObject, Sunbed } from "@/types/map"

interface ZoneData {
  id: string
  width: number
  height: number
  zoomLevel: number
  hotelMapImages: HotelMapImage[]
  sunbeds: Sunbed[]
  objects: MapObject[]
}

export function useManagerZoneData(hotelId: string, date?: string) {
  const [zone, setZone] = useState<ZoneData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hotelId) {
      setZone(null)
      setIsLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const params = new URLSearchParams({ hotelId })
    if (date) params.set("date", date)

    setIsLoading(true)
    setError(null)
    setZone(null)

    fetch(`/api/manager/zone?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(payload.error || "Failed to load zone")
        }
        return res.json()
      })
      .then((data) => {
        setZone(data.zone)
      })
      .catch((err) => {
        if (err.name === "AbortError") return
        setError(err.message || "Failed to load zone")
        setZone(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [hotelId, date])

  return { zone, isLoading, error }
}
