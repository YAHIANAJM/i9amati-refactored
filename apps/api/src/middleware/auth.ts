import { Request, Response, NextFunction } from 'express'
import { auth } from '../auth'
import { ac } from '@i9amati/shared'
import { getTenantPrisma } from '../prisma/client'

export interface AuthRequest extends Request {
  userId: string
  userRole: string
  session: typeof auth.$Infer.Session.session
  user: typeof auth.$Infer.Session.user
  activeOrganizationId?: string
  tenantPrisma?: ReturnType<typeof getTenantPrisma>
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authReq = req as unknown as AuthRequest;
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session || !session.session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    authReq.session = session.session
    authReq.user = session.user
    authReq.userId = session.user.id
    authReq.userRole = session.user.role || 'user' // Global app role
    authReq.activeOrganizationId = session.session.activeOrganizationId || undefined
    if (authReq.activeOrganizationId) {
      authReq.tenantPrisma = getTenantPrisma(authReq.activeOrganizationId)
    }
    
    next()
  } catch (error) {
    console.error('Auth Middleware Error:', error)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

/**
 * requirePermission
 * Middleware to check if the current active organization session
 * has the required permission for a given resource and action.
 */
export function requirePermission(
  resource: keyof typeof ac.statements,
  action: 'create' | 'read' | 'update' | 'delete'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as unknown as AuthRequest;
    try {
      if (!authReq.session || !authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const activeOrganizationId = authReq.activeOrganizationId
      if (!activeOrganizationId) {
        return res.status(403).json({ error: 'No active organization selected' })
      }

      const response = await auth.api.hasPermission({
        headers: req.headers,
        body: {
          permissions: {
            [resource]: [action]
          }
        }
      });

      if (!response || response.success === false) {
         return res.status(403).json({ error: 'Forbidden: Insufficient organization permissions' })
      }



      authReq.activeOrganizationId = activeOrganizationId
      authReq.tenantPrisma = getTenantPrisma(activeOrganizationId)

      next()
    } catch (error) {
      console.error('Permission Check Error:', error)
      return res.status(403).json({ error: 'Forbidden' })
    }
  }
}
