import { Router, Request } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { db } from '../db/db'
import { sendConvocationEmail } from '../lib/mailer'
import { randomUUID } from 'crypto'

const router = Router()
router.use(authenticate)

// ── shape helpers ──────────────────────────────────────────────────────────────

function fmtMeeting(m: any, agenda: any[], attendees: any[]) {
  return {
    id:                  m.id,
    title:               m.title,
    description:         m.description ?? undefined,
    type:                m.type,
    status:              m.status,
    convocationNumber:   m.convocation_number as 1 | 2,
    scheduledAt:         m.scheduled_at,
    location:            m.location ?? undefined,
    residenceId:         m.residence_id ?? '',
    buildingId:          m.building_id ?? undefined,
    convocationSentAt:   m.convocation_sent_at ?? undefined,
    createdAt:           m.created_at,
    totalEligible:       m.total_eligible,
    agenda: agenda
      .filter(ai => ai.meeting_id === m.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(ai => ({
        id:          ai.id,
        title:       ai.title,
        description: ai.description ?? undefined,
        voteStatus:  ai.vote_status,
        pour:        ai.pour,
        contre:      ai.contre,
        abstention:  ai.abstention,
        result:      ai.result ?? undefined,
      })),
    attendeeList: attendees
      .filter(a => a.meeting_id === m.id)
      .map(a => ({
        id:        a.id,
        name:      a.name,
        apartment: a.apartment,
        rsvp:      a.rsvp,
        present:   a.present,
      })),
  }
}

// ── GET /api/meetings ──────────────────────────────────────────────────────────

router.get('/', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest

    const meetings = await tenantDb
      .selectFrom('meetings as m')
      .leftJoin('buildings as b', 'b.id', 'm.building_id')
      .selectAll('m')
      .select('b.name as building_name')
      .orderBy('m.scheduled_at', 'desc')
      .execute()

    const ids = meetings.map(m => m.id)

    const [agendaItems, attendees] = ids.length
      ? await Promise.all([
          tenantDb.selectFrom('agenda_items').selectAll().where('meeting_id', 'in', ids).execute(),
          tenantDb.selectFrom('meeting_attendees').selectAll().where('meeting_id', 'in', ids).execute(),
        ])
      : [[], []]

    res.json(meetings.map(m => ({ ...fmtMeeting(m, agendaItems, attendees), buildingName: (m as any).building_name ?? undefined })))
  } catch (e) { next(e) }
})

// ── GET /api/meetings/:id ──────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const m = await tenantDb
      .selectFrom('meetings as m')
      .leftJoin('buildings as b', 'b.id', 'm.building_id')
      .selectAll('m')
      .select('b.name as building_name')
      .where('m.id', '=', req.params.id)
      .executeTakeFirst()
    if (!m) throw new AppError(404, 'Meeting not found')

    const [agendaItems, attendees] = await Promise.all([
      tenantDb.selectFrom('agenda_items').selectAll().where('meeting_id', '=', m.id).execute(),
      tenantDb.selectFrom('meeting_attendees').selectAll().where('meeting_id', '=', m.id).execute(),
    ])

    res.json({ ...fmtMeeting(m, agendaItems, attendees), buildingName: (m as any).building_name ?? undefined })
  } catch (e) { next(e) }
})

// ── POST /api/meetings ─────────────────────────────────────────────────────────

router.post('/', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const {
      title, description, type = 'GLOBAL', convocationNumber = 1,
      scheduledAt, location, totalEligible = 0, buildingId,
      agenda = [],
    } = req.body

    if (!title || !scheduledAt || !buildingId) throw new AppError(400, 'title, scheduledAt and buildingId are required')

    // Derive residence from building
    const building = await tenantDb.selectFrom('buildings').select(['residence_id']).where('id', '=', buildingId).executeTakeFirst()
    if (!building) throw new AppError(404, 'Building not found')

    const now = new Date()
    const id  = randomUUID()

    await tenantDb.insertInto('meetings').values({
      id,
      title,
      description:          description ?? null,
      type,
      status:               'SCHEDULED',
      convocation_number:   convocationNumber,
      scheduled_at:         new Date(scheduledAt),
      location:             location ?? null,
      total_eligible:       totalEligible,
      residence_id:         building.residence_id,
      building_id:          buildingId,
      convocation_sent_at:  null,
      updated_at:           now,
    }).execute()

    if (agenda.length) {
      await tenantDb.insertInto('agenda_items').values(
        agenda.map((item: any, i: number) => ({
          id:          randomUUID(),
          meeting_id:  id,
          title:       item.title,
          description: item.description ?? null,
          vote_status: 'PENDING',
          pour:        0,
          contre:      0,
          abstention:  0,
          result:      null,
          sort_order:  i,
          updated_at:  now,
        }))
      ).execute()
    }

    const [meeting, agendaItems, attendees] = await Promise.all([
      tenantDb.selectFrom('meetings').selectAll().where('id', '=', id).executeTakeFirstOrThrow(),
      tenantDb.selectFrom('agenda_items').selectAll().where('meeting_id', '=', id).execute(),
      tenantDb.selectFrom('meeting_attendees').selectAll().where('meeting_id', '=', id).execute(),
    ])

    res.status(201).json(fmtMeeting(meeting, agendaItems, attendees))
  } catch (e) { next(e) }
})

// ── PATCH /api/meetings/:id/start ─────────────────────────────────────────────

router.patch('/:id/start', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const m = await tenantDb.selectFrom('meetings').select(['id', 'status']).where('id', '=', req.params.id).executeTakeFirst()
    if (!m) throw new AppError(404, 'Meeting not found')
    if (m.status !== 'SCHEDULED') throw new AppError(400, 'Only SCHEDULED meetings can be started')

    await tenantDb.updateTable('meetings')
      .set({ status: 'IN_PROGRESS', updated_at: new Date() })
      .where('id', '=', req.params.id)
      .execute()

    res.json({ status: 'IN_PROGRESS' })
  } catch (e) { next(e) }
})

// ── PATCH /api/meetings/:id/close ─────────────────────────────────────────────

router.patch('/:id/close', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const m = await tenantDb.selectFrom('meetings').select(['id', 'status']).where('id', '=', req.params.id).executeTakeFirst()
    if (!m) throw new AppError(404, 'Meeting not found')
    if (m.status !== 'IN_PROGRESS') throw new AppError(400, 'Only IN_PROGRESS meetings can be closed')

    // All agenda items must be CLOSED with a result before the meeting can close
    const pending = await tenantDb
      .selectFrom('agenda_items')
      .select('id')
      .where('meeting_id', '=', req.params.id)
      .where(eb => eb.or([
        eb('vote_status', '!=', 'CLOSED'),
        eb('result', 'is', null),
      ]))
      .execute()

    if (pending.length) throw new AppError(400, `${pending.length} agenda item(s) still require a result`)

    await tenantDb.updateTable('meetings')
      .set({ status: 'COMPLETED', updated_at: new Date() })
      .where('id', '=', req.params.id)
      .execute()

    res.json({ status: 'COMPLETED' })
  } catch (e) { next(e) }
})

// ── PATCH /api/meetings/:id/attendees/:attendeeId/presence ────────────────────

router.patch('/:id/attendees/:attendeeId/presence', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const att = await tenantDb
      .selectFrom('meeting_attendees')
      .select(['id', 'present'])
      .where('id', '=', req.params.attendeeId)
      .where('meeting_id', '=', req.params.id)
      .executeTakeFirst()
    if (!att) throw new AppError(404, 'Attendee not found')

    await tenantDb.updateTable('meeting_attendees')
      .set({ present: !att.present, updated_at: new Date() })
      .where('id', '=', req.params.attendeeId)
      .execute()

    res.json({ present: !att.present })
  } catch (e) { next(e) }
})

// ── POST /api/meetings/:id/agenda/:itemId/open ────────────────────────────────

router.post('/:id/agenda/:itemId/open', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest

    // Meeting must be IN_PROGRESS
    const m = await tenantDb.selectFrom('meetings').select(['id', 'status', 'convocation_number', 'total_eligible']).where('id', '=', req.params.id).executeTakeFirst()
    if (!m) throw new AppError(404, 'Meeting not found')
    if (m.status !== 'IN_PROGRESS') throw new AppError(400, 'Meeting is not in progress')

    // Quorum check for 1ère convocation (Loi 18-00 art. 30)
    if (m.convocation_number === 1) {
      const presentCount = await tenantDb
        .selectFrom('meeting_attendees')
        .select(eb => eb.fn.countAll().as('cnt'))
        .where('meeting_id', '=', req.params.id)
        .where('present', '=', true)
        .executeTakeFirstOrThrow()
      const required = Math.ceil(m.total_eligible * 0.5)
      if (Number(presentCount.cnt) < required) {
        throw new AppError(400, `Quorum not reached: ${presentCount.cnt} present, ${required} required`)
      }
    }

    const item = await tenantDb.selectFrom('agenda_items').select(['id', 'vote_status']).where('id', '=', req.params.itemId).where('meeting_id', '=', req.params.id).executeTakeFirst()
    if (!item) throw new AppError(404, 'Agenda item not found')
    if (item.vote_status !== 'PENDING') throw new AppError(400, 'Vote is not pending')

    await tenantDb.updateTable('agenda_items')
      .set({ vote_status: 'OPEN', updated_at: new Date() })
      .where('id', '=', req.params.itemId)
      .execute()

    res.json({ voteStatus: 'OPEN' })
  } catch (e) { next(e) }
})

// ── POST /api/meetings/:id/agenda/:itemId/cast ────────────────────────────────

router.post('/:id/agenda/:itemId/cast', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const { type } = req.body  // 'pour' | 'contre' | 'abstention'
    if (!['pour', 'contre', 'abstention'].includes(type)) throw new AppError(400, 'type must be pour | contre | abstention')

    const item = await tenantDb.selectFrom('agenda_items').selectAll().where('id', '=', req.params.itemId).where('meeting_id', '=', req.params.id).executeTakeFirst()
    if (!item) throw new AppError(404, 'Agenda item not found')
    if (item.vote_status !== 'OPEN') throw new AppError(400, 'Vote is not open')

    await tenantDb.updateTable('agenda_items')
      .set({ [type]: (item as any)[type] + 1, updated_at: new Date() })
      .where('id', '=', req.params.itemId)
      .execute()

    res.json({ [type]: (item as any)[type] + 1 })
  } catch (e) { next(e) }
})

// ── POST /api/meetings/:id/agenda/:itemId/close ───────────────────────────────

router.post('/:id/agenda/:itemId/close', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const item = await tenantDb.selectFrom('agenda_items').selectAll().where('id', '=', req.params.itemId).where('meeting_id', '=', req.params.id).executeTakeFirst()
    if (!item) throw new AppError(404, 'Agenda item not found')
    if (item.vote_status !== 'OPEN') throw new AppError(400, 'Vote is not open')

    // Loi 18-00: tie → president must exercise voix prépondérante (result stays null)
    const result = item.pour > item.contre
      ? 'ADOPTED'
      : item.contre > item.pour
        ? 'REJECTED'
        : null

    await tenantDb.updateTable('agenda_items')
      .set({ vote_status: 'CLOSED', result, updated_at: new Date() })
      .where('id', '=', req.params.itemId)
      .execute()

    res.json({ voteStatus: 'CLOSED', result })
  } catch (e) { next(e) }
})

// ── PATCH /api/meetings/:id/send-convocation ─────────────────────────────────

router.patch('/:id/send-convocation', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const m = await tenantDb
      .selectFrom('meetings')
      .select(['id', 'title', 'status', 'scheduled_at', 'location', 'convocation_sent_at'])
      .where('id', '=', req.params.id)
      .executeTakeFirst()
    if (!m) throw new AppError(404, 'Meeting not found')
    if (m.status !== 'SCHEDULED') throw new AppError(400, 'Only SCHEDULED meetings can have a convocation sent')
    if (m.convocation_sent_at) throw new AppError(400, 'Convocation already sent')

    const sentAt = new Date()
    await tenantDb.updateTable('meetings')
      .set({ convocation_sent_at: sentAt, updated_at: sentAt })
      .where('id', '=', req.params.id)
      .execute()

    // Fire-and-forget email delivery — don't block the response
    sendConvocationEmails(tenantDb, m).catch(err =>
      console.error('[Convocation] Email delivery failed:', err)
    )

    res.json({ convocationSentAt: sentAt.toISOString() })
  } catch (e) { next(e) }
})

async function sendConvocationEmails(
  tenantDb: import('../middleware/auth').TenantDB,
  meeting: { id: string; title: string; scheduled_at: unknown; location: string | null }
) {
  const [attendees, agendaItems] = await Promise.all([
    tenantDb.selectFrom('meeting_attendees')
      .select(['profile_id', 'name'])
      .where('meeting_id', '=', meeting.id)
      .where('profile_id', 'is not', null)
      .execute(),
    tenantDb.selectFrom('agenda_items')
      .select(['title', 'description'])
      .where('meeting_id', '=', meeting.id)
      .orderBy('sort_order', 'asc')
      .execute(),
  ])

  const profileIds = attendees.map(a => a.profile_id as string).filter(Boolean)
  if (!profileIds.length) return

  // Resolve profile_id → user email via public schema (two steps to avoid cross-schema join)
  const profiles = await db
    .selectFrom('public.profiles')
    .select(['id', 'user_id'])
    .where('id', 'in', profileIds)
    .execute()

  const userIds = profiles.map(p => p.user_id)
  if (!userIds.length) return

  const users = await db
    .selectFrom('public.user')
    .select(['id', 'email', 'name', 'first_name', 'last_name'])
    .where('id', 'in', userIds)
    .execute()

  const userById = new Map(users.map(u => [u.id, u]))
  const agenda   = agendaItems.map(ai => ({ title: ai.title, description: ai.description ?? undefined }))

  await Promise.all(
    profiles.map(p => {
      const user = userById.get(p.user_id)
      if (!user?.email) return
      const attendee = attendees.find(a => a.profile_id === p.id)
      return sendConvocationEmail({
        to:            user.email,
        recipientName: user.first_name
          ? `${user.first_name} ${user.last_name ?? ''}`.trim()
          : (attendee?.name ?? user.name),
        meetingTitle:    meeting.title,
        meetingDate:     new Date(meeting.scheduled_at as any),
        meetingLocation: meeting.location,
        agendaItems:     agenda,
      }).catch(err => console.error('[Mailer] Failed for', user.email, err))
    })
  )
}

// ── POST /api/meetings/:id/agenda/:itemId/president ───────────────────────────

router.post('/:id/agenda/:itemId/president', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const { result } = req.body  // 'ADOPTED' | 'REJECTED'
    if (!['ADOPTED', 'REJECTED'].includes(result)) throw new AppError(400, 'result must be ADOPTED or REJECTED')

    const item = await tenantDb.selectFrom('agenda_items').select(['id', 'vote_status', 'result']).where('id', '=', req.params.itemId).where('meeting_id', '=', req.params.id).executeTakeFirst()
    if (!item) throw new AppError(404, 'Agenda item not found')
    if (item.vote_status !== 'CLOSED') throw new AppError(400, 'Vote must be closed first')
    if (item.result !== null) throw new AppError(400, 'Result already set — no tie exists')

    await tenantDb.updateTable('agenda_items')
      .set({ result, updated_at: new Date() })
      .where('id', '=', req.params.itemId)
      .execute()

    res.json({ result })
  } catch (e) { next(e) }
})

export default router
