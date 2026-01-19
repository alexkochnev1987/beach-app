import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import UserBookingClient from "@/components/booking/UserBookingClient";
import { Label } from "@/components/ui/label";

const normalizeToNoon = (value: Date) => {
  const next = new Date(value);
  next.setHours(12, 0, 0, 0);
  return next;
};

export default async function BookingPage(props: {
  searchParams: Promise<{ date?: string; hotelId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/book");
  }

  const hotels = await prisma.hotel.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (hotels.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        No hotels found. Please contact admin.
      </div>
    );
  }

  const requestedHotelId = searchParams.hotelId;
  const selectedHotelId =
    hotels.find((hotel) => hotel.id === requestedHotelId)?.id || hotels[0].id;
  if (!requestedHotelId || requestedHotelId !== selectedHotelId) {
    const dateParam = searchParams.date
      ? `&date=${encodeURIComponent(searchParams.date)}`
      : "";
    redirect(
      `/book?hotelId=${encodeURIComponent(selectedHotelId)}${dateParam}`,
    );
  }

  const dateParam = searchParams.date
    ? new Date(searchParams.date)
    : new Date();

  const currentDate = normalizeToNoon(searchParams.date ? dateParam : new Date());

  const zone = await prisma.zone.findFirst({
    where: { hotelId: selectedHotelId },
    include: {
      sunbeds: {
        include: {
          bookings: {
            where: {
              date: currentDate,
              status: { in: ["CONFIRMED", "MAINTENANCE"] },
            },
            select: {
              status: true,
              userId: true,
            },
          },
        },
      },
      objects: true,
    },
  });

  const hotelMapImages = await prisma.hotelMapImage.findMany({
    where: { hotelId: selectedHotelId },
    select: { hotelId: true, entityType: true, imageUrl: true },
  });

  if (!zone)
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        No zone found for this hotel.
      </div>
    );

  const sunbeds = zone.sunbeds.map((sb: (typeof zone.sunbeds)[number]) => {
    const booking = sb.bookings[0];
    let status: "FREE" | "BOOKED" | "DISABLED" = "FREE";
    const bookedByMe = !!booking?.userId && booking.userId === session.user?.id;

    if (booking) {
      status = booking.status === "MAINTENANCE" ? "DISABLED" : "BOOKED";
    }

    return {
      id: sb.id,
      label: sb.label,
      x: sb.x,
      y: sb.y,
      angle: sb.angle,
      scale: sb.scale,
      imageUrl: sb.imageUrl,
      status,
      bookedByMe,
    };
  });

  const zoneData = {
    id: zone.id,
    width: zone.width,
    height: zone.height,
    zoomLevel: zone.zoomLevel || 1.0,
    hotelMapImages,
    sunbeds,
    objects: zone.objects.map((obj: (typeof zone.objects)[number]) => ({
      id: obj.id,
      type: obj.type,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      angle: obj.angle,
      backgroundColor: obj.backgroundColor,
      imageUrl: obj.imageUrl,
    })),
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Book Your Sunbed</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500">
            Welcome, {session.user?.name || session.user?.email}
          </div>
          <form
            action={async () => {
              "use server";
              const { signOut } = await import("@/auth");
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="outline" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
        <form
          action="/book"
          method="get"
          className="mb-4 flex flex-wrap items-end gap-3"
        >
          <div className="grid gap-1">
            <Label htmlFor="hotelId">Hotel</Label>
            <select
              id="hotelId"
              name="hotelId"
              defaultValue={selectedHotelId}
              className="h-9 w-60 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>
          {searchParams.date ? (
            <input type="hidden" name="date" value={searchParams.date} />
          ) : null}
          <Button type="submit" variant="outline" size="sm">
            Choose
          </Button>
        </form>
        <p className="mb-4 text-slate-600">
          Select a date and click on a free sunbed (green) to confirm your
          reservation.
        </p>
        <UserBookingClient
          zoneData={zoneData}
          initialDate={currentDate.toISOString()}
          canCancelAny={
            session.user?.role === "ADMIN" || session.user?.role === "MANAGER"
          }
        />
      </div>
    </div>
  );
}
