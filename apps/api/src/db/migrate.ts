/**
 * Migration runner used by npm scripts.
 * Usage:
 *   tsx src/db/migrate.ts public            — run public schema migrations
 *   tsx src/db/migrate.ts tenant <orgSlug>  — run tenant migrations for one org
 */
import 'dotenv/config'
import * as path from 'path'
import { pathToFileURL } from 'url'
import { Kysely, PostgresDialect } from 'kysely'
import { Migrator } from 'kysely/migration'
import type { Migration, MigrationProvider } from 'kysely/migration'
import { Pool } from 'pg'
import { promises as fs } from 'fs'

// FileMigrationProvider uses import() internally which needs file:// URLs on Windows.
// This custom provider converts paths explicitly.
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

async function migrate(target: 'public' | 'tenant', orgSlug?: string) {
  const schemaName = target === 'public' ? 'public' : orgSlug!

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  // Raw SQL in tenant migrations (ALTER TABLE …) ignores withSchema.
  // Setting search_path on every connection makes unqualified table refs
  // resolve to the tenant schema automatically.
  if (target === 'tenant') {
    pool.on('connect', client => {
      client.query(`SET search_path TO "${schemaName}", public`)
    })
  }

  const db = new Kysely<any>({ dialect: new PostgresDialect({ pool }) })

  if (target === 'tenant') {
    await db.schema.createSchema(schemaName).ifNotExists().execute()
  }

  const scopedDb = target === 'tenant' ? db.withSchema(schemaName) : db
  const migrationFolder = path.resolve(__dirname, '../../migrations', target)

  const migrator = new Migrator({
    db: scopedDb as Kysely<any>,
    provider: makeProvider(migrationFolder),
    migrationTableSchema: schemaName,
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach(r => {
    if (r.status === 'Success')     console.log(`✓ ${r.migrationName}`)
    else if (r.status === 'Error')  console.error(`✗ ${r.migrationName}`)
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
