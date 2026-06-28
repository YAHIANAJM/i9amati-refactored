import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import {
  BarChart, Bar,
  RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  UserCheck, Share2, Building2, Clock, CheckCircle2,
  Mail, Calendar, Loader2, AlertCircle, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

// ─── Types ────────────────────────────────────────────────────────────────────

type Building        = { id: string; name: string; residence_name: string }
type PendingDelegate = {
  id: string; name: string; email: string; phone: string | null
  gender: 'male' | 'female'; building_id: string | null; building_name: string | null
  note: string | null; status: 'PENDING'; created_at: string
}
type ActiveDelegate  = {
  id: string; name: string; email: string; phone: string | null
  gender: null; building_id: string | null; building_name: string | null
  note: null; status: 'ACTIVE'
}
type PartnerSyndic   = {
  id: string; name: string; email: string; phone: string | null
  gender: 'male' | 'female'; residence: string; note: string | null; linked_at: string
}
type DelegatesData   = { pending: PendingDelegate[]; active: ActiveDelegate[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { credentials: 'include' })
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error ?? `HTTP ${r.status}`) }
  return r.json()
}

function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, accent, accentLight, accentIcon, loading }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string
  accent: string; accentLight: string; accentIcon: string; loading?: boolean
}) {
  return (
    <Card className="relative overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <div className={`absolute top-0 inset-x-0 h-[3px] ${accent}`} />
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accentLight}`}>
            <Icon size={22} className={accentIcon} strokeWidth={1.8} />
          </div>
        </div>
        {loading
          ? <div className="h-9 w-16 bg-muted animate-pulse rounded-lg" />
          : <p className="text-[1.9rem] font-black tabular-nums leading-none text-foreground tracking-tight">{value}</p>
        }
        {sub && <p className={cn('text-xs font-semibold mt-1.5 leading-tight opacity-80', accentIcon)}>{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function BarTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-2xl px-4 py-3 text-xs min-w-[140px]">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-bold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Building coverage status card ───────────────────────────────────────────

type CoverageStatus = 'active' | 'pending' | 'uncovered'

const STATUS_CFG: Record<CoverageStatus, { dot: string; bg: string; border: string; text: string }> = {
  active:    { dot: 'bg-emerald-500', bg: 'bg-emerald-50/60', border: 'border-emerald-100', text: 'text-emerald-700' },
  pending:   { dot: 'bg-amber-400',   bg: 'bg-amber-50/60',   border: 'border-amber-100',   text: 'text-amber-700'   },
  uncovered: { dot: 'bg-slate-300',   bg: 'bg-slate-50',      border: 'border-slate-100',   text: 'text-slate-500'   },
}

function BuildingStatusCard({ building, delegates, pendingDelegates }: {
  building: Building
  delegates: ActiveDelegate[]
  pendingDelegates: PendingDelegate[]
}) {
  const { t } = useTranslation()
  const activeHere  = delegates.filter(d => d.building_id === building.id)
  const pendingHere = pendingDelegates.filter(d => d.building_id === building.id)
  const status: CoverageStatus = activeHere.length > 0 ? 'active' : pendingHere.length > 0 ? 'pending' : 'uncovered'
  const cfg = STATUS_CFG[status]
  const statusLabel = t(`unionDash.coverage.${status}`)

  return (
    <div className={cn('p-4 rounded-xl border', cfg.bg, cfg.border)}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg, 'border', cfg.border)}>
            <Building2 size={14} className={cfg.text} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{building.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{building.residence_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
          <span className={cn('text-[10px] font-bold', cfg.text)}>{statusLabel}</span>
        </div>
      </div>

      {activeHere.length > 0 ? (
        <div className="space-y-1.5">
          {activeHere.map(d => (
            <div key={d.id} className="flex items-center gap-2">
              <UserCheck size={10} className="text-emerald-600 shrink-0" />
              <span className="text-[11px] font-semibold text-foreground truncate">{d.name}</span>
            </div>
          ))}
        </div>
      ) : pendingHere.length > 0 ? (
        <div className="space-y-1.5">
          {pendingHere.map(d => (
            <div key={d.id} className="flex items-center gap-2">
              <Clock size={10} className="text-amber-500 shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">{d.name}</span>
              <span className="ml-auto text-[10px] text-amber-600 font-bold shrink-0">{daysAgo(d.created_at)}d</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground/70 italic">{t('unionDash.coverage.noDelegate')}</p>
      )}
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
      <AlertCircle size={14} className="shrink-0" />
      {message}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function UnionDash() {
  const { t } = useTranslation()
  const buildingsQ = useQuery<Building[]>({
    queryKey: ['union-buildings'],
    queryFn: () => apiFetch<Building[]>('/api/union/buildings'),
  })
  const delegatesQ = useQuery<DelegatesData>({
    queryKey: ['union-delegates'],
    queryFn: () => apiFetch<DelegatesData>('/api/union/delegates'),
  })
  const partnersQ  = useQuery<PartnerSyndic[]>({
    queryKey: ['union-partners'],
    queryFn: () => apiFetch<PartnerSyndic[]>('/api/union/partners'),
  })

  const buildings = buildingsQ.data ?? []
  const active    = delegatesQ.data?.active  ?? []
  const pending   = delegatesQ.data?.pending ?? []
  const partners  = partnersQ.data ?? []
  const loading   = buildingsQ.isPending || delegatesQ.isPending || partnersQ.isPending

  // ── Derived analytics ──────────────────────────────────────────────────────
  const totalDelegates    = active.length + pending.length
  const coveredBuildingIds = new Set(active.map(d => d.building_id).filter(Boolean) as string[])
  const coveredCount      = coveredBuildingIds.size
  const coverageRate      = buildings.length > 0 ? Math.round(coveredCount / buildings.length * 100) : 0

  const tActive  = t('unionDash.charts.active')
  const tPending = t('unionDash.charts.pending')

  // Per-building bar data
  const buildingBarData = buildings.map(b => ({
    name: b.name.length > 10 ? b.name.slice(0, 10) + '…' : b.name,
    [tActive]:  active.filter(d => d.building_id === b.id).length,
    [tPending]: pending.filter(d => d.building_id === b.id).length,
  }))

  // Radial donut data
  const delegateDonut = [
    { name: tActive,  value: active.length,  fill: '#10b981' },
    { name: tPending, value: pending.length, fill: '#f59e0b' },
  ]

  const now = new Date()
  const monthLabel = now.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="flex-1 p-6 overflow-auto space-y-5">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
            {t('unionDash.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {t('unionDash.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold">
          <Calendar size={13} />
          <span>{monthLabel}</span>
        </div>
      </div>

      {/* ── Errors ───────────────────────────────────────────────────────── */}
      {buildingsQ.isError && <ErrorBanner message={t('unionDash.errors.buildings')} />}
      {delegatesQ.isError && <ErrorBanner message={t('unionDash.errors.delegates')} />}
      {partnersQ.isError  && <ErrorBanner message={t('unionDash.errors.partners')}  />}

      {/* ── 4 KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard loading={loading}
          icon={UserCheck} label={t('unionDash.kpi.activeDelegates')}
          value={active.length}
          sub={t('unionDash.kpi.totalInSystem', { count: totalDelegates })}
          accent="bg-emerald-500" accentLight="bg-emerald-50" accentIcon="text-emerald-500" />
        <KpiCard loading={loading}
          icon={Clock} label={t('unionDash.kpi.pendingInvites')}
          value={pending.length}
          sub={pending.length > 0 ? t('unionDash.kpi.awaitingResponse') : t('unionDash.kpi.allResponded')}
          accent="bg-amber-400" accentLight="bg-amber-50" accentIcon="text-amber-500" />
        <KpiCard loading={loading}
          icon={Building2} label={t('unionDash.kpi.buildingCoverage')}
          value={`${coverageRate}%`}
          sub={t('unionDash.kpi.buildingsCovered', { covered: coveredCount, total: buildings.length })}
          accent="bg-blue-500" accentLight="bg-blue-50" accentIcon="text-blue-500" />
        <KpiCard loading={loading}
          icon={Share2} label={t('unionDash.kpi.partnerSyndics')}
          value={partners.length}
          sub={partners.length > 0 ? t('unionDash.kpi.network', { count: partners.length }) : t('unionDash.kpi.noPartners')}
          accent="bg-violet-500" accentLight="bg-violet-50" accentIcon="text-violet-500" />
      </div>

      {/* ── Row 1: Bar chart (2/3) + Delegate donut (1/3) ───────────────── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Delegates per building — stacked bar */}
        <Card className="col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('unionDash.charts.delegatesPerBuilding')}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Active and pending assignment per building
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />{t('unionDash.charts.active')}</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />{t('unionDash.charts.pending')}</span>
              </div>
            </div>

            {loading ? (
              <div className="h-[240px] flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : buildings.length === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Building2 size={32} className="text-slate-300" />
                <p className="text-sm font-semibold">No buildings registered</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={buildingBarData} barSize={48}
                  margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey={tActive}  stackId="a" fill="#10b981" fillOpacity={0.9} radius={[0, 0, 0, 0]} name={tActive} />
                  <Bar dataKey={tPending} stackId="a" fill="#f59e0b" fillOpacity={0.9} radius={[4, 4, 0, 0]} name={tPending} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Delegate status — radial breakdown */}
        <Card>
          <CardContent className="p-5 flex flex-col">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">{t('unionDash.charts.delegateStatus')}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Breakdown · {totalDelegates} total
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="28%" outerRadius="92%"
                    data={delegateDonut}
                    startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={5} background={{ fill: '#f8fafc' }} />
                    <Tooltip
                      formatter={(v: number) => [v]}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {loading
                    ? <Loader2 size={18} className="animate-spin text-muted-foreground" />
                    : <>
                        <p className="text-2xl font-black text-foreground">{active.length}</p>
                        <p className="text-[10px] text-muted-foreground">{tActive}</p>
                      </>
                  }
                </div>
              </div>

              <div className="w-full flex flex-col gap-3">
                {[
                  { label: tActive,  count: active.length,  color: '#10b981' },
                  { label: tPending, count: pending.length, color: '#f59e0b' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.color }} />
                        <span className="text-xs text-muted-foreground">{r.label}</span>
                      </div>
                      <span className="text-sm font-black" style={{ color: r.color }}>{r.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: totalDelegates > 0 ? `${Math.round(r.count / totalDelegates * 100)}%` : '0%', background: r.color }} />
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0 bg-blue-500" />
                      <span className="text-xs text-muted-foreground">Coverage</span>
                    </div>
                    <span className="text-sm font-black text-blue-500">{coverageRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${coverageRate}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Building coverage cards grid ──────────────────────────── */}
      {(buildings.length > 0 || loading) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('unionDash.charts.buildingCoverage')}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Delegate assignment status per building
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {(Object.keys(STATUS_CFG) as CoverageStatus[]).map(k => (
                  <span key={k} className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', STATUS_CFG[k].dot)} />
                    {t(`unionDash.coverage.${k}`)}
                  </span>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {buildings.map(b => (
                  <BuildingStatusCard
                    key={b.id}
                    building={b}
                    delegates={active}
                    pendingDelegates={pending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Row 3: Pending invitations + Partner syndics ─────────────────── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Pending invitations */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('unionDash.sections.pendingInvites')}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Delegates awaiting response
                </p>
              </div>
              {pending.length > 0 && (
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                  {pending.length} waiting
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[1, 2].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : pending.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <CheckCircle2 size={32} className="text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-600">All invitations accepted</p>
                <p className="text-xs text-muted-foreground">No pending delegates</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pending.map(d => {
                  const days = daysAgo(d.created_at)
                  const urgent = days >= 5
                  return (
                    <div key={d.id} className={cn(
                      'flex items-center justify-between p-3 rounded-xl border',
                      urgent ? 'bg-red-50/60 border-red-100' : 'bg-amber-50/60 border-amber-100',
                    )}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                          urgent ? 'bg-red-100' : 'bg-amber-100')}>
                          <Clock size={14} className={urgent ? 'text-red-500' : 'text-amber-600'} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 size={9} className="shrink-0" />
                            <span className="truncate">{d.building_name ?? 'No building'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className={cn('text-[10px] font-bold', urgent ? 'text-red-500' : 'text-amber-600')}>
                          {days === 0 ? 'Today' : `${days}d ago`}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[90px]">{d.email}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Partner syndics */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('unionDash.sections.partners')}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Linked syndics · {partners.length} partner{partners.length !== 1 ? 's' : ''}
                </p>
              </div>
              {partners.length > 0 && (
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-violet-100 text-violet-700">
                  {partners.length} linked
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[1, 2].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : partners.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <Share2 size={32} className="text-slate-300" />
                <p className="text-sm font-semibold text-muted-foreground">No partner syndics</p>
                <p className="text-xs text-muted-foreground/70">Link partners from Union Members page</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {partners.map(ps => (
                  <div key={ps.id} className="flex items-center justify-between p-3 rounded-xl bg-violet-50/60 border border-violet-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Share2 size={14} className="text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{ps.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{ps.residence}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-[10px] font-bold text-violet-600">
                        {daysAgo(ps.linked_at) === 0 ? 'Today' : `${daysAgo(ps.linked_at)}d ago`}
                      </p>
                      <a href={`mailto:${ps.email}`}
                        className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 justify-end transition-colors">
                        <Mail size={8} />
                        <span className="truncate max-w-[90px]">{ps.email}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Active delegates grid ─────────────────────────────────── */}
      {(active.length > 0 || loading) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('unionDash.sections.activeDelegates')}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Confirmed right-hand delegates
                </p>
              </div>
              {active.length > 0 && (
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  {active.length} active
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {active.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <UserCheck size={16} className="text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <Building2 size={9} className="shrink-0" />
                        <span className="truncate">{d.building_name ?? '—'}</span>
                      </p>
                    </div>
                    <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
