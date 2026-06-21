import type { Kysely } from 'kysely'
import { sql } from 'kysely'

// Extends the meetings table with convocation tracking and replaces the JSON
// agenda blob with a proper agenda_items table. Also adds meeting_attendees with
// RSVP + physical presence (pointage) support as required by Loi 18-00.
export async function up(db: Kysely<any>): Promise<void> {
  // ── Extend meetings ────────────────────────────────────────────────────────

  await sql`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS convocation_number smallint NOT NULL DEFAULT 1`.execute(db)
  await sql`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS total_eligible integer NOT NULL DEFAULT 0`.execute(db)
  await sql`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS residence_id varchar REFERENCES residences(id) ON DELETE SET NULL`.execute(db)

  // Remove the old JSON blob — replaced by agenda_items below
  await sql`ALTER TABLE meetings DROP COLUMN IF EXISTS agenda`.execute(db)

  // ── agenda_items ──────────────────────────────────────────────────────────

  await db.schema
    .createTable('agenda_items')
    .ifNotExists()
    .addColumn('id',          'varchar',   c => c.primaryKey())
    .addColumn('meeting_id',  'varchar',   c => c.notNull().references('meetings.id').onDelete('cascade'))
    .addColumn('title',       'varchar',   c => c.notNull())
    .addColumn('description', 'text')
    .addColumn('vote_status', 'varchar',   c => c.notNull().defaultTo('PENDING'))
    .addColumn('pour',        'integer',   c => c.notNull().defaultTo(0))
    .addColumn('contre',      'integer',   c => c.notNull().defaultTo(0))
    .addColumn('abstention',  'integer',   c => c.notNull().defaultTo(0))
    .addColumn('result',      'varchar')   // ADOPTED | REJECTED | null (tie pending president)
    .addColumn('sort_order',  'integer',   c => c.notNull().defaultTo(0))
    .addColumn('created_at',  'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at',  'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createIndex('idx_agenda_items_meeting')
    .ifNotExists()
    .on('agenda_items')
    .column('meeting_id')
    .execute()

  // ── meeting_attendees ─────────────────────────────────────────────────────

  await db.schema
    .createTable('meeting_attendees')
    .ifNotExists()
    .addColumn('id',         'varchar',     c => c.primaryKey())
    .addColumn('meeting_id', 'varchar',     c => c.notNull().references('meetings.id').onDelete('cascade'))
    .addColumn('profile_id', 'varchar')     // nullable FK to public.profiles (cross-schema)
    .addColumn('name',       'varchar',     c => c.notNull())
    .addColumn('apartment',  'varchar',     c => c.notNull())
    .addColumn('rsvp',       'varchar',     c => c.notNull().defaultTo('PENDING'))  // ACCEPTED | DECLINED | PENDING
    .addColumn('present',    'boolean',     c => c.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', c => c.notNull().defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createIndex('idx_meeting_attendees_meeting')
    .ifNotExists()
    .on('meeting_attendees')
    .column('meeting_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('meeting_attendees').ifExists().execute()
  await db.schema.dropTable('agenda_items').ifExists().execute()
  await sql`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS agenda json NOT NULL DEFAULT '[]'::json`.execute(db)
  await sql`ALTER TABLE meetings DROP COLUMN IF EXISTS residence_id`.execute(db)
  await sql`ALTER TABLE meetings DROP COLUMN IF EXISTS total_eligible`.execute(db)
  await sql`ALTER TABLE meetings DROP COLUMN IF EXISTS convocation_number`.execute(db)
}
