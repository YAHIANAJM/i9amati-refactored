/**
 * Runs tenant migrations against every existing org schema.
 * Use after changing migrations/tenant/*.
 *
 *   tsx src/db/migrateAllTenants.ts
 */
import 'dotenv/config'
import * as path from 'path'
import { pathToFileURL } from 'url'
import { Kysely, PostgresDialect } from 'kysely'
import { Migrator } from 'kysely/migration'
import type { MigrationProvider, Migration } from 'kysely/migration'
import { Pool } from 'pg'
import { promises as fs } from 'fs'

// Same provider used by provisionTenant — handles Windows file:// paths and
// tsx dynamic imports for .ts migration files.
class WindowsSafeMigrationProvider implements MigrationProvider {
  constructor(private folder: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {}
    const files = (await fs.readdir(this.folder)).sort()
    for (const file of files) {
      if (!/\.(ts|mts|js|mjs)$/.test(file) || file.endsWith('.d.ts')) continue
      const fileUrl = pathToFileURL(path.join(this.folder, file)).href
      const mod = await import(fileUrl)
      migrations[file.replace(/\.(ts|mts|js|mjs)$/, '')] = mod
    }
    return migrations
  }
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL!
  const pool = new Pool({ connectionString: DATABASE_URL })
  const rootDb = new Kysely<any>({ dialect: new PostgresDialect({ pool }) })

  const orgs = await rootDb
    .selectFrom('public.organizations')
    .select('slug')
    .execute()

  if (orgs.length === 0) {
    console.log('No organizations found.')
    await rootDb.destroy()
    return
  }

  const migrationFolder = path.join(__dirname, '../../migrations/tenant')

  for (const { slug } of orgs) {
    console.log(`\n── Migrating tenant: ${slug}`)
    await rootDb.schema.createSchema(slug).ifNotExists().execute()

    // Must set search_path on the connection so raw sql`ALTER TABLE ...` calls
    // resolve unqualified table names to this tenant's schema, not public.
    // withSchema() alone only affects Kysely query-builder nodes, not raw SQL.
    const sep = DATABASE_URL.includes('?') ? '&' : '?'
    const searchPath = `-c%20search_path%3D%22${encodeURIComponent(slug)}%22%2Cpublic`
    const tenantPool = new Pool({ connectionString: `${DATABASE_URL}${sep}options=${searchPath}` })
    const tenantDb = new Kysely<any>({ dialect: new PostgresDialect({ pool: tenantPool }) })

    const migrator = new Migrator({
      db: tenantDb,
      provider: new WindowsSafeMigrationProvider(migrationFolder),
      migrationTableSchema: slug,
    })

    const { error, results } = await migrator.migrateToLatest()
    results?.forEach((r) => {
      if (r.status === 'Success') console.log(`  ✓ ${r.migrationName}`)
      else if (r.status === 'Error') console.error(`  ✗ ${r.migrationName}`)
    })

    await tenantPool.end()

    if (error) { console.error(`  Failed:`, error); process.exit(1) }
  }

  await rootDb.destroy()
  console.log('\n✓ All tenant schemas up to date.')
}

main().catch((e) => { console.error(e); process.exit(1) })
