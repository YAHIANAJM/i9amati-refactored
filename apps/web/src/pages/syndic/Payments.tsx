import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Search, Plus, Download, Check, X, ChevronDown, ChevronUp,
  AlertCircle, Receipt, Banknote, CreditCard,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Filter,
  Wrench, Shield, Leaf, Zap, Settings2, HelpCircle, CalendarClock, Bell,
} from 'lucide-react'
import {
  mockFees, mockExpenses, mockProjects,
  type FeeRecord, type ExpenseRecord, type ProjectFund, type ExpenseCategory,
} from '@/data/mock/payments'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('en-MA') + ' MAD' }

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash', TRANSFER: 'Transfer', CHECK: 'Check',
}

const STATUS_FEE = {
  PAID:    { label: 'Paid',    cls: 'bg-emerald-100 text-emerald-700' },
  PENDING: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
  OVERDUE: { label: 'Overdue', cls: 'bg-red-100 text-red-700' },
}

const CAT_CONFIG: Record<ExpenseCategory, { label: string; icon: React.ReactNode; color: string; dot: string }> = {
  CLEANING:    { label: 'Cleaning',    icon: <Leaf size={11} />,       color: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-400' },
  MAINTENANCE: { label: 'Maintenance', icon: <Wrench size={11} />,     color: 'bg-blue-100 text-blue-700',     dot: 'bg-[#93c5fd]' },
  SECURITY:    { label: 'Security',    icon: <Shield size={11} />,     color: 'bg-violet-100 text-violet-700', dot: 'bg-[#3b82f6]' },
  ADMIN:       { label: 'Admin',       icon: <Settings2 size={11} />,  color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
  UTILITIES:   { label: 'Utilities',   icon: <Zap size={11} />,        color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  REPAIR:      { label: 'Repair',      icon: <Wrench size={11} />,     color: 'bg-orange-100 text-orange-700', dot: 'bg-[#6366f1]' },
  OTHER:       { label: 'Other',       icon: <HelpCircle size={11} />, color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
}

const PROJ_STATUS = {
  COLLECTING:  { label: 'Collecting',   cls: 'bg-amber-100 text-amber-700' },
  FUNDED:      { label: 'Funded',       cls: 'bg-emerald-100 text-emerald-700' },
  IN_PROGRESS: { label: 'In Progress',  cls: 'bg-blue-100 text-blue-700' },
  DONE:        { label: 'Done',         cls: 'bg-slate-100 text-slate-600' },
}

function StatusPill({ status }: { status: keyof typeof STATUS_FEE }) {
  const s = STATUS_FEE[status]
  return <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold', s.cls)}>{s.label}</span>
}

function Th({ children, sortable }: { children?: React.ReactNode; sortable?: boolean }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
      <span className="flex items-center gap-1">
        {children}
        {sortable && <span className="text-muted-foreground/40">↑↓</span>}
      </span>
    </th>
  )
}

// ─── Mark Paid Inline Form ─────────────────────────────────────────────────────

function MarkPaidForm({ amount, onConfirm, onCancel }: {
  amount: number
  onConfirm: (d: { amount: number; method: string; date: string; note: string }) => void
  onCancel: () => void
}) {
  const [v, setV] = useState({ amount, method: 'CASH', date: new Date().toISOString().slice(0, 10), note: '' })
  return (
    <div className="flex flex-wrap items-end gap-3 px-4 py-3 bg-emerald-50/60 border-t border-emerald-200/50">
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">Amount</p>
        <input type="number" value={v.amount} onChange={e => setV(p => ({ ...p, amount: +e.target.value }))}
          className="h-8 w-28 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">Method</p>
        <select value={v.method} onChange={e => setV(p => ({ ...p, method: e.target.value }))}
          className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="CASH">Cash</option>
          <option value="TRANSFER">Transfer</option>
          <option value="CHECK">Check</option>
        </select>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">Date</p>
        <input type="date" value={v.date} onChange={e => setV(p => ({ ...p, date: e.target.value }))}
          className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div className="flex-1 min-w-[140px]">
        <p className="text-[10px] text-muted-foreground mb-1">Note (optional)</p>
        <input type="text" value={v.note} placeholder="e.g. paid in hand" onChange={e => setV(p => ({ ...p, note: e.target.value }))}
          className="h-8 w-full rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => onConfirm(v)}>
          <Check size={12} /> Confirm
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancel}><X size={12} /></Button>
      </div>
    </div>
  )
}

// ─── Fee Invoice Modal ────────────────────────────────────────────────────────

function FeeInvoiceModal({ fee, onClose, onMarkPaid }: {
  fee: FeeRecord
  onClose: () => void
  onMarkPaid: (d: { amount: number; method: string; date: string; note: string }) => void
}) {
  const [markingPaid, setMarkingPaid] = useState(false)

  const isPaid    = fee.status === 'PAID'
  const isOverdue = fee.status === 'OVERDUE'

  const steps = [
    { label: 'Invoice\nCreated',   done: true },
    { label: 'Due Date\nSet',      done: true },
    { label: 'Payment\nReceived',  done: isPaid },
    { label: 'Confirmed',          done: isPaid },
  ]
  const trackW = isPaid ? '100%' : isOverdue ? '38%' : '52%'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Fee Invoice</p>
          <button onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Receipt section */}
        <div className="px-5 pt-4 pb-2">
          {/* Printer slot */}
          <div className="h-5 bg-gray-900 rounded-t-lg flex items-center justify-center gap-1.5">
            {[...Array(9)].map((_, i) => <span key={i} className="h-1 w-1 rounded-full bg-white/20" />)}
          </div>

          {/* Paper */}
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
            <div className="px-5 pt-4 pb-3 border-t-2 border-dashed border-gray-200 text-center">
              <p className="font-mono text-[11px] text-gray-400 tracking-widest">
                ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
              </p>
              <p className="font-mono text-sm font-semibold text-gray-800 mt-1">
                Syndic Fee — {fee.period}
              </p>
              <p className="font-mono text-xs text-gray-500 mt-0.5">
                Unit {fee.unitCode} · {fee.building}
              </p>
              <p className="font-mono text-[11px] text-gray-400 tracking-widest mt-1">
                ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
              </p>
            </div>

            <div className="px-5 py-3 space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Fee Amount</span>
                <span className="font-bold text-gray-900">{fmt(fee.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Due Date</span>
                <span className="text-gray-700">{fee.dueDate}</span>
              </div>
              {fee.paidAt && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Paid On</span>
                  <span className="text-emerald-600 font-semibold">{fee.paidAt}</span>
                </div>
              )}
              {fee.paymentMethod && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Method</span>
                  <span className="text-gray-700">{METHOD_LABEL[fee.paymentMethod]}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-200 mx-5" />

            <div className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {fee.ownerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{fee.ownerName}</p>
                    <p className="text-[11px] text-gray-400">Owner · {fee.unitCode}</p>
                  </div>
                </div>
                <StatusPill status={fee.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Progress stepper */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">Payment Status</p>
            <p className={cn(
              'text-sm font-black uppercase tracking-wider',
              isPaid ? 'text-emerald-600' : isOverdue ? 'text-red-500' : 'text-amber-500'
            )}>
              {STATUS_FEE[fee.status].label}
            </p>
          </div>

          <div className="relative flex items-center justify-between px-3">
            {/* Track line */}
            <div className="absolute left-3 right-3 top-3.5 h-0.5 bg-gray-200 z-0">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: trackW }} />
            </div>

            {steps.map((step, i) => {
              const isOverdueStep = isOverdue && i === 2
              return (
                <div key={i} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={cn(
                    'h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors',
                    step.done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isOverdueStep
                      ? 'bg-red-50 border-red-400 text-red-400'
                      : !isPaid && i === 2
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'bg-white border-gray-200 text-gray-300'
                  )}>
                    {step.done
                      ? <Check size={12} />
                      : isOverdueStep
                      ? <AlertCircle size={11} />
                      : <span className="text-[10px]">{i + 1}</span>
                    }
                  </div>
                  <p className="text-[9px] text-gray-400 text-center w-[52px] leading-tight whitespace-pre-line">
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2.5">
          {!markingPaid ? (
            <>
              <div className={cn('grid gap-2', isPaid ? 'grid-cols-1' : 'grid-cols-2')}>
                {!isPaid && (
                  <button className="h-10 rounded-xl bg-gray-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors">
                    <Bell size={13} /> Send Reminder
                  </button>
                )}
                <button className="h-10 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
                  <Download size={13} /> Download Invoice
                </button>
              </div>
              {!isPaid && (
                <button onClick={() => setMarkingPaid(true)}
                  className="w-full h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
                  <Check size={15} /> Mark as Paid
                </button>
              )}
            </>
          ) : (
            <MarkPaidForm
              amount={fee.amount}
              onConfirm={d => { onMarkPaid(d); onClose() }}
              onCancel={() => setMarkingPaid(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Overview Tab — exact Fincan.io layout ────────────────────────────────────

function OverviewTab({ onGoFees, onGoExpenses, onGoProjects, syndicBalance }: {
  onGoFees: () => void; onGoExpenses: () => void; onGoProjects: () => void; syndicBalance: number
}) {
  const totalCollected = mockFees.filter(f => f.status === 'PAID').reduce((s, f) => s + f.amount, 0)
  const totalExpenses  = mockExpenses.reduce((s, e) => s + e.amount, 0)
  const totalExpected  = mockFees.reduce((s, f) => s + f.amount, 0)
  const paidCount      = mockFees.filter(f => f.status === 'PAID').length
  const collectPct     = Math.round((totalCollected / totalExpected) * 100)

  const expByCategory = (Object.keys(CAT_CONFIG) as ExpenseCategory[])
    .map(cat => ({ cat, total: mockExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0) }))
    .filter(x => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 3)

  // mixed recent transactions
  const recentTx = [
    ...mockFees.map(f => ({
      id: f.id, name: `Fee — Unit ${f.unitCode}`, sub: f.ownerName,
      type: 'Fee', date: f.dueDate, amount: f.amount, sign: '+',
      status: f.status as keyof typeof STATUS_FEE,
      color: 'bg-blue-100 text-blue-600',
    })),
    ...mockExpenses.map(e => ({
      id: e.id, name: e.description, sub: e.paidTo,
      type: 'Expense', date: e.date, amount: e.amount, sign: '-',
      status: 'PAID' as keyof typeof STATUS_FEE,
      color: 'bg-red-100 text-red-500',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  return (
    // Exact Fincan.io grid: left col (fixed width) + middle + right | bottom spans mid+right
    <div className="grid grid-cols-[380px_1fr_1fr] gap-5">

      {/* ── LEFT column — spans 2 rows (Balance + Saving Plans) ── */}
      <div className="row-span-2 flex flex-col gap-5">

        {/* Total Balance card */}
        <div className="rounded-2xl bg-card border shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Total Balance</span>
            <div className="flex items-center gap-1.5 bg-muted rounded-full px-2 py-0.5">
              <div className="flex gap-0.5">
                {[...Array(4)].map((_, i) => <span key={i} className="w-1 h-1 rounded-full bg-muted-foreground/40" />)}
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">SYN1</span>
              <ChevronDown size={10} className="text-muted-foreground" />
            </div>
          </div>
          <p className="text-[28px] font-bold text-foreground mt-2 leading-tight">{fmt(syndicBalance)}</p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={onGoFees}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Check size={14} /> Record Payment
            </button>
            <button
              onClick={onGoExpenses}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border-2 border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors">
              <Plus size={14} /> Add Expense
            </button>
          </div>
        </div>

        {/* Saving Plans — Project Funds */}
        <div className="rounded-2xl bg-card border shadow-sm p-5 flex-1">
          <p className="text-sm font-semibold text-foreground mb-4">Active Projects</p>
          <div className="space-y-5">
            {mockProjects.map(proj => {
              const pct = Math.round((proj.collectedAmount / proj.targetAmount) * 100)
              const icons = [
                <div key="1" className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><Wrench size={14} className="text-blue-600" /></div>,
                <div key="2" className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center"><Shield size={14} className="text-violet-600" /></div>,
                <div key="3" className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Zap size={14} className="text-amber-600" /></div>,
              ]
              const idx = mockProjects.indexOf(proj)
              return (
                <div key={proj.id} className="cursor-pointer" onClick={onGoProjects}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {icons[idx % 3]}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{proj.name}</p>
                        <p className="text-[10px] text-muted-foreground">Per unit: {fmt(proj.contributions[0]?.shareAmount ?? 0)}</p>
                      </div>
                    </div>
                    <button className="text-muted-foreground/40 hover:text-muted-foreground shrink-0">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-foreground">{fmt(proj.collectedAmount)}</span>
                    <span className="text-muted-foreground">target: {fmt(proj.targetAmount)}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── MIDDLE column — Income + Expense stacked ── */}
      <div className="flex flex-col gap-4">
        {/* Total Income */}
        <div className="rounded-2xl bg-card border shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-muted-foreground">Total Income</span>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Banknote size={18} className="text-blue-500" />
            </div>
          </div>
          <p className="text-[26px] font-bold text-foreground">{fmt(totalCollected)}</p>
          <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1 font-medium">
            <ArrowUpRight size={13} /> {paidCount}/{mockFees.length} owners paid this month
          </p>
        </div>

        {/* Total Expense */}
        <div className="rounded-2xl bg-card border shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs text-muted-foreground">Total Expense</span>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Receipt size={18} className="text-red-400" />
            </div>
          </div>
          <p className="text-[26px] font-bold text-foreground">{fmt(totalExpenses)}</p>
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
            <ArrowDownRight size={13} /> {mockExpenses.length} transactions recorded
          </p>
        </div>
      </div>

      {/* ── RIGHT column — Spending Limit + Expenses Analytics ── */}
      <div className="flex flex-col gap-4">
        {/* Spending Limit → Fee collection rate */}
        <div className="rounded-2xl bg-card border shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">Fee Collection</span>
            <div className="flex items-center gap-1 border rounded-md px-2 py-1 text-[11px] text-muted-foreground cursor-pointer hover:bg-muted">
              Month <ChevronDown size={10} />
            </div>
          </div>
          <p className="text-base font-bold text-foreground">
            {fmt(totalCollected)}
            <span className="text-sm font-normal text-muted-foreground"> collected from {fmt(totalExpected)}</span>
          </p>
          <Progress value={collectPct} className="h-2 mt-3 mb-3" />
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Paid <strong>{mockFees.filter(f => f.status==='PAID').length}</strong></span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Pending <strong>{mockFees.filter(f => f.status==='PENDING').length}</strong></span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Overdue <strong>{mockFees.filter(f => f.status==='OVERDUE').length}</strong></span>
          </div>
        </div>

        {/* Expenses Analytics */}
        <div className="rounded-2xl bg-card border shadow-sm p-5 flex-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground">Expenses Analytics</span>
            <div className="flex items-center gap-1 border rounded-md px-2 py-1 text-[11px] text-muted-foreground cursor-pointer hover:bg-muted">
              Month <ChevronDown size={10} />
            </div>
          </div>
          {/* Colored bars — like Fincan.io */}
          <div className="flex gap-1 mb-4 h-2">
            {expByCategory.map(({ cat, total }) => (
              <div key={cat} className={cn('rounded-full', CAT_CONFIG[cat].dot)}
                style={{ width: `${Math.round((total / totalExpenses) * 100)}%` }} />
            ))}
          </div>
          {/* Dots + labels */}
          <div className="flex items-center gap-4">
            {expByCategory.map(({ cat, total }) => (
              <div key={cat} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn('w-2 h-2 rounded-full inline-block', CAT_CONFIG[cat].dot)} />
                  <span className="text-[11px] text-muted-foreground">{CAT_CONFIG[cat].label}</span>
                </div>
                <span className="text-xs font-bold pl-3.5">{fmt(total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM — Transactions History spans middle + right columns ── */}
      <div className="col-span-2 rounded-2xl bg-card border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="text-sm font-semibold">Transactions History</p>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md px-2.5 py-1.5 hover:bg-muted transition-colors">
              <Filter size={11} /> Filter
            </button>
            <button className="text-muted-foreground hover:text-foreground px-1">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/10">
              <Th sortable>Name</Th>
              <Th>Type</Th>
              <Th sortable>Date</Th>
              <Th sortable>Amount</Th>
              <Th sortable>Status</Th>
            </tr>
          </thead>
          <tbody>
            {recentTx.map(tx => (
              <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', tx.color)}>
                      {tx.sign === '+' ? <CreditCard size={14} /> : <Receipt size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{tx.name}</p>
                      <p className="text-[11px] text-muted-foreground">{tx.sub}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground">{tx.type}</td>
                <td className="px-4 py-3.5">
                  <p className="text-sm text-muted-foreground">{tx.date}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-sm font-semibold', tx.sign === '+' ? 'text-foreground' : 'text-muted-foreground')}>
                    {tx.sign === '+' ? '' : '−'}{fmt(tx.amount)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusPill status={tx.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Fees Tab ──────────────────────────────────────────────────────────────────

function FeesTab() {
  const [fees, setFees]               = useState<FeeRecord[]>(mockFees)
  const [search, setSearch]           = useState('')
  const [statusF, setStatusF]         = useState<'ALL'|'PAID'|'PENDING'|'OVERDUE'>('ALL')
  const [markingId, setMarkingId]     = useState<string | null>(null)
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null)

  const filtered = fees.filter(f => {
    const ms = statusF === 'ALL' || f.status === statusF
    const mq = !search || f.ownerName.includes(search) || f.unitCode.toLowerCase().includes(search.toLowerCase())
    return ms && mq
  })

  const markPaid = (id: string, data: { amount: number; method: string; date: string }) => {
    setFees(prev => prev.map(f => f.id === id
      ? { ...f, status: 'PAID', paidAt: data.date, paymentMethod: data.method as FeeRecord['paymentMethod'], amount: data.amount }
      : f))
    setMarkingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Owner / unit…"
            className="h-8 w-56 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex rounded-md border overflow-hidden">
          {(['ALL','PAID','PENDING','OVERDUE'] as const).map(s => (
            <button key={s} onClick={() => setStatusF(s)}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                statusF === s ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted')}>
              {s === 'ALL' ? 'All' : STATUS_FEE[s].label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download size={12} /> Export</Button>
          <Button size="sm" className="gap-1.5 text-xs"><Plus size={12} /> Record Payment</Button>
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden bg-card">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/30">
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Unit</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Owner</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Building</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Amount</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Due Date</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Paid On</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Method</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Status</th>
            <th className="px-4 py-2.5" />
          </tr></thead>
          <tbody>
            {filtered.map(f => (
              <>
                <tr key={f.id} onClick={() => setSelectedFee(f)} className={cn('border-b transition-colors hover:bg-muted/20 cursor-pointer', markingId === f.id && 'bg-emerald-50/40')}>
                  <td className="px-4 py-3"><span className="inline-flex items-center justify-center h-7 min-w-[52px] px-2 rounded-md bg-primary/10 text-primary text-xs font-bold">{f.unitCode}</span></td>
                  <td className="px-4 py-3 text-sm font-medium">{f.ownerName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{f.building}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{fmt(f.amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{f.dueDate}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{f.paidAt ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{f.paymentMethod ? METHOD_LABEL[f.paymentMethod] : '—'}</td>
                  <td className="px-4 py-3"><StatusPill status={f.status} /></td>
                  <td className="px-4 py-3">
                    {f.status !== 'PAID' && (
                      <Button size="sm" variant="outline"
                        className={cn('h-7 gap-1 text-xs', markingId === f.id ? 'text-muted-foreground' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50')}
                        onClick={e => { e.stopPropagation(); setMarkingId(markingId === f.id ? null : f.id) }}>
                        {markingId === f.id ? 'Cancel' : <><Check size={11} /> Mark Paid</>}
                      </Button>
                    )}
                  </td>
                </tr>
                {markingId === f.id && (
                  <tr key={`${f.id}-form`} className="border-b">
                    <td colSpan={9} className="p-0">
                      <MarkPaidForm amount={f.amount} onConfirm={d => markPaid(f.id, d)} onCancel={() => setMarkingId(null)} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <CreditCard size={36} className="mb-3 opacity-20" /><p className="text-sm">No results</p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} record(s)</p>

      {selectedFee && (
        <FeeInvoiceModal
          fee={selectedFee}
          onClose={() => setSelectedFee(null)}
          onMarkPaid={d => markPaid(selectedFee.id, d)}
        />
      )}
    </div>
  )
}

// ─── Expenses Tab ──────────────────────────────────────────────────────────────

function ExpensesTab() {
  const [expenses, setExpenses]   = useState<ExpenseRecord[]>(mockExpenses)
  const [catFilter, setCatFilter] = useState<ExpenseCategory | 'ALL'>('ALL')
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({
    description: '', category: 'MAINTENANCE' as ExpenseCategory,
    amount: '', paidTo: '', date: new Date().toISOString().slice(0, 10), linkedTo: '', hasReceipt: false,
  })
  const filtered = catFilter === 'ALL' ? expenses : expenses.filter(e => e.category === catFilter)
  const total    = filtered.reduce((s, e) => s + e.amount, 0)

  const addExpense = () => {
    if (!form.description || !form.amount) return
    setExpenses(prev => [{ id: `exp-${Date.now()}`, description: form.description, category: form.category,
      amount: +form.amount, date: form.date, paidTo: form.paidTo || '—',
      linkedTo: form.linkedTo || 'Global', hasReceipt: form.hasReceipt, addedBy: 'Yahia' }, ...prev])
    setForm({ description: '', category: 'MAINTENANCE', amount: '', paidTo: '', date: new Date().toISOString().slice(0, 10), linkedTo: '', hasReceipt: false })
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New Expense</p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)}><X size={14} /></Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] text-muted-foreground mb-1 block">Description *</label>
              <input value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} placeholder="e.g. Staircase cleaning"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value as ExpenseCategory }))}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {(Object.keys(CAT_CONFIG) as ExpenseCategory[]).map(c => <option key={c} value={c}>{CAT_CONFIG[c].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Amount (MAD) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(v => ({ ...v, amount: e.target.value }))} placeholder="0"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Paid To</label>
              <input value={form.paidTo} onChange={e => setForm(v => ({ ...v, paidTo: e.target.value }))} placeholder="Vendor / person"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(v => ({ ...v, date: e.target.value }))}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={form.hasReceipt} onChange={e => setForm(v => ({ ...v, hasReceipt: e.target.checked }))} className="rounded" />
              Receipt attached
            </label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" className="text-xs gap-1" onClick={addExpense}><Check size={12} /> Save</Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {(['ALL', ...Object.keys(CAT_CONFIG)] as (ExpenseCategory|'ALL')[]).map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                catFilter === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background text-muted-foreground hover:bg-muted')}>
              {c !== 'ALL' && CAT_CONFIG[c as ExpenseCategory].icon}
              {c === 'ALL' ? 'All' : CAT_CONFIG[c as ExpenseCategory].label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download size={12} /> Export</Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowForm(true)}><Plus size={12} /> Add Expense</Button>
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden bg-card">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/30">
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Description</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Category</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Date</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Amount</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Paid To</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Linked To</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Receipt</th>
          </tr></thead>
          <tbody>
            {filtered.map(e => {
              const cat = CAT_CONFIG[e.category]
              return (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium max-w-[220px] truncate">{e.description}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', cat.color)}>
                      {cat.icon}{cat.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.date}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-red-600">−{fmt(e.amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.paidTo}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.linkedTo}</td>
                  <td className="px-4 py-3">
                    {e.hasReceipt
                      ? <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600"><Receipt size={11} /> Attached</span>
                      : <span className="text-[11px] text-muted-foreground/40">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Total: <strong>{fmt(total)}</strong> · {filtered.length} record(s)</p>
    </div>
  )
}

// ─── Projects Tab ──────────────────────────────────────────────────────────────

function ProjectsTab() {
  const [projects, setProjects]     = useState<ProjectFund[]>(mockProjects)
  const [openBox, setOpenBox]       = useState<Record<string, boolean>>({ 'proj-1': true })
  const [markingKey, setMarkingKey] = useState<string | null>(null)

  const markPaid = (projId: string, ownerId: string, unitCode: string, data: { amount: number; method: string; date: string }) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projId) return p
      const contributions = p.contributions.map(c =>
        c.ownerId === ownerId && c.unitCode === unitCode
          ? { ...c, status: 'PAID' as const, paidAt: data.date, paymentMethod: data.method as 'CASH'|'TRANSFER'|'CHECK' }
          : c
      )
      const collectedAmount = contributions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.shareAmount, 0)
      return { ...p, contributions, collectedAmount, status: collectedAmount >= p.targetAmount ? 'FUNDED' as const : p.status }
    }))
    setMarkingKey(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5 text-xs"><Plus size={12} /> Create Project Fund</Button>
      </div>
      {projects.map(proj => {
        const pct     = Math.round((proj.collectedAmount / proj.targetAmount) * 100)
        const paid    = proj.contributions.filter(c => c.status === 'PAID').length
        const pending = proj.contributions.filter(c => c.status === 'PENDING').length
        const overdue = proj.contributions.filter(c => c.status === 'OVERDUE').length
        const boxOpen = !!openBox[proj.id]
        return (
          <div key={proj.id} className="rounded-xl border bg-card overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold">{proj.name}</h3>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', PROJ_STATUS[proj.status].cls)}>{PROJ_STATUS[proj.status].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{proj.description}</p>
                  {proj.linkedMeeting && <p className="text-[11px] text-primary mt-1">↗ {proj.linkedMeeting}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-muted-foreground">Target</p>
                  <p className="text-base font-bold">{fmt(proj.targetAmount)}</p>
                  {proj.dueDate && <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1 mt-0.5"><CalendarClock size={9} />{proj.dueDate}</p>}
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-semibold">{fmt(proj.collectedAmount)} collected</span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Per unit: <strong className="text-foreground">{fmt(proj.contributions[0]?.shareAmount ?? 0)}</strong></span>
                  <span>{fmt(proj.targetAmount - proj.collectedAmount)} remaining</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-700 font-medium"><Check size={10} /> {paid} paid</span>
                  {pending > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-700 font-medium">⏳ {pending} pending</span>}
                  {overdue > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-700 font-medium"><AlertCircle size={10} /> {overdue} overdue</span>}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                  onClick={() => setOpenBox(prev => ({ ...prev, [proj.id]: !boxOpen }))}>
                  Participants {boxOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </Button>
              </div>
            </div>
            {boxOpen && (
              <div className="border-t bg-muted/20">
                <table className="w-full">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Owner</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Unit</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Share</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Status</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Paid On</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-left">Method</th>
                    <th className="px-4 py-2.5" />
                  </tr></thead>
                  <tbody>
                    {proj.contributions.map(c => {
                      const key = `${proj.id}-${c.ownerId}-${c.unitCode}`
                      const isM = markingKey === key
                      return (
                        <>
                          <tr key={key} className={cn('border-b last:border-0 hover:bg-muted/20 transition-colors', isM && 'bg-emerald-50/40')}>
                            <td className="px-4 py-2.5 text-sm">{c.ownerName}</td>
                            <td className="px-4 py-2.5"><span className="inline-flex items-center justify-center h-6 min-w-[48px] px-2 rounded-md bg-primary/10 text-primary text-xs font-bold">{c.unitCode}</span></td>
                            <td className="px-4 py-2.5 text-sm font-semibold text-right">{fmt(c.shareAmount)}</td>
                            <td className="px-4 py-2.5"><StatusPill status={c.status} /></td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.paidAt ?? '—'}</td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.paymentMethod ? METHOD_LABEL[c.paymentMethod] : '—'}</td>
                            <td className="px-4 py-2.5">
                              {c.status !== 'PAID' && (
                                <Button size="sm" variant="outline"
                                  className={cn('h-7 gap-1 text-xs', isM ? 'text-muted-foreground' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50')}
                                  onClick={() => setMarkingKey(isM ? null : key)}>
                                  {isM ? 'Cancel' : <><Check size={11} /> Mark Paid</>}
                                </Button>
                              )}
                            </td>
                          </tr>
                          {isM && (
                            <tr key={`${key}-form`} className="border-b">
                              <td colSpan={7} className="p-0">
                                <MarkPaidForm amount={c.shareAmount} onConfirm={d => markPaid(proj.id, c.ownerId, c.unitCode, d)} onCancel={() => setMarkingKey(null)} />
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'fees' | 'expenses' | 'projects'

export function Payments() {
  const [tab, setTab] = useState<Tab>('overview')

  // Derive hero stats from real mock data — no hardcoded values
  const totalCollected  = mockFees.filter(f => f.status === 'PAID').reduce((s, f) => s + f.amount, 0)
  const totalExpenses   = mockExpenses.reduce((s, e) => s + e.amount, 0)
  const syndicBalance   = totalCollected - totalExpenses
  const overdueOwners   = mockFees.filter(f => f.status === 'OVERDUE').length
  const activeProjects  = mockProjects.filter(p => p.status === 'COLLECTING' || p.status === 'IN_PROGRESS').length

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview',  label: 'Overview' },
    { key: 'fees',      label: 'Fees' },
    { key: 'expenses',  label: 'Expenses' },
    { key: 'projects',  label: 'Projects' },
  ]

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Full dark hero — absorbs the top nav row + welcome + tabs ── */}
      <div className="bg-gradient-to-br from-[#080e1c] to-[#0d1630] relative overflow-hidden pb-20 shrink-0">

        {/* Wave dot cluster 1 — main upper-right blob (dense, bright) */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(79,135,255,0.72) 1.5px, transparent 1.5px)',
          backgroundSize: '13px 13px',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 92% 22%, black 0%, transparent 65%)',
          maskImage:       'radial-gradient(ellipse 60% 70% at 92% 22%, black 0%, transparent 65%)',
        }} />
        {/* Wave dot cluster 2 — secondary lower-right (softer) */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(100,140,255,0.38) 1.5px, transparent 1.5px)',
          backgroundSize: '13px 13px',
          WebkitMaskImage: 'radial-gradient(ellipse 36% 48% at 100% 70%, black 0%, transparent 58%)',
          maskImage:       'radial-gradient(ellipse 36% 48% at 100% 70%, black 0%, transparent 58%)',
        }} />
        {/* Wave dot cluster 3 — faint arc bridge between the two */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(80,110,220,0.2) 1px, transparent 1px)',
          backgroundSize: '13px 13px',
          WebkitMaskImage: 'radial-gradient(ellipse 20% 38% at 80% 48%, black 0%, transparent 70%)',
          maskImage:       'radial-gradient(ellipse 20% 38% at 80% 48%, black 0%, transparent 70%)',
        }} />

        {/* Top nav row — replaces TopBar */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h1 className="text-white text-base font-semibold leading-tight">Payments & Fees</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm font-bold tabular-nums text-emerald-400">{fmt(syndicBalance)}</span>
              <span className="text-slate-500 text-xs">balance</span>
              <span className="text-slate-600 text-xs mx-0.5">·</span>
              <span className="text-sm font-bold tabular-nums text-red-400">{overdueOwners}</span>
              <span className="text-slate-500 text-xs">overdue</span>
              <span className="text-slate-600 text-xs mx-0.5">·</span>
              <span className="text-sm font-bold tabular-nums text-amber-400">{activeProjects}</span>
              <span className="text-slate-500 text-xs">active projects</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:flex items-center">
              <Search size={14} className="absolute left-3 text-slate-500 pointer-events-none" />
              <input placeholder="Search..."
                className="h-8 w-52 rounded-md bg-white/5 border border-white/10 pl-8 pr-3 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-white/20" />
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors relative">
              <AlertCircle size={16} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <Settings2 size={16} />
            </button>
            <Button size="sm" variant="outline"
              className="gap-1.5 text-xs border-white/15 text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white">
              <Download size={12} /> Export
            </Button>
          </div>
        </div>

        {/* Welcome text */}
        <div className="relative px-6 pt-6">
          <p className="text-white text-[26px] font-bold mb-1">Welcome back, Yahia!</p>
          <p className="text-slate-400 text-sm mb-6">Syndic Management Dashboard</p>

          {/* Tab nav — like Fincan.io */}
          <div className="flex">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-colors relative',
                  tab === t.key
                    ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white after:rounded-t'
                    : 'text-slate-400 hover:text-slate-200'
                )}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content — pulled up so cards overlap the dark hero */}
      <div className="flex-1 px-6 pb-6 -mt-14 relative z-10 animate-fade-in">
        {tab === 'overview'  && <OverviewTab onGoFees={() => setTab('fees')} onGoExpenses={() => setTab('expenses')} onGoProjects={() => setTab('projects')} syndicBalance={syndicBalance} />}
        {tab === 'fees'      && <FeesTab />}
        {tab === 'expenses'  && <ExpensesTab />}
        {tab === 'projects'  && <ProjectsTab />}
      </div>
    </div>
  )
}
