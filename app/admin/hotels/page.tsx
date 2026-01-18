import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

async function createHotel(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/api/auth/signin?callbackUrl=/admin/hotels")
  }

  const name = String(formData.get("name") || "").trim()
  const rawSlug = String(formData.get("slug") || "").trim()
  const description = String(formData.get("description") || "").trim() || null

  if (!name) {
    redirect("/admin/hotels?error=missing")
  }

  const slug = rawSlug || slugify(name)
  if (!slug) {
    redirect("/admin/hotels?error=slug")
  }

  const existing = await prisma.hotel.findUnique({ where: { slug } })
  if (existing) {
    redirect("/admin/hotels?error=exists")
  }

  const hotel = await prisma.hotel.create({
    data: { name, slug, description },
  })

  await prisma.zone.create({
    data: {
      name: "Main Zone",
      hotelId: hotel.id,
    },
  })

  revalidatePath("/admin/hotels")
  redirect("/admin/hotels?created=1")
}

export default async function AdminHotelsPage(props: {
  searchParams: Promise<{ created?: string; error?: string }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/api/auth/signin?callbackUrl=/admin/hotels")
  }

  const hotels = await prisma.hotel.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { zones: true } } },
  })

  const errorMessage =
    searchParams.error === "missing"
      ? "Please provide a hotel name."
      : searchParams.error === "slug"
        ? "Slug is required (only latin letters, numbers, and dashes)."
        : searchParams.error === "exists"
          ? "Slug already exists. Please choose another one."
          : null

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hotel Admin</h1>
        <div className="text-sm text-slate-500">
          {session.user?.name || session.user?.email}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-3">Create a new hotel</h2>
        {searchParams.created === "1" && (
          <div className="mb-3 text-sm text-green-600">Hotel created.</div>
        )}
        {errorMessage && (
          <div className="mb-3 text-sm text-red-600">{errorMessage}</div>
        )}
        <form action={createHotel} className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Sunrise Beach Resort" required />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" placeholder="sunrise-beach-resort" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optional short description" />
          </div>
          <div>
            <Button type="submit">Create hotel</Button>
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold mb-3">Existing hotels</h2>
        {hotels.length === 0 ? (
          <div className="text-sm text-slate-600">No hotels yet.</div>
        ) : (
          <div className="grid gap-2">
            {hotels.map((hotel: (typeof hotels)[number]) => (
              <div key={hotel.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{hotel.name}</div>
                  <div className="text-slate-500">/{hotel.slug}</div>
                </div>
                <div className="text-slate-500">{hotel._count.zones} zones</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
