import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { getMeetings, createMeeting, updateMeeting } from '../controllers/meeting'

export const meetingRouter = Router()

meetingRouter.use(authenticate)
meetingRouter.get('/', getMeetings)
meetingRouter.post('/', requireRole('SYNDIC', 'ADMIN'), createMeeting)
meetingRouter.put('/:id', requireRole('SYNDIC', 'ADMIN'), updateMeeting)
