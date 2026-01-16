import { prisma } from "@/lib/prisma"
import ManagerCalendarClient from "@/components/manager/ManagerCalendarClient"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function ManagerCalendarPage({ params }: { params: { hotelId: string } }) {
  const session = await auth()
  if (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN")) {
      redirect("/api/auth/signin")
  }

  // In a real app we'd filter by hotelId, for now we just take the first zone
  // const hotelId = params.hotelId
  const zone = await prisma.zone.findFirst({
    include: { sunbeds: true },
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
    status: "FREE" as const, // Initial Client-side state
  }))

  const zoneData = {
    id: zone.id,
    imageUrl: zone.imageUrl || "",
    width: zone.width,
    height: zone.height,
    sunbeds,
  }

  return <ManagerCalendarClient zoneData={zoneData} />
}
