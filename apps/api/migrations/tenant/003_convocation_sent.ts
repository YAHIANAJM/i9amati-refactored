import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS convocation_sent_at timestamptz`.execute(db)
  await sql`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS building_id varchar REFERENCES buildings(id) ON DELETE SET NULL`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE meetings DROP COLUMN IF EXISTS building_id`.execute(db)
  await sql`ALTER TABLE meetings DROP COLUMN IF EXISTS convocation_sent_at`.execute(db)
}
