import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('feed_posts')
    .addColumn('media_url', 'varchar')
    .addColumn('media_type', 'varchar')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('feed_posts')
    .dropColumn('media_url')
    .dropColumn('media_type')
    .execute()
}
