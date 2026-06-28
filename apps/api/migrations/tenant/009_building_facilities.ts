import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('buildings')
    .addColumn('facilities', 'jsonb', col => col.defaultTo('[]').notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('buildings')
    .dropColumn('facilities')
    .execute()
}
