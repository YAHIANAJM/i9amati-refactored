import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { getApartments, getApartment, createApartment, updateApartment, deleteApartment } from '../controllers/apartment'

export const apartmentRouter = Router()

apartmentRouter.use(authenticate)
apartmentRouter.get('/', getApartments)
apartmentRouter.get('/:id', getApartment)
apartmentRouter.post('/', requireRole('SYNDIC', 'ADMIN'), createApartment)
apartmentRouter.put('/:id', requireRole('SYNDIC', 'ADMIN'), updateApartment)
apartmentRouter.delete('/:id', requireRole('SYNDIC', 'ADMIN'), deleteApartment)
