/**
 * Call this immediately after inserting a new Organization row.
 * Creates the org's PostgreSQL schema and runs all tenant migrations into it.
 */
import * as path from 'path'
import { Kysely } from 'kysely'
import { Migrator, FileMigrationProvider } from 'kysely/migration'
import { promises as fs } from 'fs'
import { db } from './db'

export async function provisionTenant(orgSlug: string): Promise<void> {
  await db.schema.createSchema(orgSlug).ifNotExists().execute()

  const migrationFolder = path.join(__dirname, '../../migrations/tenant')
  const scopedDb = db.withSchema(orgSlug)

  const migrator = new Migrator({
    db: scopedDb as Kysely<any>,
    provider: new FileMigrationProvider({ fs, path, migrationFolder }),
    migrationTableSchema: orgSlug,
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((r) => {
    if (r.status === 'Error') console.error(`Tenant migration failed: ${r.migrationName}`)
  })

  if (error) throw new Error(`Failed to provision tenant ${orgSlug}: ${error}`)
}
