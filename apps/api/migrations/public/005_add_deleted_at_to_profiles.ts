import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .withSchema('public')
    .alterTable('profiles')
    .addColumn('deleted_at', 'timestamptz')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .withSchema('public')
    .alterTable('profiles')
    .dropColumn('deleted_at')
    .execute()
}
