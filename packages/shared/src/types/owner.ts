export type Gender = 'MALE' | 'FEMALE'

export interface Owner {
  id: string
  firstName: string
  lastName: string
  nationalId: string         // CIN — becomes default password
  phone?: string
  email?: string             // auto-generated for representative
  gender: Gender
  profileImage?: string      // if null → auto avatar by gender
  isRepresentative: boolean  // exactly one per apartment
  apartmentId: string
  createdAt: string
}
