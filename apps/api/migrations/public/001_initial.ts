import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Ensure public schema exists (it always does in Postgres, but explicit is fine)
  await sql`CREATE SCHEMA IF NOT EXISTS public`.execute(db)

  // ── Better Auth tables ────────────────────────────────────────────────────

  await db.schema
    .withSchema('public')
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('email', 'varchar', (c) => c.unique().notNull())
    .addColumn('email_verified', 'boolean', (c) => c.notNull().defaultTo(false))
    .addColumn('verified_at', 'timestamptz')
    .addColumn('image', 'varchar')
    .addColumn('first_name', 'varchar')
    .addColumn('last_name', 'varchar')
    .addColumn('phone', 'varchar')
    .addColumn('role', 'varchar')
    .addColumn('platform_role', 'varchar', (c) => c.notNull().defaultTo('USER'))
    .addColumn('banned', 'boolean', (c) => c.defaultTo(false))
    .addColumn('ban_reason', 'varchar')
    .addColumn('ban_expires', 'timestamptz')
    .addColumn('two_factor_enabled', 'boolean', (c) => c.defaultTo(false))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .withSchema('public')
    .createTable('account')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('provider_id', 'varchar', (c) => c.notNull())
    .addColumn('user_id', 'varchar', (c) => c.notNull().references('public.users.id').onDelete('cascade'))
    .addColumn('organization_id', 'varchar')
    .addColumn('access_token', 'text')
    .addColumn('refresh_token', 'text')
    .addColumn('id_token', 'text')
    .addColumn('access_token_expires_at', 'timestamptz')
    .addColumn('refresh_token_expires_at', 'timestamptz')
    .addColumn('scope', 'varchar')
    .addColumn('password', 'varchar')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .withSchema('public')
    .createTable('verification')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('identifier', 'varchar', (c) => c.notNull())
    .addColumn('value', 'varchar', (c) => c.notNull())
    .addColumn('expires_at', 'timestamptz', (c) => c.notNull())
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .withSchema('public')
    .createTable('twoFactor')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('secret', 'varchar', (c) => c.notNull())
    .addColumn('backup_codes', 'varchar', (c) => c.notNull())
    .addColumn('user_id', 'varchar', (c) => c.notNull().references('public.users.id').onDelete('cascade'))
    .addColumn('verified', 'boolean', (c) => c.defaultTo(true))
    .execute()

  // ── Org / Profile layer ───────────────────────────────────────────────────

  await db.schema
    .withSchema('public')
    .createTable('organizations')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('slug', 'varchar', (c) => c.unique().notNull())
    .addColumn('logo', 'varchar')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  // Add FK from account → organizations after organizations exists
  await sql`
    ALTER TABLE public.account
    ADD CONSTRAINT fk_account_organization
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL
  `.execute(db)

  await db.schema
    .withSchema('public')
    .createTable('profiles')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('user_id', 'varchar', (c) => c.notNull().references('public.users.id').onDelete('cascade'))
    .addColumn('organization_id', 'varchar', (c) => c.notNull().references('public.organizations.id').onDelete('cascade'))
    .addColumn('role', 'varchar', (c) => c.notNull())
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await sql`
    ALTER TABLE public.profiles
    ADD CONSTRAINT uq_profiles_user_org UNIQUE (user_id, organization_id)
  `.execute(db)

  await db.schema
    .withSchema('public')
    .createTable('session')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('expires_at', 'timestamptz', (c) => c.notNull())
    .addColumn('token', 'varchar', (c) => c.unique().notNull())
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .addColumn('ip_address', 'varchar')
    .addColumn('user_agent', 'varchar')
    .addColumn('user_id', 'varchar', (c) => c.notNull().references('public.users.id').onDelete('cascade'))
    .addColumn('account_id', 'varchar', (c) => c.references('public.account.id').onDelete('set null'))
    .addColumn('profile_id', 'varchar', (c) => c.references('public.profiles.id').onDelete('cascade'))
    .addColumn('active_organization_id', 'varchar')
    .addColumn('impersonated_by', 'varchar')
    .execute()

  await db.schema
    .withSchema('public')
    .createTable('invitations')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('email', 'varchar', (c) => c.notNull())
    .addColumn('invited_by_id', 'varchar', (c) => c.notNull().references('public.profiles.id').onDelete('cascade'))
    .addColumn('status', 'varchar', (c) => c.notNull().defaultTo('PENDING'))
    .addColumn('expires_at', 'timestamptz', (c) => c.notNull())
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute()

  // ── Platform-level extras ─────────────────────────────────────────────────

  await db.schema
    .withSchema('public')
    .createTable('legal_registration_residences')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('legal_registration_number', 'varchar', (c) => c.unique().notNull())
    .addColumn('org_id', 'varchar', (c) => c.notNull())
    .addColumn('res_id', 'varchar', (c) => c.notNull())
    .execute()

  await db.schema
    .withSchema('public')
    .createTable('shared_facilities')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('type', 'varchar', (c) => c.notNull())
    .addColumn('description', 'varchar')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .withSchema('public')
    .createTable('_shared_facility_links')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('org_id', 'varchar', (c) => c.notNull())
    .addColumn('shared_facility_id', 'varchar', (c) => c.notNull().references('public.shared_facilities.id'))
    .addColumn('residence_id', 'varchar')
    .addColumn('building_id', 'varchar')
    .execute()

  await sql`
    ALTER TABLE public._shared_facility_links ADD CONSTRAINT chk_exclusive_target
    CHECK (
      (building_id IS NOT NULL AND residence_id IS NULL) OR
      (building_id IS NULL AND residence_id IS NOT NULL)
    )
  `.execute(db)

  await db.schema
    .withSchema('public')
    .createTable('docs')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('type', 'varchar', (c) => c.notNull())
    .addColumn('parent_id', 'varchar')
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('created_by', 'varchar', (c) => c.notNull())
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await sql`
    ALTER TABLE public.docs ADD CONSTRAINT fk_docs_parent
    FOREIGN KEY (parent_id) REFERENCES public.docs(id) ON DELETE CASCADE
  `.execute(db)

  await db.schema
    .withSchema('public')
    .createTable('_docs_access')
    .ifNotExists()
    .addColumn('profile_id', 'varchar', (c) => c.notNull())
    .addColumn('folder_id', 'varchar', (c) => c.notNull().references('public.docs.id'))
    .addColumn('access_level', 'varchar', (c) => c.notNull().defaultTo('VIEW'))
    .addPrimaryKeyConstraint('pk_docs_access', ['folder_id', 'profile_id'])
    .execute()

  // ── Indexes ───────────────────────────────────────────────────────────────

  await db.schema.withSchema('public').createIndex('idx_session_user_id').ifNotExists().on('session').column('user_id').execute()
  await db.schema.withSchema('public').createIndex('idx_account_user_id').ifNotExists().on('account').column('user_id').execute()
  await db.schema.withSchema('public').createIndex('idx_account_org_id').ifNotExists().on('account').column('organization_id').execute()
  await db.schema.withSchema('public').createIndex('idx_profiles_user_id').ifNotExists().on('profiles').column('user_id').execute()
  await db.schema.withSchema('public').createIndex('idx_profiles_org_id').ifNotExists().on('profiles').column('organization_id').execute()
  await db.schema.withSchema('public').createIndex('idx_invitations_email').ifNotExists().on('invitations').column('email').execute()
  await db.schema.withSchema('public').createIndex('idx_verification_identifier').ifNotExists().on('verification').column('identifier').execute()
  await db.schema.withSchema('public').createIndex('idx_twofactor_user_id').ifNotExists().on('twoFactor').column('user_id').execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  const tables = [
    '_docs_access', 'docs', '_shared_facility_links', 'shared_facilities',
    'legal_registration_residences', 'invitations', 'session', 'profiles',
    'account', 'organizations', 'twoFactor', 'verification', 'users',
  ]
  for (const t of tables) {
    await db.schema.withSchema('public').dropTable(t).ifExists().execute()
  }
}
