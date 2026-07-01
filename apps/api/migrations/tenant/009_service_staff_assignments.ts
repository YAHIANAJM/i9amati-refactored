import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('service_staff_assignments')
    .addColumn('service_id', 'varchar', (col) => col.references('services.id').onDelete('cascade').notNull())
    .addColumn('profile_id', 'varchar', (col) => col.notNull()) // References public.profiles(id)
    .addColumn('assigned_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addPrimaryKeyConstraint('service_staff_assignments_pk', ['service_id', 'profile_id'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('service_staff_assignments').execute()
}
