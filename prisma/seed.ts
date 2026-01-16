import 'dotenv/config'
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Create Admin/Manager User
  const managerEmail = "manager@example.com"
  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {},
    create: {
      email: managerEmail,
      name: "Manager Alice",
      role: Role.MANAGER,
    },
  })

  // 2. Create Hotel
  const hotel = await prisma.hotel.upsert({
    where: { slug: "grand-beach-resort" },
    update: {},
    create: {
      name: "Grand Beach Resort",
      slug: "grand-beach-resort",
      description: "Luxury relaxation by the sea.",
      managerId: manager.id,
    },
  })

  // 3. Create Zone
  const zone = await prisma.zone.create({
    data: {
      name: "VIP Poolside",
      hotelId: hotel.id,
      imageUrl: "https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
      width: 1000,
      height: 800,
      sunbeds: {
        create: [
            { label: "A1", x: 0.2, y: 0.2, angle: 0 },
            { label: "A2", x: 0.3, y: 0.2, angle: 0 },
            { label: "B1", x: 0.2, y: 0.4, angle: 45 },
            { label: "B2", x: 0.3, y: 0.4, angle: 45 },
        ]
      }
    }
  })

  console.log({ manager, hotel, zone })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
