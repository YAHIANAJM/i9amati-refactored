import { Kysely } from 'kysely'
import type { Database } from '../db/types'

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
    profileId:      string
    groupId:        string
    organizationId: string
    role?:          MemberRole
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
