/**
 * Runs tenant migrations against every existing org schema.
 * Use after changing migrations/tenant/*.
 *
 *   tsx src/db/migrateAllTenants.ts
 */
import 'dotenv/config'
import * as path from 'path'
import { Kysely, PostgresDialect } from 'kysely'
import { Migrator, FileMigrationProvider } from 'kysely/migration'
import { Pool } from 'pg'
import { promises as fs } from 'fs'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
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

    const scopedDb = rootDb.withSchema(slug)
    const migrator = new Migrator({
      db: scopedDb as Kysely<any>,
      provider: new FileMigrationProvider({ fs, path, migrationFolder }),
      migrationTableSchema: slug,
    })

    const { error, results } = await migrator.migrateToLatest()
    results?.forEach((r) => {
      if (r.status === 'Success') console.log(`  ✓ ${r.migrationName}`)
      else if (r.status === 'Error') console.error(`  ✗ ${r.migrationName}`)
    })
    if (error) { console.error(`  Failed:`, error); process.exit(1) }
  }

  await rootDb.destroy()
  console.log('\n✓ All tenant schemas up to date.')
}

main().catch((e) => { console.error(e); process.exit(1) })
