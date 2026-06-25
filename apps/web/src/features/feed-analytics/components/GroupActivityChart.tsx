import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GroupStat {
  name:     string
  posts:    number
  likes:    number
  comments: number
}

interface GroupActivityChartProps {
  data: GroupStat[]
}

export function GroupActivityChart({ data }: GroupActivityChartProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t('feedAnalytics.charts.activityByGroup')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barSize={12}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="posts"    fill="#3b82f6" name="Posts"        radius={[3, 3, 0, 0]} />
            <Bar dataKey="likes"    fill="#ef4444" name="Likes"        radius={[3, 3, 0, 0]} />
            <Bar dataKey="comments" fill="#8b5cf6" name="Commentaires" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
