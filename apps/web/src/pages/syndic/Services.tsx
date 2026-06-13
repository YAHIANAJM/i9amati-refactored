import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, Wrench, Phone, FileText } from 'lucide-react'
import { mockServices } from '@/data/mock/services'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

const typeColors: Record<string, string> = {
  Nettoyage: 'bg-blue-50 text-blue-700',
  Sécurité: 'bg-purple-50 text-purple-700',
  Ascenseur: 'bg-amber-50 text-amber-700',
}

export function Services() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Service Tracking" subtitle="Suivi des prestataires extérieurs"
        actions={<Button size="sm" className="gap-1.5 text-xs"><Plus size={13}/>Ajouter prestataire</Button>}
      />
      <div className="flex-1 p-6 space-y-4 animate-fade-in">
        <div className="grid gap-4">
          {mockServices.map(s => {
            const paidPct = Math.round((s.amountPaid / s.contractAmount) * 100)
            return (
              <Card key={s.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Wrench size={18} className="text-muted-foreground"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{s.company}</h3>
                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', typeColors[s.type]||'bg-gray-50 text-gray-700')}>{s.type}</span>
                        <Badge variant={s.status==='ACTIVE'?'success':'warning'}>{s.status==='ACTIVE'?'Actif':'En attente'}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                        <span>Contrat: {formatDate(s.contractStart)} → {formatDate(s.contractEnd)}</span>
                        <span className="flex items-center gap-1"><Phone size={11}/>{s.contact}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                        <div className="p-2 rounded-lg bg-muted/40">
                          <p className="text-xs font-bold">{formatCurrency(s.contractAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">Contrat total</p>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50">
                          <p className="text-xs font-bold text-emerald-600">{formatCurrency(s.amountPaid)}</p>
                          <p className="text-[10px] text-muted-foreground">Payé</p>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-50">
                          <p className="text-xs font-bold text-amber-600">{formatCurrency(s.amountRemaining)}</p>
                          <p className="text-[10px] text-muted-foreground">Restant</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px] text-muted-foreground">Progression paiement</span>
                          <span className="text-[11px] font-medium">{paidPct}%</span>
                        </div>
                        <Progress value={paidPct} className="h-1.5"/>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5"><FileText size={12}/>Contrat</Button>
                      <Button size="sm" className="text-xs h-8">Facture</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
