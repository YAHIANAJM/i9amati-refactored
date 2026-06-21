import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_profiles_role
    CHECK (role IN ('SYNDIC', 'OWNER', 'TENANT', 'STAFF'))
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS chk_profiles_role
  `.execute(db)
}
