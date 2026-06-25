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
  mediaUrl: string | null
  mediaType: 'image' | 'video' | null
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

// ── Feed Analytics ────────────────────────────────────────────────────────────

export interface FeedAnalyticsSummary {
  totalPosts:    number
  totalLikes:    number
  totalComments: number
  totalMembers:  number
}

export interface FeedAnalyticsGroupStat {
  id:           string
  name:         string
  memberCount:  number
  postCount:    number
  likeCount:    number
  commentCount: number
}

/** One day bucket in the posts-over-time timeline. date is 'YYYY-MM-DD'. */
export interface FeedAnalyticsTimelinePoint {
  date:  string
  count: number
}

export interface FeedAnalyticsTopPost {
  id:           string
  content:      string
  likeCount:    number
  authorName:   string | null
  authorAvatar: string | null
}

export interface FeedAnalyticsTopMember {
  profileId:    string
  name:         string | null
  avatar:       string | null
  postCount:    number
  commentCount: number
}

export interface FeedAnalyticsResponse {
  profileRole: string
  summary:     FeedAnalyticsSummary
  groupStats:  FeedAnalyticsGroupStat[]
  /** Posts per day over the last 30 days, sorted ascending. */
  timeline:    FeedAnalyticsTimelinePoint[]
  /** Top 5 posts by like count. */
  topPosts:    FeedAnalyticsTopPost[]
  /** Top 6 members by total activity (posts + comments). */
  topMembers:  FeedAnalyticsTopMember[]
}
