import { Router } from 'express'
import { z } from 'zod'
import { handleChatMessage } from '../chatbot'

export const chatbotRouter = Router()

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional().default([]),
})

chatbotRouter.post('/', async (req, res) => {
  try {
    const parsed = chatRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request format', details: parsed.error.issues })
    }

    const { message, history } = parsed.data

    const result = await handleChatMessage(message, history)

    res.json(result)
  } catch (error) {
    console.error('[Chatbot Route Error]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
