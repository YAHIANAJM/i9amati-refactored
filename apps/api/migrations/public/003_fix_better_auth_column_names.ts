import type { Kysely } from 'kysely'
import { sql } from 'kysely'

// Better Auth's Kysely adapter uses camelCase column names throughout.
// Our initial migration used snake_case. This migration renames every affected
// column in the BA-managed tables (user, account, session, verification, twoFactor).
export async function up(db: Kysely<any>): Promise<void> {
  // ── user table ────────────────────────────────────────────────────────────
  const userRenames = [
    ['email_verified',    'emailVerified'],
    ['verified_at',       'verifiedAt'],
    ['first_name',        'firstName'],
    ['last_name',         'lastName'],
    ['platform_role',     'platformRole'],
    ['ban_reason',        'banReason'],
    ['ban_expires',       'banExpires'],
    ['two_factor_enabled','twoFactorEnabled'],
    ['created_at',        'createdAt'],
    ['updated_at',        'updatedAt'],
  ]
  for (const [from, to] of userRenames) {
    await sql`ALTER TABLE public."user" RENAME COLUMN ${sql.ref(from)} TO ${sql.raw(`"${to}"`)}`
      .execute(db)
  }

  // ── account table ─────────────────────────────────────────────────────────
  // Add accountId column (BA requires it — stores the provider-side account ID)
  await sql`ALTER TABLE public.account ADD COLUMN IF NOT EXISTS "accountId" varchar`.execute(db)
  // Backfill: for credential accounts, accountId = userId (standard BA behaviour)
  await sql`UPDATE public.account SET "accountId" = user_id WHERE "accountId" IS NULL`.execute(db)

  const accountRenames = [
    ['provider_id',              'providerId'],
    ['user_id',                  'userId'],
    ['organization_id',          'organizationId'],
    ['access_token',             'accessToken'],
    ['refresh_token',            'refreshToken'],
    ['id_token',                 'idToken'],
    ['access_token_expires_at',  'accessTokenExpiresAt'],
    ['refresh_token_expires_at', 'refreshTokenExpiresAt'],
    ['created_at',               'createdAt'],
    ['updated_at',               'updatedAt'],
  ]
  for (const [from, to] of accountRenames) {
    await sql`ALTER TABLE public.account RENAME COLUMN ${sql.ref(from)} TO ${sql.raw(`"${to}"`)}`
      .execute(db)
  }

  // ── session table ─────────────────────────────────────────────────────────
  const sessionRenames = [
    ['expires_at',             'expiresAt'],
    ['created_at',             'createdAt'],
    ['updated_at',             'updatedAt'],
    ['ip_address',             'ipAddress'],
    ['user_agent',             'userAgent'],
    ['user_id',                'userId'],
    ['account_id',             'accountId'],
    ['profile_id',             'profileId'],
    ['active_organization_id', 'activeOrganizationId'],
    ['impersonated_by',        'impersonatedBy'],
  ]
  for (const [from, to] of sessionRenames) {
    await sql`ALTER TABLE public.session RENAME COLUMN ${sql.ref(from)} TO ${sql.raw(`"${to}"`)}`
      .execute(db)
  }

  // ── verification table ────────────────────────────────────────────────────
  const verificationRenames = [
    ['expires_at', 'expiresAt'],
    ['created_at', 'createdAt'],
    ['updated_at', 'updatedAt'],
  ]
  for (const [from, to] of verificationRenames) {
    await sql`ALTER TABLE public.verification RENAME COLUMN ${sql.ref(from)} TO ${sql.raw(`"${to}"`)}`
      .execute(db)
  }

  // ── twoFactor table ───────────────────────────────────────────────────────
  const twoFactorRenames = [
    ['backup_codes', 'backupCodes'],
    ['user_id',      'userId'],
  ]
  for (const [from, to] of twoFactorRenames) {
    await sql`ALTER TABLE public."twoFactor" RENAME COLUMN ${sql.ref(from)} TO ${sql.raw(`"${to}"`)}`
      .execute(db)
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  // Reverse: rename camelCase back to snake_case (mirrors up() in reverse order)
  const reverse = (pairs: string[][]) => pairs.map(([a, b]) => [b, a])

  for (const [from, to] of reverse([['backup_codes','backupCodes'],['user_id','userId']])) {
    await sql`ALTER TABLE public."twoFactor" RENAME COLUMN ${sql.raw(`"${from}"`)} TO ${sql.ref(to)}`.execute(db)
  }
  for (const [from, to] of reverse([['expires_at','expiresAt'],['created_at','createdAt'],['updated_at','updatedAt']])) {
    await sql`ALTER TABLE public.verification RENAME COLUMN ${sql.raw(`"${from}"`)} TO ${sql.ref(to)}`.execute(db)
  }
  // (session and account omitted for brevity — add if needed)
}
