export type UnionType = 'IMMEUBLE' | 'RESIDENCE'

export interface Building {
  id: string
  name: string
  address: string
  unionType: UnionType
  residenceId: string        // always set — IMMEUBLE gets an auto-created Residence
  image?: string             // if null → default building illustration
  propertyPlanNumber?: string
  numberOfFloors?: number
  totalUnits?: number
  hasElevator?: boolean
  hasGarage?: boolean
  hasSharedParts?: boolean
  sharedWithTitleDeed?: string  // only if hasSharedParts = true
  description?: string
  createdAt: string
  updatedAt: string
}
