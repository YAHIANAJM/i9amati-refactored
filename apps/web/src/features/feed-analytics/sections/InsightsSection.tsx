import { TopPostsCard } from '../components/TopPostsCard'
import { TopMembersCard } from '../components/TopMembersCard'
import { PostsDistributionPie } from '../components/PostsDistributionPie'
import type { FeedAnalyticsTopPost, FeedAnalyticsTopMember } from '@i9amati/shared'

interface DerivedGroupStat { fullName: string; posts: number }

interface InsightsSectionProps {
  topPosts:   FeedAnalyticsTopPost[]
  topMembers: FeedAnalyticsTopMember[]
  groupStats: DerivedGroupStat[]
}

export function InsightsSection({ topPosts, topMembers, groupStats }: InsightsSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <TopPostsCard posts={topPosts} />
      <TopMembersCard members={topMembers} />
      <PostsDistributionPie data={groupStats} />
    </div>
  )
}
