import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { paymentPercent } from '../../services/utils'

interface ProgressEntry {
  label: string
  paid:  number
  total: number
}

interface PaymentProgressListProps {
  entries: ProgressEntry[]
}

export function PaymentProgressList({ entries }: PaymentProgressListProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t('serviceAnalytics.charts.paymentProgress')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground">{t('services.noServicesYet')}</p>
        )}
        {entries.map(e => {
          const pct = paymentPercent(e.paid, e.total)
          return (
            <div key={e.label}>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium truncate max-w-[70%]">{e.label}</span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
