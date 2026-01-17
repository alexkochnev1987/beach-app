import { prisma } from "@/lib/prisma"
import ManagerCalendarClient from "@/components/manager/ManagerCalendarClient"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { startOfDay } from "date-fns"

export default async function ManagerCalendarPage({ params, searchParams }: { params: { hotelId: string }, searchParams: { date?: string } }) {
  const session = await auth()
  if (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN")) {
      redirect("/api/auth/signin")
  }

  const dateParam = searchParams.date ? new Date(searchParams.date) : new Date()
  const currentDate = startOfDay(dateParam)

  // In a real app we'd filter by hotelId, for now we just take the first zone
  const zone = await prisma.zone.findFirst({
    include: { 
      sunbeds: {
        include: {
          bookings: {
            where: {
              date: currentDate
            }
          }
        }
      } 
    },
  })

  if (!zone) {
    return <div>No zone found. Please seed DB.</div>
  }

  const sunbeds = zone.sunbeds.map((sb) => ({
    id: sb.id,
    label: sb.label,
    x: sb.x,
    y: sb.y,
    angle: sb.angle,
    scale: sb.scale,
    status: (sb.bookings[0]?.status as any) || "FREE", 
  }))

  const zoneData = {
    id: zone.id,
    imageUrl: zone.imageUrl || "",
    backgroundColor: zone.backgroundColor || "#F4E4C1",
    width: zone.width,
    height: zone.height,
    sunbeds,
  }

  return <ManagerCalendarClient zoneData={zoneData} initialDate={currentDate.toISOString()} />
}
