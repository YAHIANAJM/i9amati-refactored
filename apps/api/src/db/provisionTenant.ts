/**
 * Call this immediately after inserting a new Organization row.
 * Creates the org's PostgreSQL schema and runs all tenant migrations into it.
 */
import * as path from 'path'
import { pathToFileURL } from 'url'
import { Kysely, type MigrationProvider, type Migration } from 'kysely'
import { Migrator } from 'kysely/migration'
import { promises as fs } from 'fs'
import { db } from './db'

// FileMigrationProvider uses import(absolutePath) which breaks on Windows
// because Node's ESM loader only accepts file:// URLs, not D:\... paths.
// This provider wraps every path with pathToFileURL() before importing.
class WindowsSafeMigrationProvider implements MigrationProvider {
  constructor(private folder: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {}
    const files = await fs.readdir(this.folder)

    for (const file of files) {
      if (!/\.(ts|mts|js|mjs)$/.test(file) || file.endsWith('.d.ts')) continue
      const filePath  = path.join(this.folder, file)
      const fileUrl   = pathToFileURL(filePath).href
      const mod       = await import(fileUrl)
      const name      = file.replace(/\.(ts|mts|js|mjs)$/, '')
      migrations[name] = mod
    }

    return migrations
  }
}

export async function provisionTenant(orgSlug: string): Promise<void> {
  await db.schema.createSchema(orgSlug).ifNotExists().execute()

  const migrationFolder = path.join(__dirname, '../../migrations/tenant')
  const scopedDb        = db.withSchema(orgSlug)

  const migrator = new Migrator({
    db:                   scopedDb as Kysely<any>,
    provider:             new WindowsSafeMigrationProvider(migrationFolder),
    migrationTableSchema: orgSlug,
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((r) => {
    if (r.status === 'Error') console.error(`Tenant migration failed: ${r.migrationName}`)
  })

  if (error) throw new Error(`Failed to provision tenant ${orgSlug}: ${error}`)
}
