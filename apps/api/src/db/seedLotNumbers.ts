/**
 * Seeds lot_number for existing buildings + apartments, and sample facilities for buildings.
 * Run: tsx src/db/seedLotNumbers.ts
 */
import 'dotenv/config'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const db = new Kysely<any>({ dialect: new PostgresDialect({ pool }) })

  // Discover all tenant schemas
  const orgs = await db.selectFrom('public.organizations').select('slug').execute()
  if (!orgs.length) { console.log('No organizations found.'); await db.destroy(); return }

  for (const { slug } of orgs) {
    console.log(`\n── Schema: ${slug}`)
    const s = slug

    // Fetch buildings without a lot_number
    const buildings: any[] = await db
      .withSchema(s)
      .selectFrom('buildings')
      .select(['id', 'name', 'lot_number'])
      .execute()

    console.log(`   ${buildings.length} building(s)`)
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i]
      const newLot = `TF-${String(i + 1).padStart(3, '0')}`
      const newFacilities = i === 0
        ? JSON.stringify(['ELEVATOR', 'PARKING', 'SECURITY'])
        : JSON.stringify(['ELEVATOR'])

      await db.withSchema(s)
        .updateTable('buildings')
        .set({
          lot_number:  b.lot_number ?? newLot,
          facilities:  newFacilities as any,
          updated_at:  new Date(),
        })
        .where('id', '=', b.id)
        .execute()

      console.log(`   ✓ Building "${b.name}" → lot: ${b.lot_number ?? newLot}`)
    }

    // Fetch apartments without a lot_number
    const apts: any[] = await db
      .withSchema(s)
      .selectFrom('apartments')
      .select(['id', 'unit_code', 'lot_number'])
      .execute()

    console.log(`   ${apts.length} apartment(s)`)
    for (let i = 0; i < apts.length; i++) {
      const a = apts[i]
      if (a.lot_number) { console.log(`   – ${a.unit_code} already has lot_number ${a.lot_number}`); continue }
      const newLot = `LOT-${String(i + 1).padStart(3, '0')}`

      await db.withSchema(s)
        .updateTable('apartments')
        .set({ lot_number: newLot, updated_at: new Date() })
        .where('id', '=', a.id)
        .execute()

      console.log(`   ✓ Apt "${a.unit_code}" → lot: ${newLot}`)
    }
  }

  await db.destroy()
  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) })
