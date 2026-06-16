import { Request, Response, NextFunction } from 'express'
import { auth } from '../auth'
import { ac } from '@i9amati/shared'

export interface AuthRequest extends Request {
  userId: string
  userRole: string
  session: typeof auth.$Infer.Session.session
  user: typeof auth.$Infer.Session.user
  activeOrganizationId?: string
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authReq = req as unknown as AuthRequest
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    authReq.session = session.session
    authReq.user = session.user
    authReq.userId = session.user.id
    authReq.userRole = session.user.role || 'user'
    authReq.activeOrganizationId = session.session.activeOrganizationId || undefined

    next()
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export function requirePermission(
  resource: keyof typeof ac.statements,
  action: 'create' | 'read' | 'update' | 'delete'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as unknown as AuthRequest
    try {
      if (!authReq.session || !authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!authReq.activeOrganizationId) {
        return res.status(403).json({ error: 'No active organization selected' })
      }

      const response = await auth.api.hasPermission({
        headers: req.headers,
        body: { permissions: { [resource]: [action] } },
      })

      if (!response || response.success === false) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' })
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(403).json({ error: 'Forbidden' })
    }
  }
}
