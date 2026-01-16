import { prisma } from "@/lib/prisma"
import EditorPageClient from "@/components/map/EditorPageClient"

export default async function DemoEditorPage() {
  const zone = await prisma.zone.findFirst({
    include: { sunbeds: true },
  })

  if (!zone) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">No zone found in database. Please run seed.</div>
      </div>
    )
  }

  // Transform to plain objects to avoid Date serialization warnings
  const sunbeds = zone.sunbeds.map((sb) => ({
    id: sb.id,
    label: sb.label,
    x: sb.x,
    y: sb.y,
    angle: sb.angle,
    scale: sb.scale,
    status: "FREE" as const, // Default for editor
  }))

  const zoneData = {
    id: zone.id,
    imageUrl: zone.imageUrl || "https://placeholder",
    width: zone.width,
    height: zone.height,
  }

  return <EditorPageClient initialSunbeds={sunbeds} zone={zoneData} />
}
