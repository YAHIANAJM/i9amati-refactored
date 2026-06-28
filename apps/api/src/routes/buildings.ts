import { Router, Request } from 'express'
import { z } from 'zod'
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)

const ownerSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email().optional().or(z.literal('')),
  isPrimary: z.boolean(),
  gender:    z.enum(['MALE', 'FEMALE']).default('MALE'),
})

const apartmentSchema = z.object({
  number:             z.string().min(1),
  floor:              z.number().int().min(0),
  lotNumber:          z.string().optional(),
  quotePart:          z.number().optional(),
  quotePartResidence: z.number().optional(),
  areaSqm:            z.number().positive().optional(),
  owners:             z.array(ownerSchema).min(0).default([]),
})

// POST /api/buildings/:id/apartments
router.post('/:id/apartments', requirePermission('residence', 'create'), async (req: Request, res, next) => {
  const label = '[POST /buildings/:id/apartments]'
  try {
    const { tenantDb } = req as AuthRequest

    const building = await tenantDb.selectFrom('buildings').select(['id', 'floors'])
      .where('id', '=', req.params.id).executeTakeFirst()
    if (!building) throw new AppError(404, 'Building not found')

    const parsed = z.object({
      apartments: z.array(apartmentSchema).min(1),
    }).safeParse(req.body)
    if (!parsed.success) throw new AppError(400, 'Invalid payload', 'VALIDATION_ERROR')

    const apartments = await tenantDb.transaction().execute(async (trx) => {
      const created: any[] = []
      for (const aptInput of parsed.data.apartments) {
        const shareholders = aptInput.owners.map(o => ({
          firstName: o.firstName, lastName: o.lastName, email: o.email || null, isPrimary: o.isPrimary, gender: o.gender,
        }))
        const apt = await trx.insertInto('apartments').values({
          id:                   crypto.randomUUID(),
          unit_code:            aptInput.number,
          lot_number:           aptInput.lotNumber ?? null,
          floor:                aptInput.floor,
          area_sqm:             aptInput.areaSqm ?? null,
          quote_part:           aptInput.quotePart ?? null,
          quote_part_residence: aptInput.quotePartResidence ?? null,
          building_id:          req.params.id,
          owner_profile_id:     null,
          shareholders:         JSON.stringify(shareholders) as any,
          status:               'VACANT',
          usage_type:           'RESIDENTIAL',
          updated_at:           new Date(),
        }).returningAll().executeTakeFirstOrThrow()
        created.push(apt)
      }
      return created
    })

    console.log(`${label} ✅ Added ${apartments.length} apartment(s) to building ${req.params.id}`)
    res.status(201).json({ success: true, data: { apartments } })
  } catch (e) { next(e) }
})

// PATCH /api/buildings/:id
router.patch('/:id', requirePermission('residence', 'update'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const existing = await tenantDb.selectFrom('buildings').select('id')
      .where('id', '=', req.params.id).executeTakeFirst()
    if (!existing) throw new AppError(404, 'Building not found')

    const { name, floors, lotNumber, areaSqm, unionType, facilities } = req.body
    const patch: Record<string, any> = { updated_at: new Date() }
    if (name       != null) patch.name       = name
    if (floors     != null) patch.floors     = Number(floors)
    if (lotNumber  != null) patch.lot_number = lotNumber
    if (areaSqm    != null) patch.area_sqm   = Number(areaSqm)
    if (unionType  != null) patch.union_type  = unionType
    if (facilities != null) patch.facilities = JSON.stringify(facilities) as any

    const building = await tenantDb.updateTable('buildings').set(patch)
      .where('id', '=', req.params.id).returningAll().executeTakeFirstOrThrow()
    res.json(building)
  } catch (e) { next(e) }
})

// GET /api/buildings/:id/apartments
router.get('/:id/apartments', requirePermission('residence', 'read'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const building = await tenantDb.selectFrom('buildings').select('id')
      .where('id', '=', req.params.id).executeTakeFirst()
    if (!building) throw new AppError(404, 'Building not found')

    const apartments = await tenantDb.selectFrom('apartments').selectAll()
      .where('building_id', '=', req.params.id)
      .orderBy('floor', 'asc').orderBy('unit_code', 'asc')
      .execute()

    res.json(apartments)
  } catch (e) { next(e) }
})

export default router
