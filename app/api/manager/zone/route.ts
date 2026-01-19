import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: Request) {
  const session = await auth()
  if (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const hotelId = searchParams.get("hotelId")
  const dateParam = searchParams.get("date")

  if (!hotelId) {
    return NextResponse.json({ error: "Missing hotelId" }, { status: 400 })
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true, managerId: true },
  })

  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
  }

  if (session.user?.role !== "ADMIN" && hotel.managerId !== session.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const bookingDate = dateParam
    ? new Date(Date.UTC(
        new Date(dateParam).getUTCFullYear(),
        new Date(dateParam).getUTCMonth(),
        new Date(dateParam).getUTCDate(),
      ))
    : null

  const hotelMapImages = await prisma.hotelMapImage.findMany({
    where: { hotelId: hotel.id },
    select: { hotelId: true, entityType: true, imageUrl: true },
  })

  if (dateParam) {
    const zone = await prisma.zone.findFirst({
      where: { hotelId: hotel.id },
      include: {
        sunbeds: {
          include: {
            bookings: {
              where: {
                date: bookingDate ?? undefined,
                status: { in: ["CONFIRMED", "MAINTENANCE"] },
              },
            },
          },
        },
        objects: true,
      },
    })

    if (!zone) {
      return NextResponse.json({ error: "No zone found" }, { status: 404 })
    }

    const sunbeds = zone.sunbeds.map((sb: (typeof zone.sunbeds)[number]) => {
      const booking = sb.bookings[0]
      const status = booking
        ? booking.status === "MAINTENANCE"
          ? "DISABLED"
          : "BOOKED"
        : "FREE"

      return {
        id: sb.id,
        label: sb.label,
        x: sb.x,
        y: sb.y,
        angle: sb.angle,
        scale: sb.scale,
        imageUrl: sb.imageUrl,
        status,
      }
    })

    return NextResponse.json({
      zone: {
        id: zone.id,
        width: zone.width,
        height: zone.height,
        zoomLevel: zone.zoomLevel,
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
      },
    })
  }

  const zone = await prisma.zone.findFirst({
    where: { hotelId: hotel.id },
    include: {
      sunbeds: true,
      objects: true,
    },
  })

  if (!zone) {
    return NextResponse.json({ error: "No zone found" }, { status: 404 })
  }

  const sunbeds = zone.sunbeds.map((sb: (typeof zone.sunbeds)[number]) => ({
    id: sb.id,
    label: sb.label,
    x: sb.x,
    y: sb.y,
    angle: sb.angle,
    scale: sb.scale,
    imageUrl: sb.imageUrl,
  }))

  return NextResponse.json({
    zone: {
      id: zone.id,
      width: zone.width,
      height: zone.height,
      zoomLevel: zone.zoomLevel,
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
    },
  })
}
