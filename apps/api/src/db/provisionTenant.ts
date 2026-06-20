/**
 * Call this immediately after inserting a new Organization row.
 * Creates the org's PostgreSQL schema and runs all tenant migrations into it.
 */
import * as path from 'path'
import { pathToFileURL } from 'url'
import { Kysely, type Migration, type MigrationProvider } from 'kysely'
import { Migrator } from 'kysely/migration'
import { promises as fs } from 'fs'
import { db } from './db'

function makeProvider(migrationFolder: string): MigrationProvider {
  return {
    async getMigrations(): Promise<Record<string, Migration>> {
      const migrations: Record<string, Migration> = {}
      const files = (await fs.readdir(migrationFolder))
        .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
        .sort()
      for (const file of files) {
        const fileUrl = pathToFileURL(path.join(migrationFolder, file)).href
        const mod = await import(fileUrl)
        migrations[file.replace(/\.(ts|js)$/, '')] = mod
      }
      return migrations
    },
  }
}

export async function provisionTenant(orgSlug: string): Promise<void> {
  await db.schema.createSchema(orgSlug).ifNotExists().execute()

  const migrationFolder = path.resolve(__dirname, '../../migrations/tenant')
  const scopedDb = db.withSchema(orgSlug)

  const migrator = new Migrator({
    db: scopedDb as Kysely<any>,
    provider: makeProvider(migrationFolder),
    migrationTableSchema: orgSlug,
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((r) => {
    if (r.status === 'Error') console.error(`Tenant migration failed: ${r.migrationName}`)
  })

  if (error) throw new Error(`Failed to provision tenant ${orgSlug}: ${error}`)
}
