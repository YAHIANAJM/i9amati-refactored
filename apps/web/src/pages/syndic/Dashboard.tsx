import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  Building2, Home, Users, CreditCard, MessageSquareWarning,
  CalendarCheck, TrendingUp, Wrench, FileText, ChevronRight,
  CheckCircle2, Clock, AlertCircle, XCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'

import { mockDashboardStats, mockOccupancyByResidence } from '@/data/mock/dashboard'
import { mockPaymentStats } from '@/data/mock/payments'
import { mockApartments } from '@/data/mock/apartments'
import { mockComplaints } from '@/data/mock/complaints'
import { mockMeetings } from '@/data/mock/meetings'
import { mockServices } from '@/data/mock/services'
import { mockRightHands } from '@/data/mock/union'
import { mockAccountingStats } from '@/data/mock/accounting'
import { formatCurrency } from '@/lib/utils'

// ── Derived stats ────────────────────────────────────────────────────
const totalApts = mockApartments.length
const occupiedApts = mockApartments.filter(a => a.status === 'OCCUPIED').length
const vacantApts = mockApartments.filter(a => a.status === 'VACANT').length
const maintenanceApts = mockApartments.filter(a => a.status === 'MAINTENANCE').length
const occupancyRate = Math.round((occupiedApts / totalApts) * 100)

const openComplaints = mockComplaints.filter(c => c.status === 'OPEN').length
const inProgressComplaints = mockComplaints.filter(c => c.status === 'IN_PROGRESS').length
const resolvedComplaints = mockComplaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length

const upcomingMeetings = mockMeetings.filter(m => m.status === 'SCHEDULED').length
const activeServices = mockServices.filter(s => s.status === 'ACTIVE').length
const pendingServices = mockServices.filter(s => s.status === 'PENDING').length
const activeMembers = mockRightHands.filter(m => m.status === 'ACTIVE').length

// ── Chart data ───────────────────────────────────────────────────────
const aptStatusData = [
  { name: 'Occupied', value: occupiedApts, color: '#22c55e' },
  { name: 'Vacant', value: vacantApts, color: '#e2e8f0' },
  { name: 'Maintenance', value: maintenanceApts, color: '#f59e0b' },
]

const complaintStatusData = [
  { name: 'Open', value: openComplaints, color: '#ef4444' },
  { name: 'In Progress', value: inProgressComplaints, color: '#f59e0b' },
  { name: 'Resolved', value: resolvedComplaints, color: '#22c55e' },
]

const revenueAreaData = mockPaymentStats.monthlyTrend.map(m => ({
  month: m.month,
  Collected: m.collected,
  Pending: m.pending,
}))

const CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

// ── Quick actions ────────────────────────────────────────────────────
const quickActions = [
  { label: 'Add Payment', icon: <CreditCard size={14} />, to: '/syndic/payments', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { label: 'Schedule Meeting', icon: <CalendarCheck size={14} />, to: '/syndic/meetings', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
  { label: 'New Request', icon: <MessageSquareWarning size={14} />, to: '/syndic/alerts', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { label: 'Documents', icon: <FileText size={14} />, to: '/syndic/documents', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
]

// ── Recent activity (translated) ─────────────────────────────────────
const recentActivity = [
  { id: '1', icon: <CreditCard size={13} className="text-emerald-600" />, bg: 'bg-emerald-50', text: 'Mohammed El Fassi paid June contribution - A101', time: '2h ago' },
  { id: '2', icon: <AlertCircle size={13} className="text-amber-600" />, bg: 'bg-amber-50', text: 'Urgent complaint: Elevator out of service - B201', time: '4h ago' },
  { id: '3', icon: <Users size={13} className="text-blue-600" />, bg: 'bg-blue-50', text: 'New owner added: Omar Tahiri (B201)', time: '1d ago' },
  { id: '4', icon: <CalendarCheck size={13} className="text-violet-600" />, bg: 'bg-violet-50', text: '"Elevator emergency" meeting scheduled', time: '1d ago' },
  { id: '5', icon: <FileText size={13} className="text-slate-500" />, bg: 'bg-slate-50', text: 'AGM Minutes May 2024 added to documents', time: '3d ago' },
]

export function Dashboard() {
  const s = mockDashboardStats

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Global Dashboard"
        subtitle="Complete overview of all your residences"
        actions={
          <Button asChild size="sm" className="h-8 text-xs gap-1">
            <Link to="/syndic/association">
              View Association <ChevronRight size={13} />
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-5">

        {/* ── Top KPI row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Residences"
            value={s.totalResidences}
            sub={`${totalApts} total units`}
            icon={<Building2 size={17} className="text-blue-600" />}
            iconBg="bg-blue-50"
          />
          <KpiCard
            label="Occupancy Rate"
            value={`${occupancyRate}%`}
            sub={`${occupiedApts} occupied · ${vacantApts} vacant`}
            icon={<Home size={17} className="text-emerald-600" />}
            iconBg="bg-emerald-50"
            progress={occupancyRate}
            progressColor="bg-emerald-500"
          />
          <KpiCard
            label="Monthly Revenue"
            value={formatCurrency(s.monthlyRevenue)}
            sub={
              <span className="flex items-center gap-1 text-emerald-600">
                <TrendingUp size={11} /> +{s.revenueGrowth}% vs last month
              </span>
            }
            icon={<CreditCard size={17} className="text-violet-600" />}
            iconBg="bg-violet-50"
          />
          <KpiCard
            label="Open Issues"
            value={openComplaints + inProgressComplaints}
            sub={`${s.pendingPayments} pending payments`}
            icon={<MessageSquareWarning size={17} className="text-amber-600" />}
            iconBg="bg-amber-50"
          />
        </div>

        {/* ── Secondary KPI row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniKpi label="Upcoming Meetings" value={upcomingMeetings} icon={<CalendarCheck size={15} className="text-violet-600" />} sub="scheduled" />
          <MiniKpi label="Active Services" value={activeServices} icon={<Wrench size={15} className="text-sky-600" />} sub={`${pendingServices} pending`} />
          <MiniKpi label="Union Members" value={activeMembers} icon={<Users size={15} className="text-indigo-600" />} sub="active" />
          <MiniKpi label="Accounting Balance" value={formatCurrency(mockAccountingStats.balance)} icon={<TrendingUp size={15} className="text-emerald-600" />} sub="current balance" />
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Revenue area chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-1 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Monthly Revenue - MAD</CardTitle>
                <Link to="/syndic/dash/payments" className="text-[11px] text-primary flex items-center gap-0.5 hover:underline">
                  Full report <ChevronRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-2">
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={revenueAreaData}>
                  <defs>
                    <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="Collected" stroke="#3b82f6" strokeWidth={2} fill="url(#gradCollected)" />
                  <Area type="monotone" dataKey="Pending" stroke="#f59e0b" strokeWidth={2} fill="url(#gradPending)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-1">
                <LegendDot color="#3b82f6" label="Collected" />
                <LegendDot color="#f59e0b" label="Pending" />
              </div>
            </CardContent>
          </Card>

          {/* Occupancy by residence */}
          <Card>
            <CardHeader className="pb-1 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Occupancy by Residence</CardTitle>
                <Link to="/syndic/dash/apartments" className="text-[11px] text-primary flex items-center gap-0.5 hover:underline">
                  Details <ChevronRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-2 space-y-4">
              {mockOccupancyByResidence.map(r => {
                const rate = Math.round((r.occupied / r.total) * 100)
                return (
                  <div key={r.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{r.name}</span>
                      <span className="text-xs text-muted-foreground">{rate}%</span>
                    </div>
                    <Progress value={rate} className="h-1.5" />
                    <div className="flex gap-3 mt-1">
                      <span className="text-[11px] text-emerald-600">{r.occupied} occupied</span>
                      <span className="text-[11px] text-muted-foreground">{r.vacant} vacant</span>
                      {r.maintenance > 0 && <span className="text-[11px] text-amber-600">{r.maintenance} maintenance</span>}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* ── Distribution row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Apartment status donut */}
          <Card>
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-semibold">Apartment Status</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={aptStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                    dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}
                  >
                    {aptStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 flex-wrap justify-center mt-1">
                {aptStatusData.map(d => (
                  <LegendDot key={d.name} color={d.color} label={`${d.name} (${d.value})`} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Complaints donut */}
          <Card>
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-semibold">Complaint Status</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={complaintStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                    dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}
                  >
                    {complaintStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 flex-wrap justify-center mt-1">
                {complaintStatusData.map(d => (
                  <LegendDot key={d.name} color={d.color} label={`${d.name} (${d.value})`} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment breakdown bar */}
          <Card>
            <CardHeader className="pb-1 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Payment Health</CardTitle>
                <Link to="/syndic/payments" className="text-[11px] text-primary flex items-center gap-0.5 hover:underline">
                  Manage <ChevronRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-2 space-y-3">
              <PaymentBar label="Collected" amount={mockPaymentStats.totalCollected} color="bg-emerald-500" total={mockPaymentStats.totalCollected + mockPaymentStats.totalPending + mockPaymentStats.totalOverdue} />
              <PaymentBar label="Pending" amount={mockPaymentStats.totalPending} color="bg-amber-400" total={mockPaymentStats.totalCollected + mockPaymentStats.totalPending + mockPaymentStats.totalOverdue} />
              <PaymentBar label="Overdue" amount={mockPaymentStats.totalOverdue} color="bg-red-400" total={mockPaymentStats.totalCollected + mockPaymentStats.totalPending + mockPaymentStats.totalOverdue} />
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Collection rate</span>
                  <span className="text-xs font-semibold">{mockPaymentStats.collectionRate}%</span>
                </div>
                <Progress value={mockPaymentStats.collectionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom row: Activity + Quick actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent activity */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">View all</Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${a.bg} shrink-0 mt-0.5`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions + status summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 grid grid-cols-2 gap-2">
                {quickActions.map(a => (
                  <Button key={a.label} variant="ghost" size="sm" asChild
                    className={`h-auto py-2 px-3 justify-start gap-2 text-xs font-medium rounded-lg ${a.color}`}
                  >
                    <Link to={a.to}>
                      {a.icon}
                      {a.label}
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold">Status Summary</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-2">
                <StatusRow icon={<CheckCircle2 size={13} className="text-emerald-600" />} label="Payments on track" value={`${mockPaymentStats.collectionRate}%`} />
                <StatusRow icon={<Clock size={13} className="text-amber-600" />} label="Pending issues" value={openComplaints + inProgressComplaints} />
                <StatusRow icon={<AlertCircle size={13} className="text-red-500" />} label="Overdue payments" value={s.overduePayments} />
                <StatusRow icon={<XCircle size={13} className="text-slate-400" />} label="Vacant units" value={vacantApts} />
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────

function KpiCard({ label, value, icon, iconBg, sub, progress, progressColor }: {
  label: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
  sub: React.ReactNode
  progress?: number
  progressColor?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${iconBg} mb-3`}>
          {icon}
        </div>
        <p className="text-2xl font-bold tracking-tight leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {progress !== undefined && (
          <Progress value={progress} className={`h-1 mt-2 [&>div]:${progressColor}`} />
        )}
        <div className="text-[11px] text-muted-foreground mt-2">{sub}</div>
      </CardContent>
    </Card>
  )
}

function MiniKpi({ label, value, icon, sub }: { label: string; value: string | number; icon: React.ReactNode; sub: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{label}</p>
          <p className="text-[10px] text-muted-foreground/70">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}

function PaymentBar({ label, amount, color, total }: { label: string; amount: number; color: string; total: number }) {
  const pct = Math.round((amount / total) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold">{formatCurrency(amount)}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatusRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  )
}
