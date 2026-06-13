export type ResidenceStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'

export interface Residence {
  id: string
  name: string
  address: string
  city?: string
  status: ResidenceStatus
  image?: string             // if null → default building illustration
  totalUnits?: number
  description?: string
  facilities?: string[]      // e.g. ['حمام سباحة', 'حراسة', 'مصعد']
  syndicId: string
  createdAt: string
  updatedAt: string
}
