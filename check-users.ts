import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from './lib/prisma.ts'

async function main() {
  const users = await prisma.user.findMany()
  console.log('Users in database:', users)
}

main().catch(console.error).finally(() => prisma.$disconnect())
