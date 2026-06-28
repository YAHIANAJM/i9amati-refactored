import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('buildings')
    .addColumn('area_sqm', 'float8')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('buildings')
    .dropColumn('area_sqm')
    .execute()
}
