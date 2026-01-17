import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from './lib/prisma.ts'

async function main() {
  const users = await prisma.user.findMany()
  const accounts = await prisma.account.findMany()
  console.log('Users in database:', users.length)
  console.log('Accounts in database:', accounts.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
