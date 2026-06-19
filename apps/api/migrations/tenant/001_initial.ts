import type { Kysely } from 'kysely'
import { sql } from 'kysely'

// This migration is applied to every tenant schema (one per org slug).
// The `db` instance passed in is already scoped to the correct schema
// via withSchema(orgSlug) — so no withSchema() calls are needed here.
// Cross-schema FK constraints to public.profiles are added via raw SQL
// at the end — Postgres enforces them because public schema always exists.

export async function up(db: Kysely<any>): Promise<void> {

  await db.schema
    .createTable('residences')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('address', 'varchar', (c) => c.notNull())
    .addColumn('city', 'varchar')
    .addColumn('titre_foncier', 'varchar')
    .addColumn('status', 'varchar', (c) => c.notNull().defaultTo('ACTIVE'))
    .addColumn('image', 'varchar')
    .addColumn('description', 'varchar')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .createTable('buildings')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('address', 'varchar')
    .addColumn('image', 'varchar')
    .addColumn('floors', 'integer')
    .addColumn('has_elevator', 'boolean', (c) => c.notNull().defaultTo(false))
    .addColumn('description', 'varchar')
    .addColumn('residence_id', 'varchar', (c) => c.notNull().references('residences.id'))
    .addColumn('quote_part', 'float8')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .createTable('apartments')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('unit_code', 'varchar', (c) => c.notNull())
    .addColumn('lot_number', 'varchar')
    .addColumn('floor', 'integer')
    .addColumn('area_sqm', 'float8')
    .addColumn('status', 'varchar', (c) => c.notNull().defaultTo('VACANT'))
    .addColumn('usage_type', 'varchar', (c) => c.notNull().defaultTo('RESIDENTIAL'))
    .addColumn('quote_part', 'float8')
    .addColumn('building_id', 'varchar', (c) => c.notNull().references('buildings.id'))
    .addColumn('owner_profile_id', 'varchar')  // FK added below via raw SQL → public.profiles
    .addColumn('shareholders', 'jsonb', (c) => c.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .createTable('payments')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('amount', 'float8', (c) => c.notNull())
    .addColumn('status', 'varchar', (c) => c.notNull().defaultTo('PENDING'))
    .addColumn('type', 'varchar', (c) => c.notNull().defaultTo('CHARGE'))
    .addColumn('method', 'varchar')
    .addColumn('due_date', 'timestamptz', (c) => c.notNull())
    .addColumn('paid_at', 'timestamptz')
    .addColumn('description', 'varchar')
    .addColumn('apartment_id', 'varchar', (c) => c.notNull().references('apartments.id'))
    .addColumn('paid_by', 'varchar', (c) => c.notNull())  // FK → public.profiles
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .createTable('complaints')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('title', 'varchar', (c) => c.notNull())
    .addColumn('description', 'varchar', (c) => c.notNull())
    .addColumn('status', 'varchar', (c) => c.notNull().defaultTo('OPEN'))
    .addColumn('priority', 'varchar', (c) => c.notNull().defaultTo('MEDIUM'))
    .addColumn('apartment_id', 'varchar', (c) => c.notNull().references('apartments.id'))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .createTable('meetings')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('title', 'varchar', (c) => c.notNull())
    .addColumn('description', 'varchar')
    .addColumn('status', 'varchar', (c) => c.notNull().defaultTo('SCHEDULED'))
    .addColumn('type', 'varchar', (c) => c.notNull())
    .addColumn('scheduled_at', 'timestamptz', (c) => c.notNull())
    .addColumn('location', 'varchar')
    .addColumn('agenda', 'json', (c) => c.notNull().defaultTo(sql`'[]'::json`))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .createTable('meetings_members')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('meeting_id', 'varchar', (c) => c.notNull().references('meetings.id'))
    .addColumn('member_id', 'varchar', (c) => c.notNull())  // FK → public.profiles
    .execute()

  await sql`
    ALTER TABLE meetings_members
    ADD CONSTRAINT uq_meeting_member UNIQUE (meeting_id, member_id)
  `.execute(db)

  await db.schema
    .createTable('groups')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('slug', 'varchar', (c) => c.unique().notNull())
    .addColumn('residence_id', 'varchar', (c) => c.references('residences.id'))
    .addColumn('building_id', 'varchar', (c) => c.references('buildings.id'))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await sql`
    ALTER TABLE groups ADD CONSTRAINT chk_group_target
    CHECK (residence_id IS NULL OR building_id IS NULL)
  `.execute(db)

  await db.schema
    .createTable('_profile_groups')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('group_id', 'varchar', (c) => c.notNull().references('groups.id'))
    .addColumn('profile_id', 'varchar', (c) => c.notNull())  // FK → public.profiles
    .addColumn('role', 'varchar', (c) => c.notNull().defaultTo('USER'))
    .execute()

  await sql`
    ALTER TABLE _profile_groups
    ADD CONSTRAINT uq_profile_group UNIQUE (group_id, profile_id)
  `.execute(db)

  await db.schema
    .createTable('feed_posts')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('content', 'varchar', (c) => c.notNull())
    .addColumn('author_id', 'varchar', (c) => c.notNull().references('_profile_groups.id'))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await db.schema
    .createTable('feed_comments')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('content', 'varchar', (c) => c.notNull())
    .addColumn('author_profile_id', 'varchar', (c) => c.notNull())  // FK → public.profiles
    .addColumn('post_id', 'varchar', (c) => c.notNull().references('feed_posts.id').onDelete('cascade'))
    .addColumn('parent_id', 'varchar')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute()

  await sql`
    ALTER TABLE feed_comments ADD CONSTRAINT fk_feed_comment_parent
    FOREIGN KEY (parent_id) REFERENCES feed_comments(id) ON DELETE NO ACTION
  `.execute(db)

  await db.schema
    .createTable('documents')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('type', 'varchar', (c) => c.notNull())
    .addColumn('parent_id', 'varchar')
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('path', 'varchar')
    .addColumn('size', 'integer')
    .addColumn('uploaded_by', 'varchar', (c) => c.notNull())  // FK → public.profiles
    .addColumn('uploaded_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull())
    .execute()

  await sql`
    ALTER TABLE documents ADD CONSTRAINT fk_document_parent
    FOREIGN KEY (parent_id) REFERENCES documents(id) ON DELETE CASCADE
  `.execute(db)

  await sql`
    ALTER TABLE documents ADD CONSTRAINT uq_document_name_parent UNIQUE (name, parent_id)
  `.execute(db)

  await db.schema
    .createTable('document_access')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('doc_id', 'varchar', (c) => c.notNull().references('documents.id').onDelete('cascade'))
    .addColumn('profile_id', 'varchar')   // FK → public.profiles
    .addColumn('residence_id', 'varchar', (c) => c.references('residences.id'))
    .addColumn('building_id', 'varchar', (c) => c.references('buildings.id'))
    .addColumn('apartment_id', 'varchar', (c) => c.references('apartments.id'))
    .addColumn('contract_id', 'varchar')  // FK → service_contracts (added after)
    .addColumn('access_level', 'varchar', (c) => c.notNull().defaultTo('VIEW'))
    .execute()

  await sql`
    ALTER TABLE document_access ADD CONSTRAINT chk_single_target CHECK (
      (profile_id   IS NOT NULL)::int +
      (residence_id IS NOT NULL)::int +
      (building_id  IS NOT NULL)::int +
      (apartment_id IS NOT NULL)::int +
      (contract_id  IS NOT NULL)::int = 1
    )
  `.execute(db)

  await db.schema
    .createTable('services')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('slug', 'varchar', (c) => c.unique().notNull())
    .addColumn('contact_info', 'json')
    .execute()

  await db.schema
    .createTable('service_schedules')
    .ifNotExists()
    .addColumn('service_id', 'varchar', (c) => c.notNull().references('services.id'))
    .addColumn('schedule', 'varchar', (c) => c.notNull())
    .addPrimaryKeyConstraint('pk_service_schedules', ['service_id', 'schedule'])
    .execute()

  await db.schema
    .createTable('service_contracts')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('service_id', 'varchar', (c) => c.notNull().references('services.id'))
    .addColumn('name', 'varchar', (c) => c.notNull())
    .addColumn('description', 'varchar')
    .execute()

  // Now that service_contracts exists, add the FK from document_access
  await sql`
    ALTER TABLE document_access ADD CONSTRAINT fk_doc_access_contract
    FOREIGN KEY (contract_id) REFERENCES service_contracts(id)
  `.execute(db)

  await db.schema
    .createTable('service_residences')
    .ifNotExists()
    .addColumn('service_contract_id', 'varchar', (c) => c.notNull().references('service_contracts.id'))
    .addColumn('residence_id', 'varchar', (c) => c.notNull().references('residences.id'))
    .addPrimaryKeyConstraint('pk_service_residences', ['service_contract_id', 'residence_id'])
    .execute()

  await db.schema
    .createTable('service_check_in_out')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('service_id', 'varchar', (c) => c.notNull().references('services.id'))
    .addColumn('profile_id', 'varchar', (c) => c.notNull())  // FK → public.profiles
    .addColumn('check_in_at', 'timestamptz')
    .addColumn('check_out_at', 'timestamptz')
    .execute()

  await db.schema
    .createTable('notifications')
    .ifNotExists()
    .addColumn('id', 'varchar', (c) => c.primaryKey())
    .addColumn('type', 'varchar', (c) => c.notNull())
    .addColumn('priority', 'varchar', (c) => c.notNull().defaultTo('MEDIUM'))
    .addColumn('profile_id', 'varchar', (c) => c.notNull())  // FK → public.profiles
    .addColumn('context', 'json', (c) => c.notNull())
    .addColumn('events', 'json', (c) => c.notNull().defaultTo(sql`'[]'::json`))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('expires_at', 'timestamptz')
    .execute()

  // ── Cross-schema FK constraints (tenant → public.profiles) ────────────────
  // Postgres enforces these because the public schema is always present.
  await sql`ALTER TABLE apartments       ADD CONSTRAINT fk_apt_owner      FOREIGN KEY (owner_profile_id)   REFERENCES public.profiles(id) ON DELETE SET NULL`.execute(db)
  await sql`ALTER TABLE payments         ADD CONSTRAINT fk_pay_paid_by    FOREIGN KEY (paid_by)            REFERENCES public.profiles(id)`.execute(db)
  await sql`ALTER TABLE meetings_members ADD CONSTRAINT fk_meet_member    FOREIGN KEY (member_id)          REFERENCES public.profiles(id)`.execute(db)
  await sql`ALTER TABLE _profile_groups  ADD CONSTRAINT fk_pg_profile     FOREIGN KEY (profile_id)         REFERENCES public.profiles(id)`.execute(db)
  await sql`ALTER TABLE feed_comments    ADD CONSTRAINT fk_fc_author      FOREIGN KEY (author_profile_id)  REFERENCES public.profiles(id)`.execute(db)
  await sql`ALTER TABLE documents        ADD CONSTRAINT fk_doc_uploader   FOREIGN KEY (uploaded_by)        REFERENCES public.profiles(id)`.execute(db)
  await sql`ALTER TABLE document_access  ADD CONSTRAINT fk_da_profile     FOREIGN KEY (profile_id)         REFERENCES public.profiles(id)`.execute(db)
  await sql`ALTER TABLE service_check_in_out ADD CONSTRAINT fk_svc_profile FOREIGN KEY (profile_id)        REFERENCES public.profiles(id)`.execute(db)
  await sql`ALTER TABLE notifications    ADD CONSTRAINT fk_notif_profile  FOREIGN KEY (profile_id)         REFERENCES public.profiles(id)`.execute(db)

  // ── Indexes ───────────────────────────────────────────────────────────────
  await db.schema.createIndex('idx_buildings_residence').ifNotExists().on('buildings').column('residence_id').execute()
  await db.schema.createIndex('idx_apartments_building').ifNotExists().on('apartments').column('building_id').execute()
  await db.schema.createIndex('idx_payments_apartment').ifNotExists().on('payments').column('apartment_id').execute()
  await db.schema.createIndex('idx_notifications_profile').ifNotExists().on('notifications').column('profile_id').execute()
  await db.schema.createIndex('idx_notifications_profile_type').ifNotExists().on('notifications').columns(['profile_id', 'type']).execute()
  await db.schema.createIndex('idx_feed_comments_post').ifNotExists().on('feed_comments').column('post_id').execute()
  await db.schema.createIndex('idx_document_access_doc').ifNotExists().on('document_access').column('doc_id').execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  const tables = [
    'notifications', 'service_check_in_out', 'service_residences',
    'service_contracts', 'service_schedules', 'services',
    'document_access', 'documents', 'feed_comments', 'feed_posts',
    '_profile_groups', 'groups', 'meetings_members', 'meetings',
    'complaints', 'payments', 'apartments', 'buildings', 'residences',
  ]
  for (const t of tables) {
    await db.schema.dropTable(t).ifExists().execute()
  }
}
