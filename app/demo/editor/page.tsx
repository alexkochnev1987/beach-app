import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DemoEditorPage() {
  const session = await auth()
  if (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN")) {
    redirect("/api/auth/signin")
  }

  const isAdmin = session.user?.role === "ADMIN"
  const hotels = await prisma.hotel.findMany({
    where: isAdmin ? undefined : { managerId: session.user.id },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  })

  if (hotels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">No managed hotels assigned yet.</div>
      </div>
    )
  }

  redirect(`/manager/editor?hotelId=${encodeURIComponent(hotels[0].id)}`)
}
