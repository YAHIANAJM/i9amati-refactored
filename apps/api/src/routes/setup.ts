import { Router } from 'express'
import { randomUUID } from 'crypto'
import { auth } from '../auth'
import { db } from '../db/db'
import { provisionTenant } from '../db/provisionTenant'
import { AppError } from '../middleware/errorHandler'

const router = Router()

// POST /api/setup
// Called once after a new user signs up (email or social) to create their
// organisation and profile. Does NOT use the `authenticate` middleware because
// the session won't have activeOrganizationId yet.
router.post('/', async (req, res, next) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers as HeadersInit })
    if (!session?.user) throw new AppError(401, 'Not authenticated')

    const { syndicName } = req.body
    if (!syndicName || typeof syndicName !== 'string' || !syndicName.trim()) {
      throw new AppError(400, 'syndicName is required')
    }

    // Prevent double-setup
    const existing = await db
      .selectFrom('public.profiles')
      .select('id')
      .where('user_id', '=', session.user.id)
      .executeTakeFirst()
    if (existing) throw new AppError(409, 'User already has an organisation')

    const name = syndicName.trim()

    // Build a URL-safe slug — strip accents, replace spaces, append short uuid for uniqueness
    const slug = name
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 40)
      + '-' + randomUUID().slice(0, 6)

    const orgId     = randomUUID()
    const profileId = randomUUID()
    const now       = new Date()

    await db.insertInto('public.organizations').values({
      id:         orgId,
      name,
      slug,
      updated_at: now,
    }).execute()

    await db.insertInto('public.profiles').values({
      id:              profileId,
      user_id:         session.user.id,
      organization_id: orgId,
      role:            'SYNDIC',
      updated_at:      now,
    }).execute()

    // Provision the tenant PostgreSQL schema + run migrations
    await provisionTenant(slug)

    res.status(201).json({ orgId, profileId, slug })
  } catch (e) { next(e) }
})

export default router
