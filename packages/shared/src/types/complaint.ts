export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Complaint {
  id: string
  title: string
  description: string
  status: ComplaintStatus
  priority: ComplaintPriority
  authorId: string
  apartmentId?: string
  residenceId: string
  createdAt: string
  updatedAt: string
}
