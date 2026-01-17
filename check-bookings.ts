import { PrismaClient } from '@prisma/client'
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

async function main() {
  const connectionString = process.env.DATABASE_URL
  const pool = new pg.Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const bookings = await prisma.booking.findMany({
    orderBy: { date: 'desc' },
    include: { sunbed: true }
  })
  
  console.log('--- ALL BOOKINGS ---')
  bookings.forEach(b => {
    console.log(`Sunbed: ${b.sunbed.label} (#${b.sunbedId}), Date: ${b.date.toISOString()}, Status: ${b.status}`)
  })
  
  const zones = await prisma.zone.findMany({ include: { _count: { select: { sunbeds: true } } } })
  console.log('--- ZONES ---')
  zones.forEach(z => {
     console.log(`Zone: ${z.name} (ID: ${z.id}), Sunbeds: ${z._count.sunbeds}`)
  })

  await prisma.$disconnect()
}

main().catch(console.error)
