import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import { api } from '@/lib/api'
import { type Meeting } from '@/data/mock/meetings'
import { formatDate, cn } from '@/lib/utils'
import { CalendarDays, Users, Vote, TrendingUp, CheckCircle2, Mail } from 'lucide-react'

// ── data fetching ──────────────────────────────────────────────────────────────

function useMeetings() {
  return useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn:  () => api.get<Meeting[]>('/api/meetings'),
    staleTime: 30_000,
  })
}

// ── derived analytics ──────────────────────────────────────────────────────────

function derive(meetings: Meeting[]) {
  const held     = meetings.filter(m => m.status === 'COMPLETED' || m.status === 'IN_PROGRESS')
  const completed = meetings.filter(m => m.status === 'COMPLETED')

  // All agenda items across all meetings
  const allItems = meetings.flatMap(m => m.agenda)
  const closedItems = allItems.filter(a => a.voteStatus === 'CLOSED' && a.result)
  const adopted  = closedItems.filter(a => a.result === 'ADOPTED').length
  const rejected = closedItems.filter(a => a.result === 'REJECTED').length

  // Active votes
  const activeVotes = meetings.flatMap(m =>
    m.agenda.filter(a => a.voteStatus === 'OPEN' || a.voteStatus === 'CLOSED').map(a => ({ ...a, meetingTitle: m.title }))
  )

  // Average quorum across held meetings
  const quorumPcts = held.map(m => {
    const present = m.attendeeList.filter(a => a.present).length
    return m.totalEligible > 0 ? (present / m.totalEligible) * 100 : 0
  })
  const avgQuorum = quorumPcts.length ? Math.round(quorumPcts.reduce((a, b) => a + b, 0) / quorumPcts.length) : 0

  // Adoption rate
  const totalResolutions = adopted + rejected
  const adoptionRate = totalResolutions > 0 ? Math.round((adopted / totalResolutions) * 100) : 0

  // Convocations sent
  const convocSent = meetings.filter(m => m.convocationSentAt).length

  // Status pie
  const statusPie = [
    { name: 'Planifiée',  value: meetings.filter(m => m.status === 'SCHEDULED').length,   color: '#3b82f6' },
    { name: 'En cours',   value: meetings.filter(m => m.status === 'IN_PROGRESS').length,  color: '#f59e0b' },
    { name: 'Terminée',   value: completed.length,                                          color: '#22c55e' },
    { name: 'Annulée',   value: meetings.filter(m => m.status === 'CANCELLED').length,     color: '#94a3b8' },
  ].filter(s => s.value > 0)

  // Adoption donut
  const adoptionPie = [
    { name: 'Adopté',  value: adopted,   color: '#22c55e' },
    { name: 'Rejeté', value: rejected,   color: '#ef4444' },
  ].filter(s => s.value > 0)

  // Meeting frequency — last 6 months
  const now   = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('fr-MA', { month: 'short' }),
      count: 0,
    }
  })
  meetings.forEach(m => {
    const d   = new Date(m.scheduledAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const bucket = months.find(b => b.key === key)
    if (bucket) bucket.count++
  })

  // RSVP engagement — per meeting (last 5 held or scheduled)
  const rsvpData = meetings
    .slice()
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 5)
    .map(m => ({
      name:     m.title.length > 22 ? m.title.slice(0, 22) + '…' : m.title,
      Accepté:  m.attendeeList.filter(a => a.rsvp === 'ACCEPTED').length,
      Décliné:  m.attendeeList.filter(a => a.rsvp === 'DECLINED').length,
      'En attente': m.attendeeList.filter(a => a.rsvp === 'PENDING').length,
    }))
    .reverse()

  // Quorum rows
  const quorumRows = held
    .map(m => {
      const present = m.attendeeList.filter(a => a.present).length
      const pct     = m.totalEligible > 0 ? Math.round((present / m.totalEligible) * 100) : 0
      const reached = m.convocationNumber === 2 || pct >= 50
      return { id: m.id, title: m.title, date: m.scheduledAt, present, total: m.totalEligible, pct, reached, conv: m.convocationNumber }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Resolutions timeline
  const resolutions = meetings
    .slice()
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .flatMap(m =>
      m.agenda
        .filter(a => a.voteStatus === 'CLOSED' && a.result)
        .map(a => ({
          title:   a.title,
          meeting: m.title,
          date:    m.scheduledAt,
          result:  a.result!,
          pour:    a.pour,
          contre:  a.contre,
          total:   a.pour + a.contre + a.abstention,
        }))
    )

  return { activeVotes, avgQuorum, adoptionRate, convocSent, statusPie, adoptionPie, months, rsvpData, quorumRows, resolutions, adopted, rejected }
}

// ── skeleton ───────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} />
}

// ── component ──────────────────────────────────────────────────────────────────

export function MeetingsDash() {
  const { t } = useTranslation()
  const { data: meetings = [], isLoading } = useMeetings()
  const d = useMemo(() => derive(meetings), [meetings])

  const kpis = [
    { label: t('meetingsDash.kpi.total'),       value: isLoading ? '—' : meetings.length,                                             icon: CalendarDays, color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: t('meetingsDash.kpi.scheduled'),   value: isLoading ? '—' : meetings.filter(m => m.status === 'SCHEDULED').length,       icon: CalendarDays, color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: t('meetingsDash.kpi.activeVotes'), value: isLoading ? '—' : d.activeVotes.filter(v => v.voteStatus === 'OPEN').length,   icon: Vote,         color: 'text-purple-600',  bg: 'bg-purple-50' },
    { label: t('meetingsDash.kpi.avgQuorum'),   value: isLoading ? '—' : `${d.avgQuorum}%`,                                          icon: Users,        color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('meetingsDash.kpi.adoptionRate'),value: isLoading ? '—' : `${d.adoptionRate}%`,                                       icon: TrendingUp,   color: 'text-green-600',   bg: 'bg-green-50' },
    { label: t('meetingsDash.kpi.convocations'),value: isLoading ? '—' : d.convocSent,                                               icon: Mail,         color: 'text-sky-600',     bg: 'bg-sky-50' },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={t('meetingsDash.title')} subtitle={t('meetingsDash.subtitle')} />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* ── KPI row ── */}
        <div className="grid grid-cols-6 gap-3">
          {kpis.map(k => (
            <Card key={k.label}>
              <CardContent className="p-4 flex flex-col gap-2">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', k.bg)}>
                  <k.icon size={15} className={k.color} />
                </div>
                {isLoading
                  ? <Skeleton className="h-7 w-12" />
                  : <p className={cn('text-xl font-bold', k.color)}>{k.value}</p>
                }
                <p className="text-[11px] text-muted-foreground leading-tight">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Frequency bar + Status pie ── */}
        <div className="grid grid-cols-3 gap-5">
          <Card className="col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('meetingsDash.charts.frequency')}</CardTitle></CardHeader>
            <CardContent>
              {isLoading
                ? <Skeleton className="h-44 w-full" />
                : (
                  <ResponsiveContainer width="100%" height={176}>
                    <BarChart data={d.months} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="count" name={t('meetingsDash.charts.meetings')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('meetingsDash.charts.statuses')}</CardTitle></CardHeader>
            <CardContent>
              {isLoading
                ? <Skeleton className="h-44 w-full" />
                : (
                  <ResponsiveContainer width="100%" height={176}>
                    <PieChart>
                      <Pie data={d.statusPie} cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={3} dataKey="value">
                        {d.statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )
              }
            </CardContent>
          </Card>
        </div>

        {/* ── RSVP engagement + Adoption donut ── */}
        <div className="grid grid-cols-3 gap-5">
          <Card className="col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('meetingsDash.charts.rsvp')}</CardTitle></CardHeader>
            <CardContent>
              {isLoading
                ? <Skeleton className="h-44 w-full" />
                : d.rsvpData.length === 0
                  ? <p className="text-xs text-muted-foreground text-center py-14">{t('meetingsDash.noData')}</p>
                  : (
                    <ResponsiveContainer width="100%" height={176}>
                      <BarChart data={d.rsvpData} layout="vertical" barSize={10}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Accepté"     fill="#22c55e" radius={[0, 4, 4, 0]} stackId="a" />
                        <Bar dataKey="Décliné"     fill="#ef4444" radius={[0, 0, 0, 0]} stackId="a" />
                        <Bar dataKey="En attente"  fill="#94a3b8" radius={[0, 4, 4, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('meetingsDash.charts.adoption')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading
                ? <Skeleton className="h-44 w-full" />
                : d.adoptionPie.length === 0
                  ? <p className="text-xs text-muted-foreground text-center py-14">Aucun vote clôturé</p>
                  : (
                    <>
                      <ResponsiveContainer width="100%" height={130}>
                        <PieChart>
                          <Pie data={d.adoptionPie} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value">
                            {d.adoptionPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-1">
                        <div className="text-center">
                          <p className="text-lg font-bold text-emerald-600">{d.adopted}</p>
                          <p className="text-[10px] text-muted-foreground">{t('meetingsDash.charts.adopted')}</p>
                        </div>
                        <div className="w-px bg-border" />
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-500">{d.rejected}</p>
                          <p className="text-[10px] text-muted-foreground">{t('meetingsDash.charts.rejected')}</p>
                        </div>
                      </div>
                    </>
                  )
              }
            </CardContent>
          </Card>
        </div>

        {/* ── Vote cards ── */}
        {(isLoading || d.activeVotes.length > 0) && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('meetingsDash.sections.activeVotes')}</CardTitle></CardHeader>
            <CardContent>
              {isLoading
                ? <div className="grid grid-cols-3 gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
                : (
                  <div className="grid grid-cols-3 gap-3">
                    {d.activeVotes.map(v => {
                      const total = v.pour + v.contre + v.abstention || 1
                      return (
                        <div key={v.id} className="p-3 rounded-lg border">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-medium leading-snug">{v.title}</p>
                            <Badge variant={v.voteStatus === 'OPEN' ? 'info' : 'secondary'} className="text-[10px] ml-2 shrink-0">
                              {v.voteStatus === 'OPEN' ? t('meetings.open') : t('meetings.closed')}
                            </Badge>
                          </div>
                          <div className="flex gap-3 text-[11px]">
                            <span className="text-emerald-600 font-semibold">✓ {v.pour} ({Math.round(v.pour / total * 100)}%)</span>
                            <span className="text-red-500 font-semibold">✗ {v.contre} ({Math.round(v.contre / total * 100)}%)</span>
                            <span className="text-muted-foreground">— {v.abstention}</span>
                          </div>
                          <div className="flex h-1.5 rounded-full overflow-hidden mt-2 bg-muted">
                            <div className="bg-emerald-500 h-full" style={{ width: `${v.pour   / total * 100}%` }} />
                            <div className="bg-red-400 h-full"    style={{ width: `${v.contre / total * 100}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }
            </CardContent>
          </Card>
        )}

        {/* ── Quorum list + Resolutions timeline ── */}
        <div className="grid grid-cols-2 gap-5">

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('meetingsDash.sections.quorum')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {isLoading
                ? <><Skeleton className="h-14" /><Skeleton className="h-14" /></>
                : d.quorumRows.length === 0
                  ? <p className="text-xs text-muted-foreground text-center py-6">{t('meetingsDash.noData')}</p>
                  : d.quorumRows.map(r => (
                      <div key={r.id} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{r.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatDate(r.date)} · {r.present}/{r.total} présents
                            </p>
                            <div className="flex h-1.5 rounded-full overflow-hidden mt-2 bg-muted">
                              <div
                                className={cn('h-full transition-all', r.reached ? 'bg-emerald-500' : 'bg-red-400')}
                                style={{ width: `${r.pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={cn('text-sm font-bold', r.reached ? 'text-emerald-600' : 'text-red-500')}>
                              {r.pct}%
                            </span>
                            <Badge
                              variant={r.conv === 2 ? 'warning' : r.reached ? 'success' : 'destructive'}
                              className="text-[10px]"
                            >
                              {r.conv === 2 ? '2ème conv.' : r.reached ? `${t('meetingsDash.quorum.reached')} ✓` : t('meetingsDash.quorum.notReached')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('meetingsDash.sections.resolutions')}</CardTitle></CardHeader>
            <CardContent>
              {isLoading
                ? <><Skeleton className="h-14 mb-3" /><Skeleton className="h-14 mb-3" /><Skeleton className="h-14" /></>
                : d.resolutions.length === 0
                  ? <p className="text-xs text-muted-foreground text-center py-6">{t('meetingsDash.noData')}</p>
                  : (
                    <div className="relative pl-5">
                      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
                      <div className="space-y-4">
                        {d.resolutions.map((r, i) => {
                          const total     = r.total || 1
                          const pourPct   = Math.round(r.pour   / total * 100)
                          const contrePct = Math.round(r.contre / total * 100)
                          return (
                            <div key={i} className="relative">
                              <div className={cn(
                                'absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-background',
                                r.result === 'ADOPTED' ? 'bg-emerald-500' : 'bg-red-400'
                              )} />
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium leading-snug">{r.title}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {r.meeting} · {formatDate(r.date)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex h-1 rounded-full overflow-hidden flex-1 bg-muted">
                                      <div className="bg-emerald-500 h-full" style={{ width: `${pourPct}%` }} />
                                      <div className="bg-red-400 h-full"     style={{ width: `${contrePct}%` }} />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{pourPct}% pour</span>
                                  </div>
                                </div>
                                <Badge
                                  variant={r.result === 'ADOPTED' ? 'success' : 'destructive'}
                                  className="text-[10px] shrink-0 mt-0.5"
                                >
                                  {r.result === 'ADOPTED' ? `${t('meetingsDash.charts.adopted')} ✓` : `${t('meetingsDash.charts.rejected')} ✗`}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
              }
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
