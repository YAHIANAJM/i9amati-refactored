import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { getPayments, createPayment, updatePaymentStatus } from '../controllers/payment'

export const paymentRouter = Router()

paymentRouter.use(authenticate)
paymentRouter.get('/', getPayments)
paymentRouter.post('/', requireRole('SYNDIC', 'ADMIN'), createPayment)
paymentRouter.patch('/:id/status', requireRole('SYNDIC', 'ADMIN'), updatePaymentStatus)
