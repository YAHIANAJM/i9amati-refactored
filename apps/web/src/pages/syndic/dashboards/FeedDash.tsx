import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { mockFeedPosts, mockGroups, mockUsers, mockGroupMembers } from '@/data/mock/feed'
import { MessageCircle, Heart, Users, FileText, TrendingUp, Award } from 'lucide-react'

// ── Derived analytics ────────────────────────────────────────────────────────

const totalPosts = mockFeedPosts.length
const totalLikes = mockFeedPosts.reduce((s, p) => s + p.likes, 0)
const totalComments = mockFeedPosts.reduce((s, p) => s + p.comments.length, 0)
const totalMembers = mockUsers.length
const avgEngagement = Math.round((totalLikes + totalComments) / totalPosts)

// Posts + engagement per group
const groupStats = mockGroups.map(g => {
  const posts = mockFeedPosts.filter(p => p.groupId === g.id)
  return {
    name: g.name.length > 16 ? g.name.slice(0, 16) + '…' : g.name,
    fullName: g.name,
    posts: posts.length,
    likes: posts.reduce((s, p) => s + p.likes, 0),
    comments: posts.reduce((s, p) => s + p.comments.length, 0),
    members: mockGroupMembers[g.id]?.length ?? g.memberCount,
  }
})

// Activity timeline (posts per day)
const dayMap: Record<string, number> = {}
mockFeedPosts.forEach(p => {
  const day = p.createdAt.slice(0, 10)
  dayMap[day] = (dayMap[day] ?? 0) + 1
})
const timelineData = Object.entries(dayMap)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([date, count]) => ({ date: date.slice(5), count })) // "MM-DD"

// Top 5 posts by likes
const topPosts = [...mockFeedPosts]
  .sort((a, b) => b.likes - a.likes)
  .slice(0, 5)

// Most active members (posts + comments authored)
const activityMap: Record<string, { posts: number; comments: number }> = {}
mockFeedPosts.forEach(p => {
  if (!activityMap[p.authorName]) activityMap[p.authorName] = { posts: 0, comments: 0 }
  activityMap[p.authorName].posts++
  p.comments.forEach(c => {
    if (!activityMap[c.authorName]) activityMap[c.authorName] = { posts: 0, comments: 0 }
    activityMap[c.authorName].comments++
  })
})
const topMembers = Object.entries(activityMap)
  .map(([name, a]) => ({ name, total: a.posts + a.comments, posts: a.posts, comments: a.comments }))
  .sort((a, b) => b.total - a.total)
  .slice(0, 6)

// Pie: posts share per group
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const kpis = [
  { icon: FileText, label: 'Publications', value: totalPosts, color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Heart, label: 'Total Likes', value: totalLikes, color: 'text-red-500', bg: 'bg-red-50' },
  { icon: MessageCircle, label: 'Commentaires', value: totalComments, color: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: Users, label: 'Membres', value: totalMembers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: TrendingUp, label: 'Engagement moyen', value: avgEngagement, color: 'text-amber-600', bg: 'bg-amber-50' },
]

export function FeedDash() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Feed Analytics" subtitle="Engagement et activité communautaire" />
      <div className="flex-1 p-6 space-y-6 animate-fade-in">

        {/* KPI row */}
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

        {/* Row 2: group bar + timeline */}
        <div className="grid grid-cols-2 gap-4">

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Activité par groupe</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={groupStats} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="posts" fill="#3b82f6" name="Posts" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="likes" fill="#ef4444" name="Likes" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="comments" fill="#8b5cf6" name="Commentaires" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Activité dans le temps</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [v, 'Publications']} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#timelineGradient)" dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: top posts + top members + pie */}
        <div className="grid grid-cols-3 gap-4">

          {/* Top posts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Award size={14} className="text-amber-500" /> Top publications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPosts.map((post, i) => (
                <div key={post.id} className="flex items-start gap-3">
                  <span className={`text-xs font-bold w-4 shrink-0 mt-0.5 ${i === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug line-clamp-2 text-foreground">{post.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{post.authorName}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Heart size={11} className="text-red-400" />
                    <span className="text-xs font-medium text-red-500">{post.likes}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Most active members */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Membres les plus actifs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {topMembers.map((m, i) => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{m.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* progress bar */}
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${Math.round((m.total / topMembers[0].total) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{m.total}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 text-[10px] text-muted-foreground shrink-0">
                    <span className="text-blue-500">{m.posts}p</span>
                    <span className="text-violet-500">{m.comments}c</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Share of posts per group (pie) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Répartition des posts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={groupStats}
                    dataKey="posts"
                    nameKey="fullName"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {groupStats.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [v, 'Posts']} />
                  <Legend
                    iconSize={8}
                    wrapperStyle={{ fontSize: 10 }}
                    formatter={(value) => value.length > 18 ? value.slice(0, 18) + '…' : value}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
