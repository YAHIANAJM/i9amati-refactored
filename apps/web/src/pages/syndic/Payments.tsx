import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, Download, Search, CreditCard, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import { mockPayments, mockPaymentStats } from '@/data/mock/payments'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

type StatusFilter = 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'

const statusConfig = {
  PAID: { label: 'Payé', variant: 'success' as const },
  PENDING: { label: 'En attente', variant: 'warning' as const },
  OVERDUE: { label: 'En retard', variant: 'destructive' as const },
  CANCELLED: { label: 'Annulé', variant: 'secondary' as const },
}

const typeLabels: Record<string, string> = {
  CHARGE: 'Charges',
  MAINTENANCE: 'Entretien',
  REPAIR: 'Réparation',
  INSURANCE: 'Assurance',
  OTHER: 'Autre',
}

export function Payments() {
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')

  const filtered = mockPayments.filter(p => {
    const matchStatus = filter === 'ALL' || p.status === filter
    const matchSearch = search === '' || p.apartmentNumber.toLowerCase().includes(search.toLowerCase()) || p.ownerName.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Paiements & Cotisations"
        subtitle="Suivi des charges et paiements"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download size={13} /> Export Excel
            </Button>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus size={13} /> Nouveau paiement
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Collecté"
            value={formatCurrency(mockPaymentStats.totalCollected)}
            icon={<CreditCard size={16} className="text-emerald-600" />}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <SummaryCard
            label="En attente"
            value={formatCurrency(mockPaymentStats.totalPending)}
            icon={<Clock size={16} className="text-amber-600" />}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <SummaryCard
            label="En retard"
            value={formatCurrency(mockPaymentStats.totalOverdue)}
            icon={<AlertCircle size={16} className="text-red-600" />}
            color="text-red-600"
            bg="bg-red-50"
          />
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Taux de collecte</span>
                <span className="text-sm font-bold">{mockPaymentStats.collectionRate}%</span>
              </div>
              <Progress value={mockPaymentStats.collectionRate} className="h-2 mb-1" />
              <div className="flex items-center gap-1 text-[11px] text-emerald-600">
                <TrendingUp size={11} /> Objectif: 90%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="h-8 w-52 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex rounded-md border overflow-hidden">
            {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                )}
              >
                {s === 'ALL' ? 'Tous' : statusConfig[s as keyof typeof statusConfig]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <Th>Appartement</Th>
                <Th>Propriétaire</Th>
                <Th>Type</Th>
                <Th>Montant</Th>
                <Th>Date d'échéance</Th>
                <Th>Payé le</Th>
                <Th>Statut</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className={cn('border-b last:border-0 hover:bg-muted/30 transition-colors', i % 2 !== 0 && 'bg-muted/10')}>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center h-7 w-14 rounded-md bg-primary/10 text-primary text-xs font-bold">
                      {p.apartmentNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{p.ownerName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{typeLabels[p.type]}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.dueDate)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.paidAt ? formatDate(p.paidAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusConfig[p.status as keyof typeof statusConfig]?.variant || 'secondary'}>
                      {statusConfig[p.status as keyof typeof statusConfig]?.label || p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {p.status !== 'PAID' && (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        Marquer payé
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Aucun paiement trouvé</p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} paiement(s) affiché(s)</p>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon, color, bg }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} shrink-0`}>{icon}</div>
        <div>
          <p className={`text-base font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{children}</th>
}
