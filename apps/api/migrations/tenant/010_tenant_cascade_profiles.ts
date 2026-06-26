import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Drop existing constraints
  await sql`ALTER TABLE _profile_groups DROP CONSTRAINT IF EXISTS fk_pg_profile`.execute(db)
  await sql`ALTER TABLE feed_comments DROP CONSTRAINT IF EXISTS fk_fc_author`.execute(db)
  await sql`ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_doc_uploader`.execute(db)
  await sql`ALTER TABLE document_access DROP CONSTRAINT IF EXISTS fk_da_profile`.execute(db)
  await sql`ALTER TABLE service_check_in_out DROP CONSTRAINT IF EXISTS fk_svc_profile`.execute(db)
  await sql`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notif_profile`.execute(db)

  // Recreate with ON DELETE CASCADE
  await sql`ALTER TABLE _profile_groups ADD CONSTRAINT fk_pg_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE`.execute(db)
  await sql`ALTER TABLE feed_comments ADD CONSTRAINT fk_fc_author FOREIGN KEY (author_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE`.execute(db)
  await sql`ALTER TABLE documents ADD CONSTRAINT fk_doc_uploader FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE`.execute(db)
  await sql`ALTER TABLE document_access ADD CONSTRAINT fk_da_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE`.execute(db)
  await sql`ALTER TABLE service_check_in_out ADD CONSTRAINT fk_svc_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE`.execute(db)
  await sql`ALTER TABLE notifications ADD CONSTRAINT fk_notif_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  // Can be reversed by dropping and recreating without cascade
}
