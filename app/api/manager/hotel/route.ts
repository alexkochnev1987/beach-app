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

  if (!hotelId) {
    return NextResponse.json({ error: "Missing hotelId" }, { status: 400 })
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true, name: true, slug: true, description: true, managerId: true },
  })

  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
  }

  if (session.user?.role !== "ADMIN" && hotel.managerId !== session.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    hotel: {
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      description: hotel.description,
    },
  })
}
