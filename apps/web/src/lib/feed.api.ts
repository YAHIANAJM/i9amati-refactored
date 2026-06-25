import { api } from './api'
import { deriveGroupType } from '@i9amati/shared'
import type {
  FeedGroup, FeedGroupsResponse, FeedPost, FeedComment,
  FeedMember, FeedOrgProfile, GroupType,
  FeedAnalyticsResponse,
} from '@i9amati/shared'

// ── Re-export shared types under their Api* aliases used throughout the web app

export type { GroupType, FeedAnalyticsResponse }
export type ApiGroup      = FeedGroup
export type ApiPost       = FeedPost
export type ApiComment    = FeedComment
export type ApiMember     = FeedMember
export type ApiOrgProfile = FeedOrgProfile
export type GroupsResponse = FeedGroupsResponse

// ── Raw shape returned by the API before client-side derivation ───────────────

interface RawGroup {
  id: string
  name: string
  slug: string
  residence_id: string | null
  building_id: string | null
  created_at: string
  memberRole: string | null
  memberProfileGroupId: string | null
  memberCount: string // PostgreSQL COUNT returns a string
}

// ── Feed API ──────────────────────────────────────────────────────────────────

export const feedApi = {
  // Groups
  async getGroups(): Promise<GroupsResponse> {
    const data = await api.get<{
      groups: RawGroup[]
      profileId: string
      profileRole: string
    }>('/api/feed/groups')
    return {
      profileId:   data.profileId,
      profileRole: data.profileRole,
      groups: data.groups.map(g => ({
        ...g,
        type:        deriveGroupType(g),
        memberCount: Number(g.memberCount),
      })),
    }
  },

  // Posts (cursor-based pagination)
  async getPosts(
    groupId: string,
    cursor?: string,
    limit = 20,
  ): Promise<{ posts: ApiPost[]; hasMore: boolean; nextCursor: string | null }> {
    const params = new URLSearchParams({ limit: String(limit) })
    if (cursor) params.set('cursor', cursor)
    return api.get(`/api/feed/groups/${groupId}/posts?${params}`)
  },

  // Post CRUD
  async createPost(
    groupId: string,
    payload: { content: string; mediaUrl?: string | null; mediaType?: 'image' | 'video' | null }
  ): Promise<{ id: string }> {
    return api.post(`/api/feed/groups/${groupId}/posts`, payload)
  },

  async updatePost(
    postId: string,
    payload: { content: string; mediaUrl?: string | null; mediaType?: 'image' | 'video' | null }
  ): Promise<{ id: string }> {
    return api.patch(`/api/feed/posts/${postId}`, payload)
  },

  async deletePost(postId: string): Promise<void> {
    return api.delete(`/api/feed/posts/${postId}`)
  },

  // Comments
  async getComments(postId: string): Promise<ApiComment[]> {
    const data = await api.get<{ comments: ApiComment[] }>(`/api/feed/posts/${postId}/comments`)
    return data.comments
  },

  async createComment(
    postId: string,
    content: string,
    parentId?: string,
  ): Promise<{ id: string }> {
    return api.post(`/api/feed/posts/${postId}/comments`, { content, parentId })
  },

  async updateComment(commentId: string, content: string): Promise<{ id: string }> {
    return api.patch(`/api/feed/comments/${commentId}`, { content })
  },

  async deleteComment(commentId: string): Promise<void> {
    return api.delete(`/api/feed/comments/${commentId}`)
  },

  // Likes (idempotent)
  async likePost(postId: string): Promise<{ liked: true }> {
    return api.post(`/api/feed/posts/${postId}/like`)
  },

  async unlikePost(postId: string): Promise<void> {
    return api.delete(`/api/feed/posts/${postId}/like`)
  },

  // ── Group CRUD ──────────────────────────────────────────────────────────────

  async createGroup(
    name: string,
    residenceId?: string,
    buildingId?: string,
  ): Promise<{ id: string; slug: string }> {
    return api.post('/api/feed/groups', { name, residenceId, buildingId })
  },

  async updateGroup(groupId: string, name: string): Promise<{ id: string }> {
    return api.patch(`/api/feed/groups/${groupId}`, { name })
  },

  async deleteGroup(groupId: string): Promise<void> {
    return api.delete(`/api/feed/groups/${groupId}`)
  },

  // ── Member management ───────────────────────────────────────────────────────

  async getGroupMembers(groupId: string): Promise<ApiMember[]> {
    const data = await api.get<{ members: ApiMember[] }>(`/api/feed/groups/${groupId}/members`)
    return data.members
  },

  async addGroupMember(groupId: string, profileId: string): Promise<{ membershipId: string }> {
    return api.post(`/api/feed/groups/${groupId}/members`, { profileId })
  },

  async removeGroupMember(groupId: string, profileId: string): Promise<void> {
    return api.delete(`/api/feed/groups/${groupId}/members/${profileId}`)
  },

  // ── Org profiles (for member picker) ───────────────────────────────────────

  async getOrgProfiles(): Promise<ApiOrgProfile[]> {
    const data = await api.get<{ profiles: ApiOrgProfile[] }>('/api/feed/org-profiles')
    return data.profiles
  },

  // ── Analytics (SYNDIC only) ─────────────────────────────────────────────────

  async getAnalytics(): Promise<FeedAnalyticsResponse> {
    return api.get<FeedAnalyticsResponse>('/api/feed/analytics')
  },
}
