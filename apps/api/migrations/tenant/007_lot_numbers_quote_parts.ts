import type { Kysely } from 'kysely'

// Moroccan copropriété law (Loi 18-00 / Loi 106-12):
// - Each building in a complex has a numéro de lot (رقم قطعة البناية)
// - Each apartment has a quote-part in its building (millièmes dans l'immeuble)
//   AND, in a multi-building complex, a quote-part in the overall residence
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('buildings')
    .addColumn('lot_number', 'varchar')
    .execute()

  await db.schema
    .alterTable('apartments')
    .addColumn('quote_part_residence', 'float8')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('buildings')
    .dropColumn('lot_number')
    .execute()

  await db.schema
    .alterTable('apartments')
    .dropColumn('quote_part_residence')
    .execute()
}
