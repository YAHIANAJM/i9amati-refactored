import { Router, Request } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', (req: Request, res) => {
  const { userId, profileId, profileRole, platformRole, activeOrganizationId, orgSlug, user } = req as AuthRequest
  res.json({
    userId,
    profileId,
    profileRole,   // SYNDIC | STAFF | OWNER | TENANT
    platformRole,
    activeOrganizationId,
    orgSlug,
    name:  `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name,
    email: user.email,
  })
})

export default router
