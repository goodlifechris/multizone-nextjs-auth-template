// lib/prisma.ts
import { PrismaClient } from '../database/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// This is to prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // In production, always create a new instance
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  })
  
  prisma = new PrismaClient({ adapter })
} else {
  // In development, use a global instance to prevent hot reload issues
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    })
    
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  prisma = globalForPrisma.prisma
}

export { prisma }