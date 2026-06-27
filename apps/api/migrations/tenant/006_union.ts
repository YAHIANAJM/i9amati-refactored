import type { Kysely } from 'kysely'
import { sql } from 'kysely'

// Active delegates use the EXISTING groups + _profile_groups.RIGHT_HAND mechanism.
//
// delegate_invitations: stores building assignment + metadata for PENDING invites
// (before the invitee has signed up). Once they accept, a _profile_groups.RIGHT_HAND
// row is created and this record can be kept as a reference or cleaned up.
//
// partner_syndics: genuinely new concept — no equivalent in the schema.

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('delegate_invitations')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('invitation_id', 'varchar', (c) => c.notNull())
    .addColumn('display_name', 'varchar', (c) => c.notNull())
    .addColumn('phone', 'varchar')
    .addColumn('gender', 'varchar', (c) => c.notNull().defaultTo('male'))
    .addColumn('building_id', 'varchar')
    .addColumn('note', 'varchar')
    .addColumn('status', 'varchar', (c) => c.notNull().defaultTo('PENDING'))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createTable('partner_syndics')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('email', 'varchar', (c) => c.notNull())
    .addColumn('phone', 'varchar')
    .addColumn('gender', 'varchar', (c) => c.notNull().defaultTo('male'))
    .addColumn('residence', 'varchar', (c) => c.notNull())
    .addColumn('note', 'varchar')
    .addColumn('linked_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('delegate_invitations').ifExists().execute()
  await db.schema.dropTable('partner_syndics').ifExists().execute()
}
