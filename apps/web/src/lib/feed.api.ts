import { api } from './api'

// ── Response types ────────────────────────────────────────────────────────────

export type GroupType = 'residence' | 'building' | 'custom'

export interface ApiGroup {
  id: string
  name: string
  slug: string
  residence_id: string | null
  building_id: string | null
  created_at: string
  /** Derived client-side from building_id / residence_id */
  type: GroupType
}

export interface ApiPost {
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

export interface ApiComment {
  id: string
  content: string
  postId: string
  parentId: string | null
  authorProfileId: string
  authorName: string | null
  authorAvatar: string | null
  createdAt: string
}

export interface ApiMember {
  membershipId: string
  profileId: string
  groupRole: 'USER' | 'ADMIN' | 'RIGHT_HAND'
  orgRole: string | null
  name: string | null
  avatar: string | null
}

export interface ApiOrgProfile {
  profileId: string
  name: string | null
  orgRole: string | null
  image: string | null
}


// ── Raw shapes returned by the API (before derivation) ────────────────────────

interface RawGroup {
  id: string
  name: string
  slug: string
  residence_id: string | null
  building_id: string | null
  created_at: string
}

// ── Helper ────────────────────────────────────────────────────────────────────

function deriveGroupType(g: RawGroup): GroupType {
  if (g.building_id) return 'building'
  if (g.residence_id) return 'residence'
  return 'custom'
}

// ── Feed API ──────────────────────────────────────────────────────────────────

export const feedApi = {
  // Groups
  async getGroups(): Promise<ApiGroup[]> {
    const data = await api.get<{ groups: RawGroup[] }>('/api/feed/groups')
    return data.groups.map(g => ({ ...g, type: deriveGroupType(g) }))
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
  async createPost(groupId: string, content: string): Promise<{ id: string }> {
    return api.post(`/api/feed/groups/${groupId}/posts`, { content })
  },

  async updatePost(postId: string, content: string): Promise<{ id: string }> {
    return api.patch(`/api/feed/posts/${postId}`, { content })
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
}
