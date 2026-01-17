import { useEffect, useState } from "react"

interface HotelData {
  id: string
  name: string
  slug: string
  description: string | null
}

export function useManagerHotelData(hotelId: string) {
  const [hotel, setHotel] = useState<HotelData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hotelId) {
      setHotel(null)
      setIsLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const params = new URLSearchParams({ hotelId })

    setIsLoading(true)
    setError(null)
    setHotel(null)

    fetch(`/api/manager/hotel?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(payload.error || "Failed to load hotel")
        }
        return res.json()
      })
      .then((data) => {
        setHotel(data.hotel)
      })
      .catch((err) => {
        if (err.name === "AbortError") return
        setError(err.message || "Failed to load hotel")
        setHotel(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [hotelId])

  return { hotel, isLoading, error }
}
