import { type Kysely, sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    UPDATE service_contracts SET end_date = start_date WHERE end_date < start_date
  `.execute(db)
  await sql`
    ALTER TABLE service_contracts
    ADD CONSTRAINT chk_contract_date_order CHECK (end_date >= start_date)
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE service_contracts
    DROP CONSTRAINT chk_contract_date_order
  `.execute(db)
}
