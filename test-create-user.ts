import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from './lib/prisma.ts'

async function main() {
  console.log('Attempting to create a test user...')
  try {
    const user = await prisma.user.create({
      data: {
        email: 'test-' + Date.now() + '@example.com',
        name: 'Test User',
      }
    })
    console.log('User created successfully:', user)
    
    // Clean up
    await prisma.user.delete({ where: { id: user.id } })
    console.log('User deleted successfully.')
  } catch (error) {
    console.error('Failed to create user:', error)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
