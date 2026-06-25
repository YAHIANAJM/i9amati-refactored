export type GroupType = 'residence' | 'building' | 'custom'

export interface FeedGroup {
  id: string
  name: string
  slug: string
  residence_id: string | null
  building_id: string | null
  created_at: string
  memberRole: string | null
  memberProfileGroupId: string | null
  memberCount: number
  type: GroupType
}

export interface FeedGroupsResponse {
  profileId: string
  profileRole: string
  groups: FeedGroup[]
}

export interface FeedPost {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  authorId: string
  authorProfileId: string
  authorGroupRole: string
  authorName: string | null
  authorAvatar: string | null
  likeCount: number
  likedByMe: boolean
  commentCount: number
}

export interface FeedComment {
  id: string
  content: string
  postId: string
  parentId: string | null
  authorProfileId: string
  authorName: string | null
  authorAvatar: string | null
  createdAt: string
}

export interface FeedMember {
  membershipId: string
  profileId: string
  groupRole: 'USER' | 'ADMIN' | 'RIGHT_HAND'
  orgRole: string | null
  name: string | null
  avatar: string | null
}

export interface FeedOrgProfile {
  profileId: string
  name: string | null
  orgRole: string | null
  image: string | null
}

export function deriveGroupType(g: { building_id: string | null; residence_id: string | null }): GroupType {
  if (g.building_id) return 'building'
  if (g.residence_id) return 'residence'
  return 'custom'
}
