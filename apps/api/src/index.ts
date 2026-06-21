import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth'
import residencesRouter from './routes/residences'
import apartmentsRouter from './routes/apartments'
import meetingsRouter from './routes/meetings'
import { errorHandler } from './middleware/errorHandler'
import { db } from './db/db'

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors({ origin: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(','), credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.all('/api/auth/*', toNodeHandler(auth))

app.use('/api/residences', residencesRouter)
app.use('/api/apartments', apartmentsRouter)
app.use('/api/meetings',   meetingsRouter)

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
