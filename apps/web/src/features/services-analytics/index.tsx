import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { TopBar } from '@/components/layout/TopBar'
import { servicesApi } from '@/lib/services.api'
import { KpiRow } from './components/KpiRow'
import { ContractFinancialChart } from './components/ContractFinancialChart'
import { PaymentProgressList } from './components/PaymentProgressList'
import { Card, CardContent } from '@/components/ui/card'

export function ServicesDash() {
  const { t } = useTranslation()

  const { data: servicesResponse, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn:  servicesApi.list,
  })

  // ── Derived analytics ──────────────────────────────────────────────────────

  const services     = servicesResponse?.services ?? []
  const allContracts = services.flatMap(s => s.contracts)

  const totalContracts  = allContracts.reduce((sum, c) => sum + c.amount, 0)
  const totalPaid       = allContracts.reduce((sum, c) => sum + c.amount_paid, 0)
  const totalRemaining  = totalContracts - totalPaid
  const activeCount     = allContracts.filter(c => c.status === 'ACTIVE').length
  const pendingCount    = allContracts.filter(c => c.status === 'PENDING').length

  const chartData = services.map(s => ({
    name:      s.name.split(' ')[0],
    paid:      s.contracts.reduce((sum, c) => sum + c.amount_paid, 0),
    remaining: s.contracts.reduce((sum, c) => sum + (c.amount - c.amount_paid), 0),
  }))

  const progressEntries = services.flatMap(s =>
    s.contracts.map(c => ({
      label: `${s.name} — ${c.name}`,
      paid:  c.amount_paid,
      total: c.amount,
    })),
  )

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title={t('serviceAnalytics.title')} subtitle={t('serviceAnalytics.subtitle')} />
        <div className="flex-1 p-6">
          <p className="text-sm text-muted-foreground">{t('serviceAnalytics.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title={t('serviceAnalytics.title')} subtitle={t('serviceAnalytics.subtitle')} />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        <KpiRow
          totalContracts={totalContracts}
          totalPaid={totalPaid}
          totalRemaining={totalRemaining}
          activeCount={activeCount}
          pendingCount={pendingCount}
        />

        {services.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t('services.noServicesYet')}
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            <ContractFinancialChart data={chartData} />
            <PaymentProgressList entries={progressEntries} />
          </div>
        )}

      </div>
    </div>
  )
}
