export type OrgRole = 'admin' | 'syndic' | 'owner' | 'tenant' | 'staff'

export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
  createdAt: string
  updatedAt: string
}

export interface SessionUser extends User {
  activeOrganizationId?: string
}
