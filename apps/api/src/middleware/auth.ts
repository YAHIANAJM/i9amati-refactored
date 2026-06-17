import { Request, Response, NextFunction } from 'express'
import { auth } from '../auth'
import { PlatformRole } from '@i9amati/shared'

export interface AuthRequest extends Request {
  userId: string
  platformRole: PlatformRole
  activeOrganizationId?: string
  session: typeof auth.$Infer.Session.session
  user: typeof auth.$Infer.Session.user
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authReq = req as unknown as AuthRequest
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    authReq.session              = session.session
    authReq.user                 = session.user
    authReq.userId               = session.user.id
    authReq.platformRole         = (session.user.platformRole as PlatformRole) ?? PlatformRole.USER
    authReq.activeOrganizationId = session.session.activeOrganizationId ?? undefined

    next()
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

// requireResidenceRole will be added here once ResidenceProfile is in the schema
