import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { feedApi } from '@/lib/feed.api'
import { defineFeedAbility, ProfileRole } from '@i9amati/shared'
import { MessageCircle, Heart, Users, FileText, TrendingUp, Award } from 'lucide-react'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

export function FeedDash() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['feed-analytics'],
    queryFn:  feedApi.getAnalytics,
  })

  // Derive ability from the response so the permission check is always in sync
  // with the CASL rules defined in @i9amati/shared.
  const ability = useMemo(() => {
    if (!data) return null
    return defineFeedAbility(data.profileRole as ProfileRole, '', [])
  }, [data])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Feed Analytics" subtitle="Engagement et activité communautaire" />
        <div className="flex-1 p-6 grid grid-cols-5 gap-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 h-20 bg-slate-100 rounded-lg" /></Card>
          ))}
        </div>
      </div>
    )
  }

  // ── Permission / error ─────────────────────────────────────────────────────
  if (isError || (data && ability && ability.cannot('read', 'FeedAnalytics'))) {
    const is403 = (error as any)?.error?.status === 403 ||
                  (data && ability?.cannot('read', 'FeedAnalytics'))
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Feed Analytics" subtitle="Engagement et activité communautaire" />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-sm font-medium text-foreground">
                {is403 ? 'Accès réservé au syndic' : 'Erreur de chargement'}
              </p>
              <p className="text-xs text-muted-foreground">
                {is403
                  ? 'Les statistiques du feed sont uniquement accessibles au syndic.'
                  : 'Impossible de charger les données. Réessayez plus tard.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!data) return null

  // ── Derived chart data from real API response ──────────────────────────────

  const { summary, groupStats: rawGroups, timeline: rawTimeline, topPosts, topMembers } = data

  const avgEngagement = summary.totalPosts > 0
    ? Math.round((summary.totalLikes + summary.totalComments) / summary.totalPosts)
    : 0

  const groupStats = rawGroups.map(g => ({
    name:     g.name.length > 16 ? g.name.slice(0, 16) + '…' : g.name,
    fullName: g.name,
    posts:    g.postCount,
    likes:    g.likeCount,
    comments: g.commentCount,
    members:  g.memberCount,
  }))

  // timeline: API returns 'YYYY-MM-DD', charts need 'MM-DD'
  const timelineData = rawTimeline.map(r => ({
    date:  r.date.slice(5),
    count: r.count,
  }))

  const kpis = [
    { icon: FileText,    label: 'Publications',     value: summary.totalPosts,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { icon: Heart,       label: 'Total Likes',       value: summary.totalLikes,    color: 'text-red-500',    bg: 'bg-red-50'    },
    { icon: MessageCircle, label: 'Commentaires',    value: summary.totalComments, color: 'text-violet-600', bg: 'bg-violet-50' },
    { icon: Users,       label: 'Membres',           value: summary.totalMembers,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: TrendingUp,  label: 'Engagement moyen',  value: avgEngagement,         color: 'text-amber-600',  bg: 'bg-amber-50'  },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
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
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="posts"    fill="#3b82f6" name="Posts"        radius={[3, 3, 0, 0]} />
                  <Bar dataKey="likes"    fill="#ef4444" name="Likes"        radius={[3, 3, 0, 0]} />
                  <Bar dataKey="comments" fill="#8b5cf6" name="Commentaires" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Activité dans le temps (30 jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(v) => [v, 'Publications']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#timelineGradient)"
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 5 }}
                  />
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
              {topPosts.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucune publication pour l'instant.</p>
              )}
              {topPosts.map((post, i) => (
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
              ))}
            </CardContent>
          </Card>

          {/* Most active members */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Membres les plus actifs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {topMembers.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucune activité pour l'instant.</p>
              )}
              {topMembers.map((m, i) => {
                const total    = m.postCount + m.commentCount
                const maxTotal = topMembers[0] ? topMembers[0].postCount + topMembers[0].commentCount : 1
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
              })}
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
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(v) => [v, 'Posts']}
                  />
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
