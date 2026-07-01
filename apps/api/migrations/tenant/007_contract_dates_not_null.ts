import { sql } from 'kysely'
import type { Kysely } from 'kysely'
import type { Database } from '../../src/db/types'

export async function up(db: Kysely<Database>): Promise<void> {
  // Backfill any nulls before adding NOT NULL constraint
  await sql`UPDATE service_contracts SET start_date = CURRENT_DATE WHERE start_date IS NULL`.execute(db)
  await sql`UPDATE service_contracts SET end_date = (CURRENT_DATE + INTERVAL '1 year')::date WHERE end_date IS NULL`.execute(db)

  await sql`ALTER TABLE service_contracts ALTER COLUMN start_date SET NOT NULL`.execute(db)
  await sql`ALTER TABLE service_contracts ALTER COLUMN end_date SET NOT NULL`.execute(db)
}

export async function down(db: Kysely<Database>): Promise<void> {
  await sql`ALTER TABLE service_contracts ALTER COLUMN start_date DROP NOT NULL`.execute(db)
  await sql`ALTER TABLE service_contracts ALTER COLUMN end_date DROP NOT NULL`.execute(db)
}
