import { useTranslation } from 'react-i18next'
import { MessageCircle, Heart, Users, FileText, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface KpiRowProps {
  totalPosts:    number
  totalLikes:    number
  totalComments: number
  totalMembers:  number
  avgEngagement: number
}

export function KpiRow({ totalPosts, totalLikes, totalComments, totalMembers, avgEngagement }: KpiRowProps) {
  const { t } = useTranslation()

  const kpis = [
    { icon: FileText,      label: t('feedAnalytics.kpi.publications'),  value: totalPosts,    color: 'text-blue-600',    bg: 'bg-blue-50'    },
    { icon: Heart,         label: t('feedAnalytics.kpi.totalLikes'),    value: totalLikes,    color: 'text-red-500',     bg: 'bg-red-50'     },
    { icon: MessageCircle, label: t('feedAnalytics.kpi.comments'),      value: totalComments, color: 'text-violet-600',  bg: 'bg-violet-50'  },
    { icon: Users,         label: t('feedAnalytics.kpi.members'),       value: totalMembers,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: TrendingUp,    label: t('feedAnalytics.kpi.avgEngagement'), value: avgEngagement, color: 'text-amber-600',   bg: 'bg-amber-50'   },
  ]

  return (
    <div className="grid grid-cols-5 gap-4">
      {kpis.map(k => (
        <Card key={k.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${k.bg} shrink-0`}>
              <k.icon size={18} className={k.color} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{k.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
