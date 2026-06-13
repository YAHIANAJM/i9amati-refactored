import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { authRouter } from './routes/auth'
import { residenceRouter } from './routes/residence'
import { apartmentRouter } from './routes/apartment'
import { paymentRouter } from './routes/payment'
import { complaintRouter } from './routes/complaint'
import { meetingRouter } from './routes/meeting'
import { feedRouter } from './routes/feed'
import { documentRouter } from './routes/document'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRouter)
app.use('/api/residences', residenceRouter)
app.use('/api/apartments', apartmentRouter)
app.use('/api/payments', paymentRouter)
app.use('/api/complaints', complaintRouter)
app.use('/api/meetings', meetingRouter)
app.use('/api/feed', feedRouter)
app.use('/api/documents', documentRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})

export default app
