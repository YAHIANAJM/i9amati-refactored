import { Router, Request } from 'express'
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const router = Router()
router.use(authenticate)

router.get('/', requirePermission('residence', 'read'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const residences = await tenantDb
      .selectFrom('residences')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute()
    res.json(residences)
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
    const { name, address, city, status, image, description } = req.body
    if (!name || !address) throw new AppError(400, 'name and address are required')

    const residence = await tenantDb
      .insertInto('residences')
      .values({ name, address, city, status, image, description, updated_at: new Date() })
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

    const { name, address, city, status, image, description } = req.body
    const residence = await tenantDb
      .updateTable('residences')
      .set({ name, address, city, status, image, description, updated_at: new Date() })
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
