import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface KpiRowProps {
  totalContracts: number
  totalPaid:      number
  totalRemaining: number
  activeCount:    number
  pendingCount:   number
}

export function KpiRow({ totalContracts, totalPaid, totalRemaining, activeCount, pendingCount }: KpiRowProps) {
  const { t } = useTranslation()

  const kpis = [
    { label: t('serviceAnalytics.kpi.totalContracts'), value: formatCurrency(totalContracts), color: 'text-foreground' },
    { label: t('serviceAnalytics.kpi.totalPaid'),      value: formatCurrency(totalPaid),      color: 'text-emerald-600' },
    { label: t('serviceAnalytics.kpi.totalRemaining'), value: formatCurrency(totalRemaining), color: 'text-amber-600' },
    { label: t('serviceAnalytics.kpi.activeContracts'),value: String(activeCount),            color: 'text-blue-600' },
    { label: t('serviceAnalytics.kpi.pendingContracts'),value: String(pendingCount),          color: 'text-yellow-600' },
  ]

  return (
    <div className="grid grid-cols-5 gap-4">
      {kpis.map(k => (
        <Card key={k.label}>
          <CardContent className="p-4 text-center">
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
