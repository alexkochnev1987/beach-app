import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  console.log('🔌 Инициализация Prisma 7 с адаптером PG...')
  
  // Используем ваш DATABASE_URL напрямую
  const connectionString = process.env.DATABASE_URL

  const pool = new pg.Pool({ 
    connectionString,
    // Для Neon/Vercel Postgres SSL обязателен
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
