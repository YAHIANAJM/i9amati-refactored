import { Kysely } from 'kysely'
import type { Database } from '../db/types'
import { auth } from '../auth'
import { randomUUID } from 'crypto'

type MemberRole = 'USER' | 'ADMIN' | 'RIGHT_HAND'

/**
 * Adds a profile to a group after validating:
 *   - profile exists, belongs to the org, and is not soft-deleted
 *   - group exists in the tenant schema
 *   - role is derived from the profile's org role if not supplied (SYNDIC → ADMIN, others → USER)
 *   - duplicate membership is silently ignored
 *
 * Call with tenantDb or a tenantDb transaction — the `groups` table is unqualified
 * and therefore requires search_path to be set to the org schema.
 */
export async function linkProfileToGroup(
  db: Kysely<Database>,
  opts: {
    profileId: string
    groupId: string
    organizationId: string
    role?: MemberRole
  },
): Promise<boolean> {
  const { profileId, groupId, organizationId, role } = opts

  const profile = await db
    .selectFrom('public.profiles as p')
    .select(['p.id', 'p.role'])
    .where('p.id', '=', profileId)
    .where('p.organization_id', '=', organizationId)
    .where('p.deleted_at', 'is', null)
    .executeTakeFirst()

  if (!profile) return false

  const group = await db
    .selectFrom('groups')
    .select('id')
    .where('id', '=', groupId)
    .executeTakeFirst()

  if (!group) return false

  const memberRole: MemberRole = role ?? (profile.role === 'SYNDIC' ? 'ADMIN' : 'USER')

  await db
    .insertInto('_profile_groups')
    .values({ id: crypto.randomUUID(), group_id: groupId, profile_id: profileId, role: memberRole })
    .onConflict(oc => oc.doNothing())
    .execute()

  return true
}

/**
 * Looks up a profile in the org by the user's email address.
 * Returns the profile ID if found, null otherwise.
 */
export async function findProfileByEmail(
  db: Kysely<Database>,
  opts: { email: string; organizationId: string },
): Promise<string | null> {
  const user = await db
    .selectFrom('public.user as u')
    .select('u.id')
    .where('u.email', '=', opts.email)
    .executeTakeFirst()

  if (!user) return null

  const profile = await db
    .selectFrom('public.profiles as p')
    .select('p.id')
    .where('p.user_id', '=', user.id)
    .where('p.organization_id', '=', opts.organizationId)
    .where('p.deleted_at', 'is', null)
    .executeTakeFirst()

  return profile?.id ?? null
}

/**
 * Ensures a user account and an organization profile exist for the given email.
 * If the user does not exist, it creates one and sends a magic link.
 * If the profile does not exist for the org, it creates one with role 'OWNER' or 'USER'.
 * Returns the profile ID.
 */
export async function ensureProfileExistsForEmail(
  db: Kysely<Database>,
  opts: { email: string; firstName?: string; lastName?: string; organizationId: string }
): Promise<string> {
  // 1. Find user by email
  const user = await db.selectFrom('public.user').select('id').where('email', '=', opts.email).executeTakeFirst()
  let userId = user?.id

  if (!userId) {
    userId = randomUUID()
    await db.insertInto('public.user').values({
      id: userId,
      email: opts.email,
      name: `${opts.firstName || ''} ${opts.lastName || ''}`.trim() || opts.email.split('@')[0],
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: opts.firstName || '',
      lastName: opts.lastName || '',
      platformRole: 'USER',
    }).execute()

    try {
      await auth.api.signInMagicLink({
        body: { email: opts.email, callbackURL: process.env.FRONTEND_URL || 'http://localhost:3000' }
      } as any)
    } catch (e) {
      console.error('Failed to send magic link to', opts.email, e)
    }
  }

  // 2. Check if profile exists
  const profile = await db.selectFrom('public.profiles')
    .select('id')
    .where('user_id', '=', userId)
    .where('organization_id', '=', opts.organizationId)
    .executeTakeFirst()

  if (profile) {
    const activeProfile = await db.selectFrom('public.profiles')
      .select('id')
      .where('id', '=', profile.id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (activeProfile) return activeProfile.id

    await db.updateTable('public.profiles')
      .set({ deleted_at: null, updated_at: new Date() })
      .where('id', '=', profile.id)
      .execute()
    return profile.id
  }

  // 3. Create profile
  const profileId = randomUUID()
  await db.insertInto('public.profiles').values({
    id: profileId,
    user_id: userId,
    organization_id: opts.organizationId,
    role: 'OWNER', // Since they are apartment owners/shareholders
    updated_at: new Date()
  }).execute()

  return profileId
}

/**
 * Adds all SYNDIC profiles of the org as ADMIN to the given group.
 * Safe to call multiple times — duplicates are ignored.
 */
export async function addSyndicsToGroup(
  db: Kysely<Database>,
  opts: { groupId: string; organizationId: string },
): Promise<void> {
  const syndics = await db
    .selectFrom('public.profiles as p')
    .select('p.id')
    .where('p.organization_id', '=', opts.organizationId)
    .where('p.role', '=', 'SYNDIC')
    .where('p.deleted_at', 'is', null)
    .execute()

  if (syndics.length === 0) return

  await db
    .insertInto('_profile_groups')
    .values(syndics.map(s => ({ id: crypto.randomUUID(), group_id: opts.groupId, profile_id: s.id, role: 'ADMIN' as const })))
    .onConflict(oc => oc.doNothing())
    .execute()
}
