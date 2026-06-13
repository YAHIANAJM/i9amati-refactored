export type UserRole = 'SYNDIC' | 'OWNER' | 'TENANT' | 'STAFF' | 'ADMIN'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: UserRole
  residenceId?: string
  createdAt: string
  updatedAt: string
}

export interface AuthUser extends User {
  token: string
}
