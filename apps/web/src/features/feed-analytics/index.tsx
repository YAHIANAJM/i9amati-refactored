import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { defineFeedAbility, ProfileRole } from '@i9amati/shared'
import { feedApi } from '@/lib/feed.api'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { KpiRow } from './components/KpiRow'
import { ChartsSection } from './sections/ChartsSection'
import { InsightsSection } from './sections/InsightsSection'
import { deriveGroupStats, deriveTimelineData, deriveAvgEngagement } from './utils'

export function FeedDash() {
  const { t } = useTranslation()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['feed-analytics'],
    queryFn:  feedApi.getAnalytics,
  })

  const ability = useMemo(() => {
    if (!data) return null
    return defineFeedAbility(data.profileRole as ProfileRole, '', [])
  }, [data])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title={t('feedAnalytics.title')} subtitle={t('feedAnalytics.subtitle')} />
        <div className="flex-1 p-6 grid grid-cols-5 gap-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 h-20 bg-slate-100 rounded-lg" /></Card>
          ))}
        </div>
      </div>
    )
  }

  if (isError || (data && ability && ability.cannot('read', 'FeedAnalytics'))) {
    const is403 =
      (error as any)?.error?.status === 403 ||
      (data && ability?.cannot('read', 'FeedAnalytics'))
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title={t('feedAnalytics.title')} subtitle={t('feedAnalytics.subtitle')} />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-sm font-medium text-foreground">
                {is403 ? t('feedAnalytics.error.forbiddenTitle') : t('feedAnalytics.error.title')}
              </p>
              <p className="text-xs text-muted-foreground">
                {is403 ? t('feedAnalytics.error.forbiddenDesc') : t('feedAnalytics.error.desc')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, groupStats: rawGroups, timeline: rawTimeline, topPosts, topMembers } = data
  const groupStats    = deriveGroupStats(rawGroups)
  const timelineData  = deriveTimelineData(rawTimeline)
  const avgEngagement = deriveAvgEngagement(summary.totalPosts, summary.totalLikes, summary.totalComments)

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={t('feedAnalytics.title')} subtitle={t('feedAnalytics.subtitle')} />
      <div className="flex-1 p-6 space-y-6 animate-fade-in">
        <KpiRow
          totalPosts={summary.totalPosts}
          totalLikes={summary.totalLikes}
          totalComments={summary.totalComments}
          totalMembers={summary.totalMembers}
          avgEngagement={avgEngagement}
        />
        <ChartsSection groupStats={groupStats} timelineData={timelineData} />
        <InsightsSection topPosts={topPosts} topMembers={topMembers} groupStats={groupStats} />
      </div>
    </div>
  )
}
