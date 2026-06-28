import { Router, Request } from 'express'
import { z } from 'zod'
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)

router.get('/', requirePermission('apartment', 'read'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const { residenceId, buildingId } = req.query

    let query = tenantDb
      .selectFrom('apartments as a')
      .innerJoin('buildings as b', 'b.id', 'a.building_id')
      .selectAll('a')
      .select('b.name as building_name')
      .orderBy('a.unit_code', 'asc')

    if (buildingId)  query = query.where('a.building_id', '=', buildingId as string)
    if (residenceId) query = query.where('b.residence_id', '=', residenceId as string)

    const apartments = await query.execute()
    res.json(apartments)
  } catch (e) { next(e) }
})

router.get('/:id', requirePermission('apartment', 'read'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const apartment = await tenantDb
      .selectFrom('apartments as a')
      .innerJoin('buildings as b', 'b.id', 'a.building_id')
      .selectAll('a')
      .select(['b.name as building_name', 'b.residence_id'])
      .where('a.id', '=', req.params.id)
      .executeTakeFirst()
    if (!apartment) throw new AppError(404, 'Apartment not found')
    res.json(apartment)
  } catch (e) { next(e) }
})

router.post('/', requirePermission('apartment', 'create'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const { unitCode, buildingId, ...rest } = req.body
    if (!unitCode || !buildingId) throw new AppError(400, 'unitCode and buildingId are required')

    const building = await tenantDb
      .selectFrom('buildings')
      .select('id')
      .where('id', '=', buildingId)
      .executeTakeFirst()
    if (!building) throw new AppError(404, 'Building not found')

    const apartment = await tenantDb
      .insertInto('apartments')
      .values({ unit_code: unitCode, building_id: buildingId, updated_at: new Date(), ...rest })
      .returningAll()
      .executeTakeFirstOrThrow()
    res.status(201).json(apartment)
  } catch (e) { next(e) }
})

router.post('/:id/shareholders', requirePermission('apartment', 'update'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const apt = await tenantDb.selectFrom('apartments').select(['id', 'shareholders'])
      .where('id', '=', req.params.id).executeTakeFirst()
    if (!apt) throw new AppError(404, 'Apartment not found')

    const body = z.object({
      firstName: z.string().min(1),
      lastName:  z.string().min(1),
      email:     z.string().email().optional().or(z.literal('')),
      isPrimary: z.boolean().default(false),
      gender:    z.enum(['MALE', 'FEMALE']).default('MALE'),
    }).parse(req.body)

    const current: any[] = Array.isArray(apt.shareholders) ? apt.shareholders : []
    const updated = body.isPrimary
      ? [...current.map(s => ({ ...s, isPrimary: false })), { ...body, email: body.email || null }]
      : [...current, { ...body, email: body.email || null }]

    const result = await tenantDb.updateTable('apartments')
      .set({ shareholders: JSON.stringify(updated) as any, updated_at: new Date() })
      .where('id', '=', req.params.id).returningAll().executeTakeFirstOrThrow()

    res.status(201).json(result)
  } catch (e) { next(e) }
})

router.put('/:id/shareholders', requirePermission('apartment', 'update'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const shareholders = z.array(z.object({
      firstName: z.string().min(1),
      lastName:  z.string().min(1),
      email:     z.string().email().nullable().optional().or(z.literal('')),
      isPrimary: z.boolean(),
      gender:    z.enum(['MALE', 'FEMALE']).optional(),
    })).parse(req.body.shareholders)

    const result = await tenantDb.updateTable('apartments')
      .set({ shareholders: JSON.stringify(shareholders.map(s => ({ ...s, email: s.email || null }))) as any, updated_at: new Date() })
      .where('id', '=', req.params.id).returningAll().executeTakeFirstOrThrow()

    res.json(result)
  } catch (e) { next(e) }
})

router.patch('/:id', requirePermission('apartment', 'update'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const existing = await tenantDb
      .selectFrom('apartments')
      .select('id')
      .where('id', '=', req.params.id)
      .executeTakeFirst()
    if (!existing) throw new AppError(404, 'Apartment not found')

    const apartment = await tenantDb
      .updateTable('apartments')
      .set({ ...req.body, updated_at: new Date() })
      .where('id', '=', req.params.id)
      .returningAll()
      .executeTakeFirstOrThrow()
    res.json(apartment)
  } catch (e) { next(e) }
})

router.delete('/:id', requirePermission('apartment', 'delete'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const existing = await tenantDb
      .selectFrom('apartments')
      .select('id')
      .where('id', '=', req.params.id)
      .executeTakeFirst()
    if (!existing) throw new AppError(404, 'Apartment not found')

    await tenantDb
      .deleteFrom('apartments')
      .where('id', '=', req.params.id)
      .execute()
    res.status(204).send()
  } catch (e) { next(e) }
})

export default router
