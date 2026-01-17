import { prisma } from "@/lib/prisma"
import EditorPageClient from "@/components/map/EditorPageClient"

export default async function DemoEditorPage() {
  const zone = await prisma.zone.findFirst({
    include: { 
      sunbeds: true,
      objects: true
    },
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

  const objects = zone.objects.map((obj) => ({
    id: obj.id,
    type: obj.type as 'SEA' | 'POOL' | 'HOTEL',
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
    angle: obj.angle
  }))

  const zoneData = {
    id: zone.id,
    backgroundColor: zone.backgroundColor || "#F4E4C1",
    width: zone.width,
    height: zone.height,
    zoomLevel: zone.zoomLevel
  }

  return <EditorPageClient initialSunbeds={sunbeds} initialObjects={objects} zone={zoneData} />
}
