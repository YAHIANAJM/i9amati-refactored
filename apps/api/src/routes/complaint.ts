import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { getComplaints, createComplaint, updateComplaintStatus } from '../controllers/complaint'

export const complaintRouter = Router()

complaintRouter.use(authenticate)
complaintRouter.get('/', getComplaints)
complaintRouter.post('/', createComplaint)
complaintRouter.patch('/:id/status', updateComplaintStatus)
