import { PlatformRole } from '../permissions'

export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  firstName?: string
  lastName?: string
  phone?: string
  platformRole: PlatformRole
  createdAt: string
  updatedAt: string
}

export interface SessionUser extends User {
  activeOrganizationId?: string
}
