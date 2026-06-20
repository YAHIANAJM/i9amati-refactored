export type ApartmentStatus = 'OCCUPIED' | 'VACANT' | 'MAINTENANCE'
export type UsageType = 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED'

export interface Apartment {
  id: string
  unitCode: string           // e.g. "A-101"
  mainPlotNumber: string     // رقم الرسم العقاري - required
  registrationNumber?: string
  floor?: number
  areaSqm?: number
  status: ApartmentStatus
  usageType: UsageType       // default RESIDENTIAL
  percentageOfApartment?: number   // % share of building common parts
  percentageOfResidence?: number   // % share of إقامة - only if RESIDENCE type
  buildingId: string
  residenceId: string
  createdAt: string
  updatedAt: string
}
