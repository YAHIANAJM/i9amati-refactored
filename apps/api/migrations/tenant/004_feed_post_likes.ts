import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('feed_post_likes')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('post_id', 'varchar', (c) =>
      c.notNull().references('feed_posts.id').onDelete('cascade'),
    )
    .addColumn('profile_group_id', 'varchar', (c) =>
      c.notNull().references('_profile_groups.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (c) =>
      c.notNull().defaultTo(sql`now()`),
    )
    .execute()

  // One like per member per post
  await sql`
    ALTER TABLE feed_post_likes
    ADD CONSTRAINT uq_feed_post_like UNIQUE (post_id, profile_group_id)
  `.execute(db)

  await db.schema
    .createIndex('idx_feed_post_likes_post')
    .ifNotExists()
    .on('feed_post_likes')
    .column('post_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('feed_post_likes').ifExists().execute()
}
