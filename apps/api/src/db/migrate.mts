/**
 * Migration runner used by npm scripts.
 * Usage:
 *   tsx src/db/migrate.mts public            — run public schema migrations
 *   tsx src/db/migrate.mts tenant <orgSlug>  — run tenant migrations for one org
 */
import 'dotenv/config'
import * as path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { Kysely, PostgresDialect } from 'kysely'
import { Migrator } from 'kysely/migration'
import type { Migration, MigrationProvider } from 'kysely'
import { Pool } from 'pg'
import { promises as fs } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// FileMigrationProvider uses import(absoluteWindowsPath) which fails on Windows —
// Node's ESM loader reads 'D:' as a URL scheme. pathToFileURL() fixes this.
class WindowsSafeFileMigrationProvider implements MigrationProvider {
  constructor(private folder: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {}
    const files = (await fs.readdir(this.folder)).sort()
    for (const fileName of files) {
      if (!fileName.endsWith('.ts') && !fileName.endsWith('.js')) continue
      const fileUrl = pathToFileURL(path.join(this.folder, fileName)).href
      const mod = await import(fileUrl)
      migrations[fileName.replace(/\.[jt]s$/, '')] = mod
    }
    return migrations
  }
}

async function migrate(target: 'public' | 'tenant', orgSlug?: string) {
  const schemaName = target === 'public' ? 'public' : orgSlug!

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db   = new Kysely<any>({ dialect: new PostgresDialect({ pool }) })

  if (target === 'tenant') {
    await db.schema.createSchema(schemaName).ifNotExists().execute()
  }

  const scopedDb = target === 'tenant' ? db.withSchema(schemaName) : db

  const migrationFolder = path.join(__dirname, '../../migrations', target)

  const migrator = new Migrator({
    db: scopedDb as Kysely<any>,
    provider: new WindowsSafeFileMigrationProvider(migrationFolder),
    migrationTableSchema: schemaName,
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach(r => {
    if (r.status === 'Success')    console.log(`✓ ${r.migrationName}`)
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
  console.error('Usage: tsx src/db/migrate.mts public | tenant <orgSlug>')
  process.exit(1)
}
if (target === 'tenant' && !orgSlug) {
  console.error('Usage: tsx src/db/migrate.mts tenant <orgSlug>')
  process.exit(1)
}

migrate(target as 'public' | 'tenant', orgSlug)
