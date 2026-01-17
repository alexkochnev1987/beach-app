import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ManagerEditorClient from "@/components/manager/ManagerEditorClient"

export default async function ManagerEditorPage(props: {
  searchParams: Promise<{ hotelId?: string }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()
  if (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN")) {
    redirect("/api/auth/signin")
  }

  const isAdmin = session.user?.role === "ADMIN"
  const hotels = isAdmin
    ? await prisma.hotel.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    : await prisma.hotel.findMany({
        where: { managerId: session.user.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })

  if (hotels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">No managed hotels assigned yet.</div>
      </div>
    )
  }

  const requestedHotelId = searchParams.hotelId
  const initialHotelId = hotels.find((hotel) => hotel.id === requestedHotelId)?.id || hotels[0].id

  return <ManagerEditorClient hotels={hotels} initialHotelId={initialHotelId} />
}
