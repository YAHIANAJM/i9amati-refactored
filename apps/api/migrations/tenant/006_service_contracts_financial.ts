import type { Kysely } from 'kysely'
import type { Database } from '../../src/db/types'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('services').addColumn('type', 'varchar').execute()

  await db.schema.alterTable('service_contracts')
    .addColumn('amount', 'float8', c => c.notNull().defaultTo(0))
    .execute()
  await db.schema.alterTable('service_contracts')
    .addColumn('amount_paid', 'float8', c => c.notNull().defaultTo(0))
    .execute()
  await db.schema.alterTable('service_contracts')
    .addColumn('start_date', 'date')
    .execute()
  await db.schema.alterTable('service_contracts')
    .addColumn('end_date', 'date')
    .execute()
  await db.schema.alterTable('service_contracts')
    .addColumn('status', 'varchar', c => c.notNull().defaultTo('PENDING'))
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('service_contracts').dropColumn('status').execute()
  await db.schema.alterTable('service_contracts').dropColumn('end_date').execute()
  await db.schema.alterTable('service_contracts').dropColumn('start_date').execute()
  await db.schema.alterTable('service_contracts').dropColumn('amount_paid').execute()
  await db.schema.alterTable('service_contracts').dropColumn('amount').execute()
  await db.schema.alterTable('services').dropColumn('type').execute()
}
