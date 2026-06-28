import { Router, Request } from 'express'
import { z } from 'zod'
import { sql } from 'kysely'
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)

// ── Zod schemas ───────────────────────────────────────────────────────────────

const ownerSchema = z.object({
  firstName:  z.string().min(1),
  lastName:   z.string().min(1),
  email:      z.string().email().optional().or(z.literal('')),
  isPrimary:  z.boolean(),
  gender:     z.enum(['MALE', 'FEMALE']).default('MALE'),
})

const apartmentSchema = z.object({
  number:             z.string().min(1, 'Apartment number is required'),
  floor:              z.number().int().min(0),
  lotNumber:          z.string().optional(),   // numéro de lot (رقم القطعة) — Loi 18-00
  quotePart:          z.number().optional(),   // millièmes dans l'immeuble
  quotePartResidence: z.number().optional(),   // millièmes dans la résidence (complexe only)
  areaSqm:            z.number().positive().optional(),
  owners:             z.array(ownerSchema).min(0).default([]),
})

const buildingSchema = z.object({
  name:       z.string().min(1, 'Building name is required'),
  floors:     z.number().int().min(1),
  unionType:  z.string().optional(),
  lotNumber:  z.string().optional(),   // numéro de lot du bâtiment (Loi 18-00)
  quotePart:  z.number().optional(),   // millièmes dans la résidence (complexe only)
  areaSqm:    z.number().positive().optional(),
  facilities: z.array(z.string()).default([]),
  apartments: z.array(apartmentSchema).min(0).default([]),
})

const bulkResidenceSchema = z.object({
  name:          z.string().min(1, 'Residence name is required'),
  address:       z.string().min(1, 'Address is required'),
  city:          z.string().optional(),
  description:   z.string().optional(),
  titreFoncier:  z.string().optional(),
  status:        z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).default('ACTIVE'),
  facilities:    z.array(z.string()).default([]),
  buildings:     z.array(buildingSchema).min(1, 'At least one building is required'),
})

// ── POST /api/residences/bulk ─────────────────────────────────────────────────

router.post('/bulk', requirePermission('residence', 'create'), async (req: Request, res, next) => {
  const label = '[POST /residences/bulk]'
  try {
    const { tenantDb } = req as AuthRequest

    // Validate
    const parsed = bulkResidenceSchema.safeParse(req.body)
    if (!parsed.success) {
      console.error(`${label} Validation failed`, parsed.error.flatten())
      throw new AppError(400, 'Invalid payload', 'VALIDATION_ERROR')
    }
    const data = parsed.data
    console.log(`${label} Creating residence "${data.name}" with ${data.buildings.length} building(s)`)

    const result = await tenantDb.transaction().execute(async (trx) => {
      // 1 — Create residence
      const residenceId = crypto.randomUUID()
      const residence = await trx
        .insertInto('residences')
        .values({
          id:            residenceId,
          name:          data.name,
          address:       data.address,
          city:          data.city ?? null,
          description:   data.description ?? null,
          titre_foncier: data.titreFoncier ?? null,
          status:        data.status,
          facilities:    JSON.stringify(data.facilities) as any,
          updated_at:    new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      console.log(`${label} ✓ Residence created → ${residenceId}`)

      // 2 — Create buildings + their apartments in parallel per building
      const buildings: any[] = []
      const apartments: any[] = []

      for (const bldInput of data.buildings) {
        const buildingId = crypto.randomUUID()
        const building = await trx
          .insertInto('buildings')
          .values({
            id:           buildingId,
            name:         bldInput.name,
            floors:       bldInput.floors,
            area_sqm:     bldInput.areaSqm ?? null,
            union_type:   bldInput.unionType ?? null,
            lot_number:   bldInput.lotNumber ?? null,
            quote_part:   bldInput.quotePart ?? null,
            has_elevator: false,
            facilities:   JSON.stringify(bldInput.facilities ?? []) as any,
            residence_id: residenceId,
            updated_at:   new Date(),
          })
          .returningAll()
          .executeTakeFirstOrThrow()

        console.log(`${label}   ✓ Building "${bldInput.name}" → ${buildingId} (${bldInput.apartments.length} apt(s))`)
        buildings.push(building)

        // 3 — Create apartments for this building
        for (const aptInput of bldInput.apartments) {
          const shareholders = aptInput.owners.map((o) => ({
            firstName:  o.firstName,
            lastName:   o.lastName,
            email:      o.email || null,
            isPrimary:  o.isPrimary,
            gender:     o.gender,
          }))

          const apartment = await trx
            .insertInto('apartments')
            .values({
              id:                   crypto.randomUUID(),
              unit_code:            aptInput.number,
              lot_number:           aptInput.lotNumber ?? null,
              floor:                aptInput.floor,
              area_sqm:             aptInput.areaSqm ?? null,
              quote_part:           aptInput.quotePart ?? null,
              quote_part_residence: aptInput.quotePartResidence ?? null,
              building_id:          buildingId,
              owner_profile_id:     null,  // linked when owner registers
              shareholders:         JSON.stringify(shareholders) as any,
              status:               'VACANT',
              usage_type:           'RESIDENTIAL',
              updated_at:           new Date(),
            })
            .returningAll()
            .executeTakeFirstOrThrow()

          apartments.push(apartment)
        }
      }

      return { residence, buildings, apartments }
    })

    console.log(
      `${label} ✅ Done — residence ${result.residence.id} | ` +
      `${result.buildings.length} building(s) | ${result.apartments.length} apartment(s)`
    )

    res.status(201).json({
      success: true,
      data: {
        residence:  result.residence,
        buildings:  result.buildings,
        apartments: result.apartments,
        summary: {
          buildingCount:  result.buildings.length,
          apartmentCount: result.apartments.length,
        },
      },
    })
  } catch (e) {
    if (!(e instanceof AppError)) {
      console.error(`${label} ❌ Unexpected error`, e)
    }
    next(e)
  }
})

router.get('/', requirePermission('residence', 'read'), async (req: Request, res, next) => {
  const label = '[GET /residences]'
  try {
    const { tenantDb } = req as AuthRequest

    const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 4))
    const offset = (page - 1) * limit

    const { count: rawCount } = await tenantDb
      .selectFrom('residences')
      .select(eb => eb.fn.countAll<string>().as('count'))
      .executeTakeFirstOrThrow()
    const total = parseInt(rawCount, 10)

    const rows = await tenantDb
      .selectFrom('residences')
      .selectAll('residences')
      .select(eb => [
        eb.selectFrom('buildings')
          .select(eb.fn.countAll<string>().as('cnt'))
          .whereRef('buildings.residence_id', '=', 'residences.id')
          .as('building_count'),
        eb.selectFrom('apartments')
          .innerJoin('buildings', 'buildings.id', 'apartments.building_id')
          .select(eb.fn.countAll<string>().as('cnt'))
          .whereRef('buildings.residence_id', '=', 'residences.id')
          .as('apartment_count'),
        eb.selectFrom('apartments')
          .innerJoin('buildings', 'buildings.id', 'apartments.building_id')
          .select(eb.fn.countAll<string>().as('cnt'))
          .whereRef('buildings.residence_id', '=', 'residences.id')
          .where(sql<boolean>`jsonb_array_length(apartments.shareholders::jsonb) > 0`)
          .as('occupied_count'),
      ])
      .orderBy('residences.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute()

    const data = rows.map(r => ({
      ...r,
      building_count:  parseInt((r as any).building_count  ?? '0', 10),
      apartment_count: parseInt((r as any).apartment_count ?? '0', 10),
      occupied_count:  parseInt((r as any).occupied_count  ?? '0', 10),
    }))

    console.log(`${label} page=${page} limit=${limit} → ${data.length}/${total}`)
    res.json({ data, total, page, limit, hasMore: page * limit < total })
  } catch (e) { next(e) }
})

router.get('/:id/buildings', requirePermission('residence', 'read'), async (req: Request, res, next) => {
  const label = '[GET /residences/:id/buildings]'
  try {
    const { tenantDb } = req as AuthRequest

    const residence = await tenantDb
      .selectFrom('residences')
      .select('id')
      .where('id', '=', req.params.id)
      .executeTakeFirst()
    if (!residence) throw new AppError(404, 'Residence not found')

    const rows = await tenantDb
      .selectFrom('buildings')
      .selectAll('buildings')
      .select(eb => [
        eb.selectFrom('apartments')
          .select(eb.fn.countAll<string>().as('cnt'))
          .whereRef('apartments.building_id', '=', 'buildings.id')
          .as('apartment_count'),
        eb.selectFrom('apartments')
          .select(eb.fn.countAll<string>().as('cnt'))
          .whereRef('apartments.building_id', '=', 'buildings.id')
          .where(sql<boolean>`jsonb_array_length(apartments.shareholders::jsonb) > 0`)
          .as('occupied_count'),
      ])
      .where('buildings.residence_id', '=', req.params.id)
      .orderBy('buildings.created_at', 'asc')
      .execute()

    const data = rows.map(b => ({
      ...b,
      apartment_count: parseInt((b as any).apartment_count ?? '0', 10),
      occupied_count:  parseInt((b as any).occupied_count  ?? '0', 10),
    }))

    console.log(`${label} residence=${req.params.id} → ${data.length} building(s)`)
    res.json(data)
  } catch (e) { next(e) }
})

router.post('/:id/buildings', requirePermission('residence', 'create'), async (req: Request, res, next) => {
  const label = '[POST /residences/:id/buildings]'
  try {
    const { tenantDb } = req as AuthRequest

    const residence = await tenantDb.selectFrom('residences').select('id')
      .where('id', '=', req.params.id).executeTakeFirst()
    if (!residence) throw new AppError(404, 'Residence not found')

    const parsed = z.object({
      buildings: z.array(buildingSchema).min(1),
    }).safeParse(req.body)
    if (!parsed.success) throw new AppError(400, 'Invalid payload', 'VALIDATION_ERROR')

    const result = await tenantDb.transaction().execute(async (trx) => {
      const buildings: any[] = []
      const apartments: any[] = []
      for (const bldInput of parsed.data.buildings) {
        const buildingId = crypto.randomUUID()
        const building = await trx.insertInto('buildings').values({
          id:           buildingId,
          name:         bldInput.name,
          floors:       bldInput.floors,
          area_sqm:     bldInput.areaSqm ?? null,
          union_type:   bldInput.unionType ?? null,
          lot_number:   bldInput.lotNumber ?? null,
          quote_part:   bldInput.quotePart ?? null,
          has_elevator: false,
          residence_id: req.params.id,
          updated_at:   new Date(),
        }).returningAll().executeTakeFirstOrThrow()
        buildings.push(building)

        for (const aptInput of bldInput.apartments) {
          const shareholders = aptInput.owners.map(o => ({
            firstName: o.firstName, lastName: o.lastName, email: o.email || null, isPrimary: o.isPrimary,
          }))
          const apartment = await trx.insertInto('apartments').values({
            id:                   crypto.randomUUID(),
            unit_code:            aptInput.number,
            lot_number:           aptInput.lotNumber ?? null,
            floor:                aptInput.floor,
            area_sqm:             aptInput.areaSqm ?? null,
            quote_part:           aptInput.quotePart ?? null,
            quote_part_residence: aptInput.quotePartResidence ?? null,
            building_id:          buildingId,
            owner_profile_id:     null,
            shareholders:         JSON.stringify(shareholders) as any,
            status:               'VACANT',
            usage_type:           'RESIDENTIAL',
            updated_at:           new Date(),
          }).returningAll().executeTakeFirstOrThrow()
          apartments.push(apartment)
        }
      }
      return { buildings, apartments }
    })

    console.log(`${label} ✅ Added ${result.buildings.length} building(s) to residence ${req.params.id}`)
    res.status(201).json({ success: true, data: result })
  } catch (e) { next(e) }
})

router.get('/:id', requirePermission('residence', 'read'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const residence = await tenantDb
      .selectFrom('residences')
      .selectAll()
      .where('id', '=', req.params.id)
      .executeTakeFirst()
    if (!residence) throw new AppError(404, 'Residence not found')

    const buildings = await tenantDb
      .selectFrom('buildings')
      .selectAll()
      .where('residence_id', '=', req.params.id)
      .execute()

    res.json({ ...residence, buildings })
  } catch (e) { next(e) }
})

router.post('/', requirePermission('residence', 'create'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const { name, address, city, status, image, description, facilities = [] } = req.body
    if (!name || !address) throw new AppError(400, 'name and address are required')

    const residence = await tenantDb
      .insertInto('residences')
      .values({ name, address, city, status, image, description, facilities: JSON.stringify(facilities) as any, updated_at: new Date() })
      .returningAll()
      .executeTakeFirstOrThrow()
    res.status(201).json(residence)
  } catch (e) { next(e) }
})

router.patch('/:id', requirePermission('residence', 'update'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const existing = await tenantDb
      .selectFrom('residences')
      .select('id')
      .where('id', '=', req.params.id)
      .executeTakeFirst()
    if (!existing) throw new AppError(404, 'Residence not found')

    const { name, address, city, status, image, description, facilities } = req.body
    const patch: Record<string, any> = { updated_at: new Date() }
    if (name        != null) patch.name        = name
    if (address     != null) patch.address     = address
    if (city        != null) patch.city        = city
    if (status      != null) patch.status      = status
    if (image       != null) patch.image       = image
    if (description != null) patch.description = description
    if (facilities  != null) patch.facilities  = JSON.stringify(facilities) as any
    const residence = await tenantDb
      .updateTable('residences')
      .set(patch)
      .where('id', '=', req.params.id)
      .returningAll()
      .executeTakeFirstOrThrow()
    res.json(residence)
  } catch (e) { next(e) }
})

router.delete('/:id', requirePermission('residence', 'delete'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const existing = await tenantDb
      .selectFrom('residences')
      .select('id')
      .where('id', '=', req.params.id)
      .executeTakeFirst()
    if (!existing) throw new AppError(404, 'Residence not found')

    await tenantDb
      .deleteFrom('residences')
      .where('id', '=', req.params.id)
      .execute()
    res.status(204).send()
  } catch (e) { next(e) }
})

export default router
