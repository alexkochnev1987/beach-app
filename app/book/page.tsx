import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import UserBookingClient from "@/components/booking/UserBookingClient"

export default async function BookingPage(props: { searchParams: Promise<{ date?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth()
  if (!session) {
      redirect("/api/auth/signin?callbackUrl=/book")
  }

  const dateParam = searchParams.date ? new Date(searchParams.date) : new Date()
  // Если дата пришла из URL, она обычно в формате YYYY-MM-DD, что при new Date() дает полночь UTC.
  // Если это 'new Date()', мы хотим полночь UTC именно сегодняшнего дня.
  const currentDate = searchParams.date 
    ? new Date(Date.UTC(dateParam.getUTCFullYear(), dateParam.getUTCMonth(), dateParam.getUTCDate()))
    : new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

  const zone = await prisma.zone.findFirst({
    include: { 
      sunbeds: {
        include: {
          bookings: {
            where: {
              date: currentDate,
              status: { in: ['CONFIRMED', 'MAINTENANCE'] }
            }
          }
        }
      } 
    },
  })

  if (!zone) return <div>No zone found</div>

  const sunbeds = zone.sunbeds.map((sb) => {
    const booking = sb.bookings[0];
    let status: 'FREE' | 'BOOKED' | 'DISABLED' = 'FREE';
    
    if (booking) {
      status = booking.status === 'MAINTENANCE' ? 'DISABLED' : 'BOOKED';
    }

    return {
      id: sb.id,
      label: sb.label,
      x: sb.x,
      y: sb.y,
      angle: sb.angle,
      scale: sb.scale,
      status, 
    };
  })

  const zoneData = {
    id: zone.id,
    imageUrl: zone.imageUrl || "",
    backgroundColor: zone.backgroundColor || "#F4E4C1",
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
                 const { signOut } = await import('@/auth')
                 await signOut({ redirectTo: "/" });
             }}>
                <Button variant="outline" size="sm">Sign Out</Button>
             </form>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
        <p className="mb-4 text-slate-600">Select a date and click on a free sunbed (green) to confirm your reservation.</p>
        <UserBookingClient 
            zoneData={zoneData} 
            initialDate={currentDate.toISOString()} 
        />
      </div>
    </div>
  )
}
