import type { Kysely } from 'kysely'
import { sql } from 'kysely'

// Better Auth's Kysely adapter uses model name "user" as the table name directly.
// Our initial migration created it as "users" — rename to match.
export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE public.users RENAME TO "user"`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE public."user" RENAME TO users`.execute(db)
}
