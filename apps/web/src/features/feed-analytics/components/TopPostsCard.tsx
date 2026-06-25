import { useTranslation } from 'react-i18next'
import { Award, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FeedAnalyticsTopPost } from '@i9amati/shared'

interface TopPostsCardProps { posts: FeedAnalyticsTopPost[] }

export function TopPostsCard({ posts }: TopPostsCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Award size={14} className="text-amber-500" />
          {t('feedAnalytics.topPosts.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {posts.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('feedAnalytics.topPosts.none')}</p>
        ) : (
          posts.map((post, i) => (
            <div key={post.id} className="flex items-start gap-3">
              <span className={`text-xs font-bold w-4 shrink-0 mt-0.5 ${i === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                #{i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug line-clamp-2 text-foreground">{post.content}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{post.authorName ?? '—'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Heart size={11} className="text-red-400" />
                <span className="text-xs font-medium text-red-500">{post.likeCount}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
