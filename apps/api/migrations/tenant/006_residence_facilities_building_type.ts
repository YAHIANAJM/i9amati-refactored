import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('residences')
    .addColumn('facilities', 'jsonb', (c) => c.notNull().defaultTo(sql`'[]'::jsonb`))
    .execute()

  await db.schema
    .alterTable('buildings')
    .addColumn('union_type', 'varchar')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('residences')
    .dropColumn('facilities')
    .execute()

  await db.schema
    .alterTable('buildings')
    .dropColumn('union_type')
    .execute()
}
