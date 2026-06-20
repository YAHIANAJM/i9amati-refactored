import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  AreaChart, Area,
  BarChart, Bar,
  RadialBarChart, RadialBar,
  Treemap,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  Banknote, Receipt, TrendingUp, Percent,
  ArrowUpRight, ArrowDownRight, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockFees, mockExpenses, mockPaymentStats, type ExpenseCategory } from '@/data/mock/payments'

// ─── Types ────────────────────────────────────────────────────────────
type Period = '7D' | '1M' | '3M' | '1Y'
const PERIOD_SLICE: Record<Period, number> = { '7D': 2, '1M': 3, '3M': 4, '1Y': 6 }

// ─── Monthly trend enriched with expenses ─────────────────────────────
const EXPENSE_BY_MONTH = [5200, 6100, 7300, 5800, 8270, 8270]
const MONTH_EN         = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

const MONTHLY_DATA = mockPaymentStats.monthlyTrend.map((d, i) => ({
  month:     MONTH_EN[i],
  Collected: d.collected,
  Expenses:  EXPENSE_BY_MONTH[i],
  Net:       d.collected - EXPENSE_BY_MONTH[i],
}))

// ─── KPI derived ──────────────────────────────────────────────────────
const lastM = MONTHLY_DATA[MONTHLY_DATA.length - 1]
const prevM = MONTHLY_DATA[MONTHLY_DATA.length - 2]

const currentCollected = lastM.Collected
const currentExpenses  = lastM.Expenses
const netBalance       = lastM.Net
const collectionRate   = mockPaymentStats.collectionRate

function pctChange(cur: number, prev: number) {
  return prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100)
}
const GROWTH = {
  collected: pctChange(lastM.Collected, prevM.Collected),
  expenses:  pctChange(lastM.Expenses,  prevM.Expenses),
  net:       pctChange(lastM.Net,        prevM.Net),
  rate:      +2,
}

// ─── Expense treemap data ─────────────────────────────────────────────
const CAT_COLOR: Record<ExpenseCategory, string> = {
  CLEANING:    '#14b8a6',
  MAINTENANCE: '#93c5fd',
  SECURITY:    '#3b82f6',
  ADMIN:       '#94a3b8',
  UTILITIES:   '#f59e0b',
  REPAIR:      '#c8d2db',
  OTHER:       '#9ca3af',
}
const CAT_LABEL: Record<ExpenseCategory, string> = {
  CLEANING: 'Cleaning', MAINTENANCE: 'Maintenance', SECURITY: 'Security',
  ADMIN: 'Admin', UTILITIES: 'Utilities', REPAIR: 'Repair', OTHER: 'Other',
}

const expenseTreemap = (Object.keys(CAT_COLOR) as ExpenseCategory[])
  .map(cat => ({
    name: CAT_LABEL[cat],
    size: mockExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    color: CAT_COLOR[cat],
  }))
  .filter(x => x.size > 0)
  .sort((a, b) => b.size - a.size)

// ─── Building comparison bars ─────────────────────────────────────────
const buildingStats = ['Bât A', 'Bât Atlas'].map(b => ({
  name:    b,
  Paid:    mockFees.filter(f => f.building === b && f.status === 'PAID').length,
  Pending: mockFees.filter(f => f.building === b && f.status === 'PENDING').length,
  Overdue: mockFees.filter(f => f.building === b && f.status === 'OVERDUE').length,
}))

// ─── Radial fee status ────────────────────────────────────────────────
const paidCount    = mockFees.filter(f => f.status === 'PAID').length
const pendingCount = mockFees.filter(f => f.status === 'PENDING').length
const overdueCount = mockFees.filter(f => f.status === 'OVERDUE').length
const total        = mockFees.length

const feeRadial = [
  { name: 'Paid',    value: Math.round(paidCount    / total * 100), fill: '#10b981' },
  { name: 'Pending', value: Math.round(pendingCount / total * 100), fill: '#f59e0b' },
  { name: 'Overdue', value: Math.round(overdueCount / total * 100), fill: '#ef4444' },
]

// ─── Helpers ──────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString('en-MA') + ' MAD' }

// ─── KPI Card — same pattern as ApartmentsDash ────────────────────────
function KpiCard({ icon: Icon, label, value, change, accent, accentLight, accentIcon, sub }: {
  icon: React.ElementType; label: string; value: string; change: number
  accent: string; accentLight: string; accentIcon: string; sub?: string
}) {
  const positive = change >= 0
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
        <p className="text-[1.9rem] font-black tabular-nums leading-none text-foreground tracking-tight">{value}</p>
        {sub && <p className={`text-xs font-semibold mt-1.5 leading-tight ${accentIcon}`}>{sub}</p>}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
          <span className={cn('flex items-center gap-0.5 text-[11px] font-bold', positive ? 'text-emerald-500' : 'text-red-500')}>
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change)}%
          </span>
          <span className="text-[10px] text-muted-foreground">vs last period</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────
function MoneyTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-2xl px-4 py-3 text-xs min-w-[170px]">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-bold text-foreground">{p.value.toLocaleString('en-MA')} MAD</span>
        </div>
      ))}
    </div>
  )
}

// ─── Treemap cell renderer ────────────────────────────────────────────
const COLOR_BY_NAME: Record<string, string> = Object.fromEntries(
  (Object.keys(CAT_LABEL) as ExpenseCategory[]).map(k => [CAT_LABEL[k], CAT_COLOR[k]])
)

function TreeCell(props: {
  x?: number; y?: number; width?: number; height?: number; name?: string; size?: number
}) {
  const { x = 0, y = 0, width = 0, height = 0, name = '', size = 0 } = props
  const fill = COLOR_BY_NAME[name] ?? '#6366f1'
  if (width < 20 || height < 20) return <g />
  return (
    <g>
      <rect x={x + 2} y={y + 2} width={Math.max(width - 4, 0)} height={Math.max(height - 4, 0)}
        rx={8} ry={8} fill={fill} fillOpacity={0.88} />
      {width > 65 && height > 44 && (
        <>
          <text x={x + 10} y={y + 24} fill="white" fontSize={11} fontWeight={700}>{name}</text>
          <text x={x + 10} y={y + 40} fill="rgba(255,255,255,0.7)" fontSize={10}>
            {size.toLocaleString('en-MA')} MAD
          </text>
        </>
      )}
    </g>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────
export function PaymentsDash() {
  const [period, setPeriod] = useState<Period>('1Y')
  const chartData = MONTHLY_DATA.slice(-PERIOD_SLICE[period])

  return (
    <div className="flex-1 p-6 overflow-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">
            Payments Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Financial performance · June 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5">
            {(['7D', '1M', '3M', '1Y'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn('px-4 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  period === p
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground')}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold">
            <Calendar size={13} />
            <span>June, 2026</span>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Banknote} label="Total Collected"
          value={fmt(currentCollected)} change={GROWTH.collected}
          accent="bg-emerald-500" accentLight="bg-emerald-50" accentIcon="text-emerald-500"
          sub="This period" />
        <KpiCard
          icon={Receipt} label="Total Expenses"
          value={fmt(currentExpenses)} change={GROWTH.expenses}
          accent="bg-red-500" accentLight="bg-red-50" accentIcon="text-red-500"
          sub={`${mockExpenses.length} transactions`} />
        <KpiCard
          icon={TrendingUp} label="Net Balance"
          value={fmt(netBalance)} change={GROWTH.net}
          accent="bg-blue-500" accentLight="bg-blue-50" accentIcon="text-blue-500"
          sub="Collected − Expenses" />
        <KpiCard
          icon={Percent} label="Collection Rate"
          value={`${collectionRate}%`} change={GROWTH.rate}
          accent="bg-violet-500" accentLight="bg-violet-50" accentIcon="text-violet-500"
          sub={`${paidCount} / ${total} owners paid`} />
      </div>

      {/* ── Row 1: Big area chart (2/3) + Radial status (1/3) ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Income vs Expenses — dual gradient area chart */}
        <Card className="col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm text-muted-foreground">Income vs Expenses</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <p className="text-4xl font-black text-foreground">{fmt(netBalance)}</p>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                    <ArrowUpRight size={10} /> Net Balance
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-5 text-[11px] text-muted-foreground mt-1">
                {[
                  { color: '#6366f1', label: 'Collected' },
                  { color: '#3b82f6', label: 'Expenses' },
                  { color: '#10b981', label: 'Net' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  {[
                    { id: 'gColl', color: '#6366f1' },
                    { id: 'gExp',  color: '#3b82f6' },
                    { id: 'gNet',  color: '#10b981' },
                  ].map(g => (
                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={g.color} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={g.color} stopOpacity={0}    />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<MoneyTooltip />} />
                <Area type="monotone" dataKey="Collected" name="Collected"
                  stroke="#6366f1" strokeWidth={2.5} fill="url(#gColl)" dot={false} />
                <Area type="monotone" dataKey="Expenses" name="Expenses"
                  stroke="#3b82f6" strokeWidth={2.5} fill="url(#gExp)" dot={false} />
                <Area type="monotone" dataKey="Net" name="Net Balance"
                  stroke="#10b981" strokeWidth={2} fill="url(#gNet)"
                  dot={false} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee collection radial status */}
        <Card>
          <CardContent className="p-5 flex flex-col">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">Fee Collection</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Status breakdown · {total} owners
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="28%" outerRadius="92%"
                    data={feeRadial}
                    startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={5} background={{ fill: '#f8fafc' }} />
                    <Tooltip formatter={(v: number) => [`${v}%`]}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-black text-foreground">{collectionRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Paid</p>
                </div>
              </div>

              <div className="w-full flex flex-col gap-3">
                {[
                  { label: 'Paid',    count: paidCount,    color: '#10b981' },
                  { label: 'Pending', count: pendingCount, color: '#f59e0b' },
                  { label: 'Overdue', count: overdueCount, color: '#ef4444' },
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
                        style={{ width: `${Math.round(r.count / total * 100)}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Row 2: Treemap + Stacked building bar ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Expense breakdown — Treemap */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Expense Breakdown</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  By category · {fmt(mockExpenses.reduce((s, e) => s + e.amount, 0))} total
                </p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end max-w-[220px]">
                {expenseTreemap.map(c => (
                  <div key={c.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="h-2 w-2 rounded-sm" style={{ background: c.color }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-100/70 rounded-xl overflow-hidden p-2">
              <ResponsiveContainer width="100%" height={270}>
                <Treemap
                  data={expenseTreemap}
                  dataKey="size"
                  nameKey="name"
                  content={<TreeCell />}
                />
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Collection by building — stacked bar */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Collection by Building</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Fee payment status per building
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Paid</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Pending</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Overdue</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={buildingStats} barSize={52}
                margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="Paid"    stackId="a" fill="#10b981" fillOpacity={0.9} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending" stackId="a" fill="#f59e0b" fillOpacity={0.9} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Overdue" stackId="a" fill="#ef4444" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
