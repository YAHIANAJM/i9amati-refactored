import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react'
import { mockDailyEntries, mockAccountingStats, mockContributions } from '@/data/mock/accounting'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

export function Accounting() {
  const s = mockAccountingStats
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Comptabilité" subtitle="Daftar yawmi · Daftar ostad · Daftar jard"
        actions={<Button size="sm" className="gap-1.5 text-xs"><Plus size={13} />Nouvelle écriture</Button>}
      />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 shrink-0"><TrendingUp size={18} className="text-emerald-600" /></div>
            <div><p className="text-base font-bold text-emerald-600">{formatCurrency(s.totalCredits)}</p><p className="text-xs text-muted-foreground">Total Crédits</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 shrink-0"><TrendingDown size={18} className="text-red-600" /></div>
            <div><p className="text-base font-bold text-red-600">{formatCurrency(s.totalDebits)}</p><p className="text-xs text-muted-foreground">Total Débits</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 shrink-0"><Wallet size={18} className="text-blue-600" /></div>
            <div><p className="text-base font-bold text-blue-600">{formatCurrency(s.balance)}</p><p className="text-xs text-muted-foreground">Solde</p></div>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Daily entries */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Daftar Al-Yawmi - Écritures du jour</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Libellé</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Catégorie</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Montant</th>
                  </tr></thead>
                  <tbody>
                    {mockDailyEntries.map((e, i) => (
                      <tr key={e.id} className={cn('border-b last:border-0 hover:bg-muted/20', i % 2 !== 0 && 'bg-muted/10')}>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(e.date)}</td>
                        <td className="px-3 py-2.5 text-xs">{e.label}</td>
                        <td className="px-3 py-2.5"><Badge variant="secondary" className="text-[10px] py-0">{e.category}</Badge></td>
                        <td className={cn('px-3 py-2.5 text-xs font-semibold text-right', e.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600')}>
                          {e.type === 'CREDIT' ? '+' : '-'}{formatCurrency(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Contributions */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Contributions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {mockContributions.map(c => (
                <div key={c.id} className="p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-start justify-between mb-1">
                    <Badge variant={c.type === 'Normale' ? 'info' : c.type === 'Exception' ? 'warning' : 'purple'} className="text-[10px]">{c.type}</Badge>
                    <Badge variant={c.status === 'PAID' ? 'success' : 'warning'} className="text-[10px]">{c.status === 'PAID' ? 'Payé' : 'En attente'}</Badge>
                  </div>
                  <p className="text-xs font-medium mt-1">{c.label}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">{formatCurrency(c.amount)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
