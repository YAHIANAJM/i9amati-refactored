import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth'
import meRouter from './routes/me'
import setupRouter from './routes/setup'
import residencesRouter from './routes/residences'
import buildingsRouter from './routes/buildings'
import apartmentsRouter from './routes/apartments'
import meetingsRouter from './routes/meetings'
import notificationsRouter from './routes/notifications'
import chatbotRouter from './routes/chatbot'
import feedRouter from './routes/feed'
import uploadRouter from './routes/upload'
import unionRouter from './routes/union'
import servicesRouter from './routes/services'
import { errorHandler } from './middleware/errorHandler'
import { db } from './db/db'

const app = express()
const PORT = process.env.PORT || 4000

// Trust nginx reverse proxy so req.ip / secure cookies work correctly
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

app.use(helmet())
app.use(cors({ origin: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(','), credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.all('/api/auth/*', toNodeHandler(auth))

app.use('/api/me', meRouter)
app.use('/api/setup', setupRouter)
app.use('/api/residences', residencesRouter)
app.use('/api/buildings', buildingsRouter)
app.use('/api/apartments', apartmentsRouter)
app.use('/api/meetings', meetingsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/chatbot', chatbotRouter)
app.use('/api/feed', feedRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/union', unionRouter)
app.use('/api/services', servicesRouter)

app.use(errorHandler)

const server = app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})

async function shutdown() {
  server.close()
  await db.destroy()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export default app
