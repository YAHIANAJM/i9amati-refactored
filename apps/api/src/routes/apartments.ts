import { Router, Request } from 'express'
import { prisma } from '../prisma/client'
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('apartment', 'read'), async (req: Request, res, next) => {
  try {
    const { activeOrganizationId } = req as AuthRequest
    const { residenceId, buildingId } = req.query
    const apartments = await prisma.apartment.findMany({
      where: {
        residence: { organizationId: activeOrganizationId! },
        ...(residenceId ? { residenceId: residenceId as string } : {}),
        ...(buildingId ? { buildingId: buildingId as string } : {}),
      },
      include: {
        building: { select: { name: true } },
        owner: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { unitCode: 'asc' },
    })
    res.json(apartments)
  } catch (e) { next(e) }
})

router.get('/:id', requirePermission('apartment', 'read'), async (req: Request, res, next) => {
  try {
    const { activeOrganizationId } = req as AuthRequest
    const apartment = await prisma.apartment.findFirst({
      where: { id: req.params.id, residence: { organizationId: activeOrganizationId! } },
      include: {
        building: true,
        owner: { include: { user: true } },
        tenant: { include: { user: true } },
      },
    })
    if (!apartment) throw new AppError(404, 'Apartment not found')
    res.json(apartment)
  } catch (e) { next(e) }
})

router.post('/', requirePermission('apartment', 'create'), async (req: Request, res, next) => {
  try {
    const { activeOrganizationId } = req as AuthRequest
    const { unitCode, mainPlotNumber, buildingId, residenceId, ...rest } = req.body
    if (!unitCode || !mainPlotNumber || !buildingId || !residenceId) {
      throw new AppError(400, 'unitCode, mainPlotNumber, buildingId, residenceId are required')
    }

    const residence = await prisma.residence.findFirst({
      where: { id: residenceId, organizationId: activeOrganizationId! },
    })
    if (!residence) throw new AppError(403, 'Residence not in active organization')

    const apartment = await prisma.apartment.create({
      data: { unitCode, mainPlotNumber, buildingId, residenceId, ...rest },
    })
    res.status(201).json(apartment)
  } catch (e) { next(e) }
})

router.patch('/:id', requirePermission('apartment', 'update'), async (req: Request, res, next) => {
  try {
    const { activeOrganizationId } = req as AuthRequest
    const existing = await prisma.apartment.findFirst({
      where: { id: req.params.id, residence: { organizationId: activeOrganizationId! } },
    })
    if (!existing) throw new AppError(404, 'Apartment not found')
    const apartment = await prisma.apartment.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(apartment)
  } catch (e) { next(e) }
})

router.delete('/:id', requirePermission('apartment', 'delete'), async (req: Request, res, next) => {
  try {
    const { activeOrganizationId } = req as AuthRequest
    const existing = await prisma.apartment.findFirst({
      where: { id: req.params.id, residence: { organizationId: activeOrganizationId! } },
    })
    if (!existing) throw new AppError(404, 'Apartment not found')
    await prisma.apartment.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (e) { next(e) }
})

export default router
