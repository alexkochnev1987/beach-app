import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from '@/lib/prisma'

async function main() {
  console.log('Clearing existing data...')
  await prisma.booking.deleteMany()
  await prisma.sunbed.deleteMany()
  await prisma.mapObject.deleteMany()
  await prisma.zone.deleteMany()
  await prisma.hotel.deleteMany()
  // User deletion might be tricky if there are many users, but let's clear them too if needed.
  // Generally it's safer to clear everything related to the business logic.
  
  console.log('Seeding database...')

  // Create a Hotel
  const hotel = await prisma.hotel.upsert({
    where: { slug: 'blue-lagoon-resort' },
    update: {},
    create: {
      name: 'Blue Lagoon Resort',
      slug: 'blue-lagoon-resort',
      description: 'The most beautiful beach resort in the world.',
    },
  })

  // Create a Zone for this hotel
  const zone = await prisma.zone.create({
    data: {
      name: 'Beach East',
      hotelId: hotel.id,
      width: 1200,
      height: 800,
    },
  })

  // Create some sunbeds in a grid
  const sunbeds = []
  const rows = 4
  const cols = 6
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      sunbeds.push({
        label: `${String.fromCharCode(65 + r)}${c + 1}`,
        x: 0.2 + c * 0.12,
        y: 0.3 + r * 0.15,
        angle: 0,
        scale: 1,
        zoneId: zone.id,
      })
    }
  }

  await prisma.sunbed.createMany({
    data: sunbeds,
  })

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
