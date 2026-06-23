import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { handleChatMessage } from '../chatbot/index'

const router = Router()

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a moment.' },
})

router.post('/', limiter, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'message is required' })
      return
    }
    const result = await handleChatMessage(message.trim(), history)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

export default router
