import { PrismaClient as PublicPrismaClient } from '@prisma/client'
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client'

const globalForPublicPrisma = globalThis as unknown as {
  publicPrisma: PublicPrismaClient | undefined
}

export const prisma = globalForPublicPrisma.publicPrisma ?? new PublicPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPublicPrisma.publicPrisma = prisma

const tenantPrismas: Record<string, TenantPrismaClient> = {}

export const getTenantPrisma = (tenantId: string): TenantPrismaClient => {
  if (!tenantPrismas[tenantId]) {
    const url = new URL(process.env.DATABASE_URL!)
    url.searchParams.set('schema', `org_${tenantId}`)
    tenantPrismas[tenantId] = new TenantPrismaClient({
      datasources: {
        db: {
          url: url.toString(),
        },
      },
    })
  }
  return tenantPrismas[tenantId]
}
