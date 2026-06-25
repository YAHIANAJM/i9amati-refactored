import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
})

// Single shared Kysely instance for the entire app.
// - Public schema tables: query as  db.selectFrom('public.user')
// - Tenant schema tables: query as  db.withSchema(orgSlug).selectFrom('residences')
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
})
