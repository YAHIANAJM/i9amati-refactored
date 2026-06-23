import { Router, Request } from 'express'
import { sql } from 'kysely'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

function relTime(date: Date): string {
  const diff  = Date.now() - date.getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 60)  return `Il y a ${mins}min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days === 1) return 'Hier'
  return `Il y a ${days}j`
}

// GET /api/notifications
// Derives real-time notifications from meetings, complaints, and payments.
// Read state is tracked client-side — this endpoint always returns fresh data.
router.get('/', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const now    = new Date()
    const in14d  = new Date(now.getTime() + 14 * 86_400_000)
    const ago7d  = new Date(now.getTime() -  7 * 86_400_000)
    const ago30d = new Date(now.getTime() - 30 * 86_400_000)

    // Use sql expressions to avoid Kysely's strict ColumnType<Timestamp> comparison inference
    const [upcomingMeetings, sentConvocations, openComplaints, overduePayments, recentPayments] =
      await Promise.all([
        tenantDb.selectFrom('meetings')
          .select(['id', 'title', 'scheduled_at'])
          .where('status', '=', 'SCHEDULED')
          .where(sql<boolean>`scheduled_at > ${now}`)
          .where(sql<boolean>`scheduled_at < ${in14d}`)
          .orderBy('scheduled_at', 'asc')
          .limit(5)
          .execute(),

        tenantDb.selectFrom('meetings')
          .select(['id', 'title', 'convocation_sent_at'])
          .where('convocation_sent_at', 'is not', null)
          .where(sql<boolean>`convocation_sent_at > ${ago7d}`)
          .orderBy('convocation_sent_at', 'desc')
          .limit(5)
          .execute(),

        tenantDb.selectFrom('complaints')
          .select(['id', 'title', 'priority', 'created_at'])
          .where('status', 'in', ['OPEN', 'IN_PROGRESS'])
          .where(sql<boolean>`created_at > ${ago30d}`)
          .orderBy('created_at', 'desc')
          .limit(5)
          .execute(),

        tenantDb.selectFrom('payments')
          .innerJoin('apartments', 'apartments.id', 'payments.apartment_id')
          .select(['payments.id', 'payments.amount', 'payments.created_at', 'apartments.unit_code'])
          .where('payments.status', '=', 'OVERDUE')
          .orderBy('payments.created_at', 'desc')
          .limit(5)
          .execute(),

        tenantDb.selectFrom('payments')
          .innerJoin('apartments', 'apartments.id', 'payments.apartment_id')
          .select(['payments.id', 'payments.amount', 'payments.paid_at', 'apartments.unit_code'])
          .where('payments.status', '=', 'PAID')
          .where(sql<boolean>`payments.paid_at > ${ago7d}`)
          .orderBy('payments.paid_at', 'desc')
          .limit(5)
          .execute(),
      ])

    const notifs = [
      ...overduePayments.map(p => ({
        id:       `pay-overdue-${p.id}`,
        type:     'PAYMENT' as const,
        title:    'Paiement en retard',
        body:     `${p.amount} MAD — Apt ${p.unit_code}`,
        time:     relTime(new Date(p.created_at as any)),
        linkedAt: new Date(p.created_at as any).toISOString(),
      })),

      ...recentPayments.map(p => ({
        id:       `pay-paid-${p.id}`,
        type:     'PAYMENT' as const,
        title:    'Paiement reçu',
        body:     `${p.amount} MAD reçu — Apt ${p.unit_code}`,
        time:     relTime(new Date(p.paid_at as any)),
        linkedAt: new Date(p.paid_at as any).toISOString(),
      })),

      ...upcomingMeetings.map(m => {
        const diffDays = Math.ceil(
          (new Date(m.scheduled_at as any).getTime() - now.getTime()) / 86_400_000
        )
        return {
          id:       `mtg-upcoming-${m.id}`,
          type:     'MEETING' as const,
          title:    diffDays <= 1 ? 'Réunion dans 24h' : diffDays <= 2 ? 'Réunion dans 48h' : `Réunion dans ${diffDays}j`,
          body:     m.title,
          time:     relTime(new Date(m.scheduled_at as any)),
          linkedAt: new Date(m.scheduled_at as any).toISOString(),
        }
      }),

      ...sentConvocations.map(m => ({
        id:       `mtg-conv-${m.id}`,
        type:     'MEETING' as const,
        title:    'Convocation envoyée',
        body:     m.title,
        time:     relTime(new Date(m.convocation_sent_at as any)),
        linkedAt: new Date(m.convocation_sent_at as any).toISOString(),
      })),

      ...openComplaints.map(c => ({
        id:       `cmp-${c.id}`,
        type:     'COMPLAINT' as const,
        title:    c.priority === 'URGENT' || c.priority === 'HIGH' ? 'Réclamation urgente' : 'Nouvelle réclamation',
        body:     c.title,
        time:     relTime(new Date(c.created_at as any)),
        linkedAt: new Date(c.created_at as any).toISOString(),
      })),
    ]

    // Newest first
    notifs.sort((a, b) => new Date(b.linkedAt).getTime() - new Date(a.linkedAt).getTime())

    res.json(notifs.slice(0, 20))
  } catch (e) { next(e) }
})

export default router
