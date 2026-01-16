import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import UserBookingClient from "@/components/booking/UserBookingClient"

export default async function BookingPage() {
  const session = await auth()
  if (!session) {
      redirect("/api/auth/signin?callbackUrl=/book")
  }

  const zone = await prisma.zone.findFirst({
    include: { sunbeds: true },
  })

  if (!zone) return <div>No zone found</div>

  const sunbeds = zone.sunbeds.map((sb) => ({
    id: sb.id,
    label: sb.label,
    x: sb.x,
    y: sb.y,
    angle: sb.angle,
    scale: sb.scale,
    status: "FREE" as const, 
  }))

  const zoneData = {
    id: zone.id,
    imageUrl: zone.imageUrl || "",
    width: zone.width,
    height: zone.height,
    sunbeds,
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Book Your Sunbed</h1>
        <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">
            Welcome, {session.user?.name || session.user?.email}
            </div>
             <form action={async () => {
                 'use server';
                 await import('@/auth').then(m => m.signOut({ redirectTo: "/" }));
             }}>
                <Button variant="outline" size="sm">Sign Out</Button>
             </form>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
        <p className="mb-4 text-slate-600">Select a date and click on a free sunbed (green) to confirm your reservation.</p>
        <UserBookingClient zoneData={zoneData} />
      </div>
    </div>
  )
}
