import { Router, Request } from 'express'
import { prisma } from '../prisma/client'
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('residence', 'read'), async (req: Request, res, next) => {
  try {
    const { activeOrganizationId } = req as AuthRequest
    const residences = await prisma.residence.findMany({
      where: { organizationId: activeOrganizationId! },
      include: {
        _count: { select: { apartments: true, buildings: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(residences)
  } catch (e) { next(e) }
})

router.get('/:id', requirePermission('residence', 'read'), async (req: Request, res, next) => {
  try {
    const { activeOrganizationId } = req as AuthRequest
    const residence = await prisma.residence.findFirst({
      where: { id: req.params.id, organizationId: activeOrganizationId! },
      include: { buildings: true, _count: { select: { apartments: true } } },
    })
    if (!residence) throw new AppError(404, 'Residence not found')
    res.json(residence)
  } catch (e) { next(e) }
})

router.post('/', requirePermission('residence', 'create'), async (req: Request, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { name, address, city, status, image, description, facilities } = req.body
    if (!name || !address) throw new AppError(400, 'name and address are required')

    const member = await prisma.member.findFirst({
      where: { userId: authReq.userId, organizationId: authReq.activeOrganizationId! },
    })
    if (!member) throw new AppError(403, 'Not a member of this organization')

    const residence = await prisma.residence.create({
      data: {
        name, address, city, status, image, description,
        facilities: facilities ?? [],
        organizationId: authReq.activeOrganizationId!,
        syndicMemberId: member.id,
      },
    })
    res.status(201).json(residence)
  } catch (e) { next(e) }
})

router.patch('/:id', requirePermission('residence', 'update'), async (req: Request, res, next) => {
  try {
    const { activeOrganizationId } = req as AuthRequest
    const existing = await prisma.residence.findFirst({
      where: { id: req.params.id, organizationId: activeOrganizationId! },
    })
    if (!existing) throw new AppError(404, 'Residence not found')

    const { name, address, city, status, image, description, facilities } = req.body
    const residence = await prisma.residence.update({
      where: { id: req.params.id },
      data: { name, address, city, status, image, description, facilities },
    })
    res.json(residence)
  } catch (e) { next(e) }
})

router.delete('/:id', requirePermission('residence', 'delete'), async (req: Request, res, next) => {
  try {
    const { activeOrganizationId } = req as AuthRequest
    const existing = await prisma.residence.findFirst({
      where: { id: req.params.id, organizationId: activeOrganizationId! },
    })
    if (!existing) throw new AppError(404, 'Residence not found')
    await prisma.residence.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (e) { next(e) }
})

export default router
