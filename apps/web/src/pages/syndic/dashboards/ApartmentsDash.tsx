import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  AreaChart, Area,
  ComposedChart, Bar, Line,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { Building2, Home, Users, MapPin, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockApartments } from '@/data/mock/apartments'
import { mockOwners }     from '@/data/mock/owners'
import { mockBuildings }  from '@/data/mock/buildings'
import { mockResidences } from '@/data/mock/residences'

/* ── types ─────────────────────────────────────────────────── */
type Period = '7D' | '1M' | '3M' | '1Y'

/* ── static derived ──────────────────────────────────────────*/
const totalRes  = mockResidences.length   // 3
const totalBld  = mockBuildings.length    // 5
const totalApt  = mockApartments.length   // 9
const totalOwn  = mockOwners.length       // 9

const occupied    = mockApartments.filter(a => a.status === 'OCCUPIED').length
const vacant      = mockApartments.filter(a => a.status === 'VACANT').length
const maintenance = mockApartments.filter(a => a.status === 'MAINTENANCE').length
const withOwner   = mockApartments.filter(a => mockOwners.some(o => o.apartmentId === a.id)).length
const avgArea     = Math.round(mockApartments.reduce((s, a) => s + (a.areaSqm ?? 0), 0) / totalApt)

/* ── growth timeline (12 months, cumulative) ─────────────────*/
const FULL_TIMELINE = [
  { month: 'Jun 25', residences: 1, buildings: 2, apartments: 3, owners: 2 },
  { month: 'Jul 25', residences: 1, buildings: 2, apartments: 4, owners: 3 },
  { month: 'Aug 25', residences: 2, buildings: 3, apartments: 5, owners: 4 },
  { month: 'Sep 25', residences: 2, buildings: 3, apartments: 6, owners: 5 },
  { month: 'Oct 25', residences: 2, buildings: 4, apartments: 6, owners: 6 },
  { month: 'Nov 25', residences: 2, buildings: 4, apartments: 7, owners: 6 },
  { month: 'Dec 25', residences: 2, buildings: 4, apartments: 7, owners: 7 },
  { month: 'Jan 26', residences: 2, buildings: 4, apartments: 8, owners: 7 },
  { month: 'Feb 26', residences: 3, buildings: 5, apartments: 8, owners: 8 },
  { month: 'Mar 26', residences: 3, buildings: 5, apartments: 9, owners: 8 },
  { month: 'Apr 26', residences: 3, buildings: 5, apartments: 9, owners: 9 },
  { month: 'May 26', residences: 3, buildings: 5, apartments: 9, owners: 9 },
  { month: 'Jun 26', residences: 3, buildings: 5, apartments: 9, owners: 9 },
]

const PERIOD_SLICE: Record<Period, number> = { '7D': 4, '1M': 6, '3M': 8, '1Y': 13 }

/* ── monthly additions (delta) ───────────────────────────────*/
const ADDITIONS = FULL_TIMELINE.slice(1).map((d, i) => ({
  month:      d.month,
  Apartments: d.apartments - FULL_TIMELINE[i].apartments,
  Owners:     d.owners     - FULL_TIMELINE[i].owners,
  Buildings:  d.buildings  - FULL_TIMELINE[i].buildings,
}))

/* ── merged: monthly additions (bars) + cumulative (line) ────*/
const COMBINED_MONTHLY = FULL_TIMELINE.slice(1).map((d, i) => ({
  month:      d.month,
  Apartments: d.apartments - FULL_TIMELINE[i].apartments,
  Owners:     d.owners     - FULL_TIMELINE[i].owners,
  Buildings:  d.buildings  - FULL_TIMELINE[i].buildings,
  Total:      d.apartments,
}))

/* ── portfolio health rings (radial) ─────────────────────────*/
const HEALTH_RINGS = [
  { name: 'Residential Share', value: Math.round(mockApartments.filter(a => a.usageType === 'RESIDENTIAL').length / mockApartments.length * 100), fill: '#3b82f6' },
  { name: 'Ownership Coverage', value: 0, fill: '#8b5cf6' },   // filled dynamically
  { name: 'Occupancy Rate',    value: 0, fill: '#22c55e' },   // filled dynamically
]

/* ── status donut ────────────────────────────────────────────*/
const STATUS_PIE = [
  { name: 'Occupied',    value: occupied,    color: '#22c55e' },
  { name: 'Vacant',      value: vacant,      color: '#94a3b8' },
  { name: 'Maintenance', value: maintenance, color: '#f59e0b' },
]

/* ── area scatter: each apt as a dot (floor × area m²) ──────*/
const BUCKET_COLOR = (area: number) =>
  area <= 75 ? '#3b82f6' : area <= 90 ? '#8b5cf6' : '#22c55e'
const BUCKET_LABEL = (area: number) =>
  area <= 75 ? '60–75 m²' : area <= 90 ? '75–90 m²' : '90–110 m²'

const JITTER = [-0.13, 0.13, -0.06, 0.06, 0]
const scatterDots = mockApartments.map((a, i) => {
  const sameFloor = mockApartments.filter(x => x.floor === a.floor)
  const pos = sameFloor.indexOf(a)
  return {
    x:    (a.floor ?? 1) + (JITTER[pos] ?? 0),
    y:    a.areaSqm ?? 0,
    fill: BUCKET_COLOR(a.areaSqm ?? 0),
    unit: a.unitCode,
    bucket: BUCKET_LABEL(a.areaSqm ?? 0),
  }
})


/* ── apartments per building (stacked) ───────────────────────*/
const BUILDING_BARS = mockBuildings
  .map(b => {
    const apts = mockApartments.filter(a => a.buildingId === b.id)
    return {
      name:        b.name,
      Occupied:    apts.filter(a => a.status === 'OCCUPIED').length,
      Vacant:      apts.filter(a => a.status === 'VACANT').length,
      Maintenance: apts.filter(a => a.status === 'MAINTENANCE').length,
      total:       apts.length,
    }
  })
  .filter(b => b.total > 0)

/* ── helpers ─────────────────────────────────────────────────*/
function pct(a: number, b: number) { return b === 0 ? 0 : Math.round((a - b) / b * 100) }

const PREV = FULL_TIMELINE[FULL_TIMELINE.length - 3] // 2 months ago
const GROWTH = {
  residences: pct(totalRes, PREV.residences),
  buildings:  pct(totalBld, PREV.buildings),
  apartments: pct(totalApt, PREV.apartments),
  owners:     pct(totalOwn, PREV.owners),
}

/* ── custom tooltips ─────────────────────────────────────────*/
function GrowthTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-2xl px-4 py-3 text-xs min-w-[140px]">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground capitalize">{p.dataKey}</span>
          </div>
          <span className="font-bold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function SimpleTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl border border-border/50 shadow-xl px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-bold ml-auto pl-3 text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── KPI card with trend ──────────────────────────────────────*/
function KpiCard({ icon: Icon, label, value, change, accent, accentLight, accentIcon, sub }: {
  icon: React.ElementType; label: string; value: number; change: number
  accent: string; accentLight: string; accentIcon: string; sub?: string
}) {
  const positive = change >= 0
  return (
    <Card className="relative overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-shadow">
      {/* thin top accent bar */}
      <div className={`absolute top-0 inset-x-0 h-[3px] ${accent}`} />
      <CardContent className="pt-5 pb-4 px-5">
        {/* top row: label + icon */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accentLight}`}>
            <Icon size={22} className={accentIcon} strokeWidth={1.8} />
          </div>
        </div>

        {/* big number */}
        <p className="text-[2.6rem] font-black tabular-nums leading-none text-foreground tracking-tight">
          {value}
        </p>

        {sub && <p className={`text-xs font-semibold mt-1.5 leading-tight ${accentIcon}`}>{sub}</p>}

        {/* bottom: change vs period */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
          <span className={cn(
            'flex items-center gap-0.5 text-[11px] font-bold',
            positive ? 'text-emerald-500' : 'text-red-500'
          )}>
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change)}%
          </span>
          <span className="text-[10px] text-muted-foreground">vs last period</span>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Page ─────────────────────────────────────────────────────*/
export function ApartmentsDash() {
  const [period, setPeriod] = useState<Period>('1Y')

  const timelineData = FULL_TIMELINE.slice(-PERIOD_SLICE[period])

  return (
    <div className="flex-1 p-6 overflow-auto space-y-5">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
            Owners' Association
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Portfolio Analytics · June 14, 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period tabs */}
          <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5">
            {(['7D', '1M', '3M', '1Y'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  period === p
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Current month badge */}
          <div className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold">
            <Calendar size={13} />
            <span>June, 2026</span>
          </div>
        </div>
      </div>

      {/* ── 4 KPI CARDS WITH TRENDS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={MapPin}    label="Residences"  value={totalRes} change={GROWTH.residences} accent="bg-blue-500"    accentLight="bg-blue-50"    accentIcon="text-blue-500"    sub="Active complexes" />
        <KpiCard icon={Building2} label="Buildings"   value={totalBld} change={GROWTH.buildings}  accent="bg-violet-500"  accentLight="bg-violet-50"  accentIcon="text-violet-500"  sub="Across all residences" />
        <KpiCard icon={Home}      label="Apartments"  value={totalApt} change={GROWTH.apartments} accent="bg-emerald-500" accentLight="bg-emerald-50" accentIcon="text-emerald-500" sub={`Avg. ${avgArea} m² per unit`} />
        <KpiCard icon={Users}     label="Owners"      value={totalOwn} change={GROWTH.owners}     accent="bg-amber-500"   accentLight="bg-amber-50"   accentIcon="text-amber-500"   sub={`${withOwner} / ${totalApt} units covered`} />
      </div>

      {/* ── BIG CHART + OCCUPANCY STATUS side by side ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Growth area chart — takes 2/3 */}
        <Card className="col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Growth</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <p className="text-4xl font-black text-foreground">{totalApt} Units</p>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                    <TrendingUp size={10} /> +200% since launch
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-1">
                {[
                  { key: 'apartments', color: '#3b82f6', label: 'Apartments' },
                  { key: 'owners',     color: '#8b5cf6', label: 'Owners' },
                  { key: 'buildings',  color: '#22c55e', label: 'Buildings' },
                  { key: 'residences', color: '#f59e0b', label: 'Residences' },
                ].map(l => (
                  <div key={l.key} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {[
                    { id: 'gApt', color: '#3b82f6' },
                    { id: 'gOwn', color: '#8b5cf6' },
                    { id: 'gBld', color: '#22c55e' },
                    { id: 'gRes', color: '#f59e0b' },
                  ].map(g => (
                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={g.color} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={g.color} stopOpacity={0}    />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 12]} />
                <Tooltip content={<GrowthTooltip />} />
                <Area type="monotone" dataKey="apartments" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gApt)" dot={false} />
                <Area type="monotone" dataKey="owners"     stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gOwn)" dot={false} />
                <Area type="monotone" dataKey="buildings"  stroke="#22c55e" strokeWidth={2}   fill="url(#gBld)" dot={false} />
                <Area type="monotone" dataKey="residences" stroke="#f59e0b" strokeWidth={2}   fill="url(#gRes)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Area Distribution — dot plot, each apt as a floating dot */}
        <Card>
          <CardContent className="p-5 flex flex-col h-full">
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">Area Distribution</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Each dot = one unit · position = floor & size</p>
            </div>

            <div className="flex items-center gap-4 mb-3 text-[10px] text-muted-foreground">
              {[['#3b82f6','60–75 m²'],['#8b5cf6','75–90 m²'],['#22c55e','90–110 m²']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                  {l}
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={230}>
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number" dataKey="x" name="Floor"
                  domain={[0.5, 3.5]} ticks={[1, 2, 3]}
                  tickFormatter={v => `Floor ${v}`}
                  tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                />
                <YAxis
                  type="number" dataKey="y" name="Area"
                  unit=" m²" domain={[55, 120]}
                  tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                />
                <ZAxis range={[90, 90]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]?.payload
                    return (
                      <div className="bg-white rounded-xl border shadow-xl px-3 py-2.5 text-xs space-y-1">
                        <p className="font-bold text-foreground">{d?.unit}</p>
                        <p className="text-muted-foreground">{d?.bucket}</p>
                        <p className="font-semibold text-foreground">{d?.y} m²</p>
                      </div>
                    )
                  }}
                />
                <ReferenceLine
                  y={avgArea} stroke="#94a3b8" strokeDasharray="5 3"
                  label={{ value: `avg ${avgArea}m²`, position: 'insideTopRight', fontSize: 9, fill: '#94a3b8', dy: -6 }}
                />
                <Scatter
                  data={scatterDots}
                  shape={(props: { cx?: number; cy?: number; payload?: { fill: string } }) => (
                    <circle
                      cx={props.cx} cy={props.cy} r={9}
                      fill={props.payload?.fill}
                      fillOpacity={0.85}
                      stroke="#fff" strokeWidth={2}
                    />
                  )}
                />
              </ScatterChart>
            </ResponsiveContainer>

            <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Portfolio avg area</span>
              <span className="font-black text-foreground text-base">{avgArea} m²</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── 2 BIG MERGED CHARTS ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* LEFT: ComposedChart — stacked additions bars + cumulative total line */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Growth Momentum</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Monthly additions · cumulative total</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Apartments</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" />Owners</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Buildings</span>
                <span className="flex items-center gap-1.5 border-l pl-3">
                  <span className="h-px w-4 bg-slate-400 inline-block" style={{ borderTop: '2px dashed #94a3b8' }} />
                  Total
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <ComposedChart data={COMBINED_MONTHLY.slice(-PERIOD_SLICE[period])} margin={{ top: 5, right: 30, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left"  tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 12]} />
                <Tooltip content={<GrowthTooltip />} />
                <Bar yAxisId="left" dataKey="Apartments" stackId="a" fill="#3b82f6" fillOpacity={0.85} radius={[0,0,0,0]} />
                <Bar yAxisId="left" dataKey="Owners"     stackId="a" fill="#8b5cf6" fillOpacity={0.85} radius={[0,0,0,0]} />
                <Bar yAxisId="left" dataKey="Buildings"  stackId="a" fill="#22c55e" fillOpacity={0.85} radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="Total" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 4, fill: '#fff', stroke: '#94a3b8', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RIGHT: RadialBarChart — 3 concentric health rings */}
        <Card>
          <CardContent className="p-6 flex flex-col">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">Portfolio Health</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Key rates across all dimensions</p>
            </div>

            <div className="flex items-center gap-6 flex-1">
              {/* Radial rings */}
              <div className="relative shrink-0">
                <ResponsiveContainer width={220} height={220}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="28%" outerRadius="90%"
                    data={[
                      { name: 'Residential',  value: Math.round(mockApartments.filter(a => a.usageType === 'RESIDENTIAL').length / totalApt * 100), fill: '#3b82f6' },
                      { name: 'Ownership',    value: Math.round(withOwner / totalApt * 100),  fill: '#8b5cf6' },
                      { name: 'Occupancy',    value: Math.round(occupied  / totalApt * 100),  fill: '#22c55e' },
                    ]}
                    startAngle={90} endAngle={-270}
                  >
                    <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#f8fafc' }} />
                    <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-black text-foreground">{Math.round(occupied / totalApt * 100)}%</p>
                  <p className="text-[10px] text-muted-foreground">Occupancy</p>
                </div>
              </div>

              {/* Ring legend + stats */}
              <div className="flex flex-col gap-5 flex-1">
                {[
                  { label: 'Occupancy Rate',     value: Math.round(occupied / totalApt * 100),  color: '#22c55e', desc: `${occupied} of ${totalApt} units` },
                  { label: 'Ownership Coverage', value: Math.round(withOwner / totalApt * 100), color: '#8b5cf6', desc: `${withOwner} of ${totalApt} units` },
                  { label: 'Residential Share',  value: Math.round(mockApartments.filter(a => a.usageType === 'RESIDENTIAL').length / totalApt * 100), color: '#3b82f6', desc: `${mockApartments.filter(a => a.usageType === 'RESIDENTIAL').length} of ${totalApt} units` },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                        <span className="text-xs text-muted-foreground">{r.label}</span>
                      </div>
                      <span className="text-sm font-black" style={{ color: r.color }}>{r.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${r.value}%`, background: r.color }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
