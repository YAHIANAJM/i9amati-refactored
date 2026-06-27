import { Router, Request } from 'express'
import { randomUUID } from 'crypto'
import { authenticate, AuthRequest } from '../middleware/auth'
import { sendDelegateInvitationEmail, sendPartnerInvitationEmail } from '../lib/mailer'
import { AppError } from '../middleware/errorHandler'
import { db } from '../db/db'

const router = Router()
router.use(authenticate)

// ─── Buildings ────────────────────────────────────────────────────────────────

router.get('/buildings', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const buildings = await tenantDb
      .selectFrom('buildings as b')
      .innerJoin('residences as r', 'r.id', 'b.residence_id')
      .select(['b.id', 'b.name', 'r.name as residence_name'])
      .orderBy('b.name', 'asc')
      .execute()
    res.json(buildings)
  } catch (err) { next(err) }
})

// ─── Delegates ────────────────────────────────────────────────────────────────
// Pending: invitation not yet accepted → stored in delegate_invitations + public.invitations
// Active:  accepted → stored in _profile_groups with role RIGHT_HAND
// We return a unified list so the frontend doesn't need to know the difference.

router.get('/delegates', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId } = req as AuthRequest

    // Pending: delegate_invitations where status = PENDING, joined with building name
    const pending = await tenantDb
      .selectFrom('delegate_invitations as di')
      .leftJoin('buildings as b', 'b.id', 'di.building_id')
      .select([
        'di.id', 'di.invitation_id', 'di.display_name as name',
        'di.phone', 'di.gender', 'di.note', 'di.created_at',
        'di.building_id', 'b.name as building_name',
      ])
      .where('di.status', '=', 'PENDING')
      .orderBy('di.created_at', 'desc')
      .execute()

    // Active: _profile_groups.RIGHT_HAND in any building-scoped group
    const active = await tenantDb
      .selectFrom('_profile_groups as pg')
      .innerJoin('groups as g', 'g.id', 'pg.group_id')
      .leftJoin('buildings as b', 'b.id', 'g.building_id')
      .innerJoin('public.profiles as p', 'p.id', 'pg.profile_id')
      .innerJoin('public.user as u', 'u.id', 'p.user_id')
      .select([
        'pg.id', 'u.name', 'u.email', 'u.phone',
        'g.building_id', 'b.name as building_name',
      ])
      .where('pg.role', '=', 'RIGHT_HAND')
      .orderBy('u.name', 'asc')
      .execute()

    res.json({
      pending: pending.map(r => ({ ...r, email: '', status: 'PENDING' as const })),
      active:  active.map(r => ({ ...r, gender: null, note: null, status: 'ACTIVE' as const })),
    })
  } catch (err) { next(err) }
})

router.post('/delegates', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, user } = req as AuthRequest
    const { name, email, phone, gender, building_id, note } = req.body as {
      name: string; email: string; phone?: string
      gender?: 'male' | 'female'; building_id?: string; note?: string
    }

    if (!name?.trim() || !email?.trim()) throw new AppError(400, 'name et email sont requis')

    // Create invitation in the public schema
    const invId = randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await db.insertInto('public.invitations').values({
      id: invId,
      email: email.trim(),
      invited_by_id: profileId,
      status: 'PENDING',
      expires_at: expiresAt,
      created_at: new Date(),
    }).execute()

    // Store building assignment + metadata in delegate_invitations
    const diId = randomUUID()
    await tenantDb.insertInto('delegate_invitations').values({
      id: diId,
      invitation_id: invId,
      display_name: name.trim(),
      phone: phone?.trim() || null,
      gender: gender === 'female' ? 'female' : 'male',
      building_id: building_id || null,
      note: note?.trim() || null,
      status: 'PENDING',
      created_at: new Date(),
    }).execute()

    // Ensure a building-scoped RIGHT_HAND group exists
    if (building_id) {
      const existing = await tenantDb
        .selectFrom('groups').select('id')
        .where('building_id', '=', building_id)
        .where('slug', 'like', 'right-hand-%')
        .executeTakeFirst()

      if (!existing) {
        const b = await tenantDb.selectFrom('buildings').select('name').where('id', '=', building_id).executeTakeFirst()
        await tenantDb.insertInto('groups').values({
          id: randomUUID(),
          name: `Délégués — ${b?.name ?? building_id}`,
          slug: `right-hand-${building_id}`,
          building_id,
          residence_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        }).execute()
      }
    }

    const syndicName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Le syndic'
    let buildingLabel = 'votre immeuble'
    if (building_id) {
      const b = await tenantDb.selectFrom('buildings').select('name').where('id', '=', building_id).executeTakeFirst()
      if (b) buildingLabel = b.name
    }

    const emailSent = await sendDelegateInvitationEmail({
      to: email.trim(), recipientName: name.trim(), building: buildingLabel, syndicName, note: note?.trim(),
    })

    const created = await tenantDb
      .selectFrom('delegate_invitations as di')
      .leftJoin('buildings as b', 'b.id', 'di.building_id')
      .select(['di.id', 'di.display_name as name', 'di.phone', 'di.gender', 'di.note', 'di.building_id', 'b.name as building_name', 'di.created_at'])
      .where('di.id', '=', diId)
      .executeTakeFirstOrThrow()

    res.status(201).json({ ...created, email: email.trim(), status: 'PENDING', emailSent })
  } catch (err) { next(err) }
})

router.delete('/delegates/:id', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const { id } = req.params

    // Try pending (delegate_invitations) first
    const di = await tenantDb
      .selectFrom('delegate_invitations')
      .select(['id', 'invitation_id'])
      .where('id', '=', id)
      .executeTakeFirst()

    if (di) {
      await tenantDb.deleteFrom('delegate_invitations').where('id', '=', id).execute()
      // Cancel invitation in public schema (best-effort)
      await db.updateTable('public.invitations').set({ status: 'CANCELLED' }).where('id', '=', di.invitation_id).execute().catch(() => {})
      return res.json({ success: true })
    }

    // Try active (_profile_groups.RIGHT_HAND)
    const del = await tenantDb
      .deleteFrom('_profile_groups')
      .where('id', '=', id)
      .where('role', '=', 'RIGHT_HAND')
      .executeTakeFirst()

    if (!del.numDeletedRows) throw new AppError(404, 'Délégué introuvable')
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ─── Partners ─────────────────────────────────────────────────────────────────

router.get('/partners', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const rows = await tenantDb
      .selectFrom('partner_syndics')
      .selectAll()
      .orderBy('linked_at', 'desc')
      .execute()
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/partners', async (req: Request, res, next) => {
  try {
    const { tenantDb, user } = req as AuthRequest
    const { name, email, phone, gender, residence, note } = req.body as {
      name: string; email: string; phone?: string
      gender?: 'male' | 'female'; residence: string; note?: string
    }

    if (!name?.trim() || !email?.trim() || !residence?.trim()) {
      throw new AppError(400, 'name, email et residence sont requis')
    }

    const id = randomUUID()
    await tenantDb.insertInto('partner_syndics').values({
      id,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      gender: gender === 'female' ? 'female' : 'male',
      residence: residence.trim(),
      note: note?.trim() || null,
      linked_at: new Date(),
      updated_at: new Date(),
    }).execute()

    const syndicName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Le syndic'
    let syndicResidence = 'notre résidence'
    try {
      const r = await tenantDb.selectFrom('residences').select('name').executeTakeFirst()
      if (r?.name) syndicResidence = r.name
    } catch { /* non-fatal */ }

    const emailSent = await sendPartnerInvitationEmail({
      to: email.trim(), recipientName: name.trim(), residence: residence.trim(),
      sharedParts: [], syndicName, syndicResidence, note: note?.trim(),
    })

    const created = await tenantDb.selectFrom('partner_syndics').selectAll().where('id', '=', id).executeTakeFirstOrThrow()
    res.status(201).json({ ...created, emailSent })
  } catch (err) { next(err) }
})

router.patch('/partners/:id', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const { name, phone, note } = req.body as { name?: string; phone?: string; note?: string }
    await tenantDb.updateTable('partner_syndics')
      .set({
        ...(name && { name: name.trim() }),
        phone: phone?.trim() || null,
        note: note?.trim() || null,
        updated_at: new Date(),
      })
      .where('id', '=', req.params.id)
      .execute()
    const updated = await tenantDb.selectFrom('partner_syndics').selectAll().where('id', '=', req.params.id).executeTakeFirstOrThrow()
    res.json(updated)
  } catch (err) { next(err) }
})

router.delete('/partners/:id', async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const del = await tenantDb.deleteFrom('partner_syndics').where('id', '=', req.params.id).executeTakeFirst()
    if (!del.numDeletedRows) throw new AppError(404, 'Partenaire introuvable')
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
