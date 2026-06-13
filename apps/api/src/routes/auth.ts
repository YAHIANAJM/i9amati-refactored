import { Router } from 'express'
import { login, register, me, logout } from '../controllers/auth'
import { authenticate } from '../middleware/auth'

export const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.get('/me', authenticate, me)
authRouter.post('/logout', logout)
