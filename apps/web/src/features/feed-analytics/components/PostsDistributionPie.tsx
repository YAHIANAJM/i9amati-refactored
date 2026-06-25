import { useTranslation } from 'react-i18next'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PIE_COLORS } from '../utils'

interface GroupStat { fullName: string; posts: number }

interface PostsDistributionPieProps { data: GroupStat[] }

export function PostsDistributionPie({ data }: PostsDistributionPieProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t('feedAnalytics.charts.postsDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="posts"
              nameKey="fullName"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={72}
              paddingAngle={3}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={v => [v, 'Posts']}
            />
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: 10 }}
              formatter={value => value.length > 18 ? value.slice(0, 18) + '…' : value}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
