import { Request, Response, NextFunction } from 'express'
import type { Kysely } from 'kysely'
import { auth } from '../auth'
import { db } from '../db/db'
import type { Database } from '../db/types'
import { PlatformRole, ProfileRole } from '@i9amati/shared'

// TenantDB is a Kysely instance scoped to the org's schema via withSchema().
// All unqualified table names (residences, apartments, …) will resolve to
// "<orgSlug>"."<table>" automatically. Explicitly qualified names like
// 'public.profiles' remain untouched.
export type TenantDB = Kysely<Database>

export interface AuthRequest extends Request {
  userId: string
  platformRole: PlatformRole
  profileRole: ProfileRole
  profileId: string
  activeOrganizationId: string
  orgSlug: string
  tenantDb: TenantDB
  session: typeof auth.$Infer.Session.session
  user: typeof auth.$Infer.Session.user
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authReq = req as unknown as AuthRequest
  try {
    const session = await auth.api.getSession({ headers: req.headers as unknown as HeadersInit })

    if (!session?.session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    let profileId            = session.session.profileId
    let activeOrganizationId = session.session.activeOrganizationId

    // Fallback for sessions that were created before profile fields were set.
    // This keeps protected routes working after login without forcing a re-auth.
    if (!profileId || !activeOrganizationId) {
      const profile = await db
        .selectFrom('public.profiles')
        .select(['id', 'organization_id', 'role'])
        .where('user_id', '=', session.user.id)
        .where('deleted_at', 'is', null)
        .executeTakeFirst()

      if (profile) {
        profileId = profile.id
        activeOrganizationId = profile.organization_id

        // Persisting these fields is best-effort; requests should still pass
        // when we can derive org/profile directly from DB.
        try {
          await db
            .updateTable('public.session')
            .set({
              profileId:            profile.id,
              activeOrganizationId: profile.organization_id,
            })
            .where('id', '=', session.session.id)
            .execute()
        } catch (persistError) {
          console.warn('Auth session backfill warning:', persistError)
        }
      }
    }

    if (!profileId || !activeOrganizationId) {
      return res.status(401).json({ error: 'No active organization in session' })
    }

    const [org, profileRow] = await Promise.all([
      db.selectFrom('public.organizations').select('slug').where('id', '=', activeOrganizationId).executeTakeFirst(),
      db.selectFrom('public.profiles').select('role').where('id', '=', profileId).where('deleted_at', 'is', null).executeTakeFirst(),
    ])

    if (!org) {
      return res.status(401).json({ error: 'Organization not found' })
    }

    authReq.session              = session.session
    authReq.user                 = session.user
    authReq.userId               = session.user.id
    authReq.platformRole         = (session.user.platformRole as PlatformRole) ?? PlatformRole.USER
    authReq.profileRole          = (profileRow?.role as ProfileRole) ?? ProfileRole.OWNER
    authReq.profileId            = profileId
    authReq.activeOrganizationId = activeOrganizationId
    authReq.orgSlug              = org.slug
    // withSchema returns a new Kysely instance — zero overhead, same pool.
    authReq.tenantDb             = db.withSchema(org.slug)

    next()
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

// Role hierarchy — higher index = more access
const ROLE_RANK: Record<string, number> = {
  [ProfileRole.TENANT]: 0,
  [ProfileRole.OWNER]:  1,
  [ProfileRole.STAFF]:  2,
  [ProfileRole.SYNDIC]: 3,
}

// Minimum role required per resource+action
const REQUIRED_ROLE: Record<string, Record<string, ProfileRole>> = {
  residence:  { read: ProfileRole.STAFF,  create: ProfileRole.SYNDIC, update: ProfileRole.SYNDIC, delete: ProfileRole.SYNDIC },
  building:   { read: ProfileRole.STAFF,  create: ProfileRole.SYNDIC, update: ProfileRole.SYNDIC, delete: ProfileRole.SYNDIC },
  apartment:  { read: ProfileRole.OWNER,  create: ProfileRole.SYNDIC, update: ProfileRole.SYNDIC, delete: ProfileRole.SYNDIC },
  meeting:    { read: ProfileRole.OWNER,  create: ProfileRole.SYNDIC, update: ProfileRole.SYNDIC, delete: ProfileRole.SYNDIC },
  feed:       { read: ProfileRole.TENANT, create: ProfileRole.TENANT, update: ProfileRole.TENANT, delete: ProfileRole.SYNDIC },
  document:   { read: ProfileRole.OWNER,  create: ProfileRole.STAFF,  update: ProfileRole.STAFF,  delete: ProfileRole.SYNDIC },
  accounting: { read: ProfileRole.STAFF,  create: ProfileRole.SYNDIC, update: ProfileRole.SYNDIC, delete: ProfileRole.SYNDIC },
}

export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { profileRole } = req as AuthRequest
    const required = REQUIRED_ROLE[resource]?.[action]
    if (!required) return next() // unknown resource — allow (fail open during dev)
    if ((ROLE_RANK[profileRole] ?? -1) >= ROLE_RANK[required]) return next()
    return res.status(403).json({ error: 'Forbidden', code: 'ERROR_FORBIDDEN' })
  }
}
