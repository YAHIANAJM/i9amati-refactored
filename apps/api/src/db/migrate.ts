/**
 * Migration runner used by npm scripts.
 * Usage:
 *   tsx src/db/migrate.ts public            — run public schema migrations
 *   tsx src/db/migrate.ts tenant <orgSlug>  — run tenant migrations for one org
 */
import 'dotenv/config'
import * as path from 'path'
import { Kysely, PostgresDialect } from 'kysely'
import { Migrator, FileMigrationProvider } from 'kysely/migration'
import { Pool } from 'pg'
import { promises as fs } from 'fs'

async function migrate(target: 'public' | 'tenant', orgSlug?: string) {
  const schemaName = target === 'public' ? 'public' : orgSlug!

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = new Kysely<any>({ dialect: new PostgresDialect({ pool }) })

  if (target === 'tenant') {
    await db.schema.createSchema(schemaName).ifNotExists().execute()
  }

  // Kysely's FileMigrationProvider needs a db scoped to the right schema
  const scopedDb = target === 'tenant' ? db.withSchema(schemaName) : db

  const migrationFolder = path.join(__dirname, '../../migrations', target)

  const migrator = new Migrator({
    db: scopedDb as Kysely<any>,
    provider: new FileMigrationProvider({ fs, path, migrationFolder }),
    migrationTableSchema: schemaName,
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((r) => {
    if (r.status === 'Success') console.log(`✓ ${r.migrationName}`)
    else if (r.status === 'Error') console.error(`✗ ${r.migrationName}`)
  })

  if (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }

  await db.destroy()
  console.log(`\n✓ ${schemaName} schema up to date.`)
}

const [, , target, orgSlug] = process.argv
if (target !== 'public' && target !== 'tenant') {
  console.error('Usage: tsx src/db/migrate.ts public | tenant <orgSlug>')
  process.exit(1)
}
if (target === 'tenant' && !orgSlug) {
  console.error('Usage: tsx src/db/migrate.ts tenant <orgSlug>')
  process.exit(1)
}

migrate(target as 'public' | 'tenant', orgSlug)
