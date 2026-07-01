import type { Kysely } from 'kysely'
import { sql } from 'kysely'
import type { Database } from '../../src/db/types'

export async function up(db: Kysely<Database>): Promise<void> {
  await sql`
    ALTER TABLE service_contracts
      ADD CONSTRAINT chk_contract_amount_non_negative CHECK (amount      >= 0),
      ADD CONSTRAINT chk_contract_paid_non_negative   CHECK (amount_paid >= 0),
      ADD CONSTRAINT chk_contract_paid_lte_amount     CHECK (amount_paid <= amount)
  `.execute(db)
}

export async function down(db: Kysely<Database>): Promise<void> {
  await sql`
    ALTER TABLE service_contracts
      DROP CONSTRAINT chk_contract_amount_non_negative,
      DROP CONSTRAINT chk_contract_paid_non_negative,
      DROP CONSTRAINT chk_contract_paid_lte_amount
  `.execute(db)
}
