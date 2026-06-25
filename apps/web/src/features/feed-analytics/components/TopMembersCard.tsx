import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FeedAnalyticsTopMember } from '@i9amati/shared'

interface TopMembersCardProps { members: FeedAnalyticsTopMember[] }

export function TopMembersCard({ members }: TopMembersCardProps) {
  const { t } = useTranslation()

  const maxTotal = members[0] ? members[0].postCount + members[0].commentCount : 1

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t('feedAnalytics.topMembers.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {members.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('feedAnalytics.topMembers.none')}</p>
        ) : (
          members.map((m, i) => {
            const total = m.postCount + m.commentCount
            return (
              <div key={m.profileId} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{m.name ?? '—'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${Math.round((total / maxTotal) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{total}</span>
                  </div>
                </div>
                <div className="flex gap-1 text-[10px] text-muted-foreground shrink-0">
                  <span className="text-blue-500">{m.postCount}p</span>
                  <span className="text-violet-500">{m.commentCount}c</span>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
