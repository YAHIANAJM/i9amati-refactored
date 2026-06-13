export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface VoteOption {
  label: string
  votes: number
}

export interface Meeting {
  id: string
  title: string
  description?: string
  status: MeetingStatus
  scheduledAt: string
  location?: string
  agenda?: string[]
  voteOptions?: VoteOption[]
  buildingId: string
  residenceId: string
  createdAt: string
}
