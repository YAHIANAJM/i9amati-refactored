import type { FeedAnalyticsGroupStat, FeedAnalyticsTimelinePoint } from '@i9amati/shared'

export const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

export function deriveGroupStats(rawGroups: FeedAnalyticsGroupStat[]) {
  return rawGroups.map(g => ({
    name:     g.name.length > 16 ? g.name.slice(0, 16) + '…' : g.name,
    fullName: g.name,
    posts:    g.postCount,
    likes:    g.likeCount,
    comments: g.commentCount,
    members:  g.memberCount,
  }))
}

export function deriveTimelineData(rawTimeline: FeedAnalyticsTimelinePoint[]) {
  return rawTimeline.map(r => ({ date: r.date.slice(5), count: r.count }))
}

export function deriveAvgEngagement(totalPosts: number, totalLikes: number, totalComments: number) {
  return totalPosts > 0 ? Math.round((totalLikes + totalComments) / totalPosts) : 0
}
