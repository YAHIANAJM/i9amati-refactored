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
              profile_id:             profile.id,
              active_organization_id: profile.organization_id,
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
      db.selectFrom('public.profiles').select('role').where('id', '=', profileId).executeTakeFirst(),
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

export function requirePermission(_resource: string, _action: string) {
  return (_req: Request, _res: Response, next: NextFunction) => next()
}
