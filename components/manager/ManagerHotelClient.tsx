"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useManagerHotelData } from "@/hooks/useManagerHotelData"
import { deleteHotelById, updateHotelSettings } from "@/app/actions"

type HotelOption = { id: string; name: string }

export default function ManagerHotelClient({
  hotels,
  initialHotelId,
  isAdmin,
}: {
  hotels: HotelOption[]
  initialHotelId: string
  isAdmin: boolean
}) {
  const [hotelOptions, setHotelOptions] = useState(hotels)
  const [selectedHotelId, setSelectedHotelId] = useState(initialHotelId)
  const { hotel, isLoading, error } = useManagerHotelData(selectedHotelId)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setSelectedHotelId(initialHotelId)
    setHotelOptions(hotels)
  }, [initialHotelId, hotels])

  useEffect(() => {
    if (!hotel) return
    setName(hotel.name)
    setSlug(hotel.slug)
    setDescription(hotel.description ?? "")
    setMessage(null)
  }, [hotel])

  const handleSave = () => {
    if (!hotel) return
    setMessage(null)
    startTransition(async () => {
      const result = await updateHotelSettings({
        hotelId: hotel.id,
        name,
        slug,
        description: description || null,
      })
      if (result.success) {
        setMessage("Hotel updated.")
      } else {
        setMessage(result.error || "Failed to update hotel.")
      }
    })
  }

  const handleDelete = () => {
    if (!hotel) return
    setMessage(null)
    startTransition(async () => {
        const result = await deleteHotelById(hotel.id)
      if (result.success) {
        setMessage("Hotel deleted.")
        const nextHotelId = hotelOptions.find((item) => item.id !== hotel.id)?.id || ""
        setHotelOptions((prev) => prev.filter((item) => item.id !== hotel.id))
        setSelectedHotelId(nextHotelId)
      } else {
        setMessage(result.error || "Failed to delete hotel.")
      }
    })
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hotel Settings</h1>
        <div className="text-sm text-slate-500">Manager</div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="hotel-select">Hotel</Label>
            <select
              id="hotel-select"
              value={selectedHotelId}
              onChange={(event) => setSelectedHotelId(event.target.value)}
              className="h-9 w-[240px] rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              {hotelOptions.map((hotelOption) => (
                <option key={hotelOption.id} value={hotelOption.id}>
                  {hotelOption.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {hotelOptions.length === 0 ? (
            <div className="text-sm text-slate-500">No hotels available.</div>
          ) : isLoading || !hotel ? (
            <div className="text-sm text-slate-500">Loading hotel...</div>
          ) : (
            <>
              <div className="grid gap-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  disabled={!isAdmin}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" onClick={handleSave} disabled={isPending}>
                  Save changes
                </Button>
                {message && <span className="text-sm text-slate-600">{message}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {isAdmin && hotel && (
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-3 text-red-700">Danger zone</h2>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            Delete hotel
          </Button>
        </div>
      )}
    </div>
  )
}
