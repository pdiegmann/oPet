import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaPg } from '@prisma/adapter-pg'
import { resolve } from 'path'

// Ensure DATABASE_URL is always defined. When no PostgreSQL connection string
// is provided the server falls back to a local SQLite database.  The Prisma
// client must have been generated for the SQLite provider beforehand (the
// `prepare-db` script handles this automatically via the prestart/predev hooks).
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${resolve(import.meta.dir, '..', 'opet.db')}`
}

const databaseUrl = process.env.DATABASE_URL
const isPostgres =
  databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')
const adapter = isPostgres
  ? new PrismaPg(databaseUrl)
  : new PrismaLibSql({ url: databaseUrl })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
