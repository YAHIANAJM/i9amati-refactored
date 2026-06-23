/**
 * Call this immediately after inserting a new Organization row.
 * Creates the org's PostgreSQL schema and runs all tenant migrations into it.
 */
import * as path from 'path'
import { pathToFileURL } from 'url'
import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import { Migrator } from 'kysely/migration'
import type { MigrationProvider, Migration } from 'kysely/migration'
import { promises as fs } from 'fs'
import { db } from './db'

// FileMigrationProvider uses import(absolutePath) which breaks on Windows because
// Node's ESM loader only accepts file:// URLs, not D:\... paths.
class WindowsSafeMigrationProvider implements MigrationProvider {
  constructor(private folder: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {}
    const files = await fs.readdir(this.folder)

    for (const file of files) {
      if (!/\.(ts|mts|js|mjs)$/.test(file) || file.endsWith('.d.ts')) continue
      const fileUrl = pathToFileURL(path.join(this.folder, file)).href
      const mod     = await import(fileUrl)
      const name    = file.replace(/\.(ts|mts|js|mjs)$/, '')
      migrations[name] = mod
    }

    return migrations
  }
}

export async function provisionTenant(orgSlug: string): Promise<void> {
  // Create the PostgreSQL schema (idempotent).
  await db.schema.createSchema(orgSlug).ifNotExists().execute()

  // Build a connection string that sets search_path to the tenant schema.
  //
  // WHY: Kysely's withSchema() only affects its own query-builder nodes — it
  // does NOT rewrite raw sql`...`.execute(db) calls. Tenant migrations use raw
  // SQL for ALTER TABLE / CHECK / UNIQUE constraints, so those queries must
  // run on a connection where PostgreSQL already resolves unqualified names
  // to the correct schema. Setting search_path at the connection level
  // (via the PostgreSQL `options` startup parameter) achieves this without
  // touching the migration files themselves.
  const DATABASE_URL  = process.env.DATABASE_URL!
  const sep           = DATABASE_URL.includes('?') ? '&' : '?'
  // Encode as proper percent-encoding (not + for space) so libpq parses it correctly.
  const searchPath    = `-c%20search_path%3D%22${encodeURIComponent(orgSlug)}%22%2Cpublic`
  const tenantConnStr = `${DATABASE_URL}${sep}options=${searchPath}`

  const tenantPool = new Pool({ connectionString: tenantConnStr })
  const tenantDb   = new Kysely<any>({ dialect: new PostgresDialect({ pool: tenantPool }) })

  const migrationFolder = path.join(__dirname, '../../migrations/tenant')

  const migrator = new Migrator({
    db:                   tenantDb,
    provider:             new WindowsSafeMigrationProvider(migrationFolder),
    migrationTableSchema: orgSlug,
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach(r => {
    if (r.status === 'Error') console.error(`Tenant migration failed: ${r.migrationName}`)
  })

  await tenantPool.end()

  if (error) throw new Error(`Failed to provision tenant ${orgSlug}: ${error}`)
}
