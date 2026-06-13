import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { getResidences, getResidence, createResidence, updateResidence, deleteResidence } from '../controllers/residence'

export const residenceRouter = Router()

residenceRouter.use(authenticate)
residenceRouter.get('/', getResidences)
residenceRouter.get('/:id', getResidence)
residenceRouter.post('/', requireRole('SYNDIC', 'ADMIN'), createResidence)
residenceRouter.put('/:id', requireRole('SYNDIC', 'ADMIN'), updateResidence)
residenceRouter.delete('/:id', requireRole('ADMIN'), deleteResidence)
