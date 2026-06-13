export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED'
export type PaymentType   = 'CHARGE' | 'MAINTENANCE' | 'REPAIR' | 'INSURANCE' | 'OTHER'

export interface Payment {
  id: string
  amount: number
  status: PaymentStatus
  type: PaymentType
  dueDate: string
  paidAt?: string
  description?: string
  apartmentId: string
  buildingId: string
  residenceId: string
  createdAt: string
}
