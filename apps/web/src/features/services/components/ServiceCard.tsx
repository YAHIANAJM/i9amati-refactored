import { Phone, Plus, Pencil, Trash2, Wrench, CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { ApiService, ApiServiceContract } from '@/lib/services.api'
import { getStatusVariant, getTypeColorClass, paymentPercent } from '../utils'

interface ServiceCardProps {
  service:           ApiService
  isSyndic:          boolean
  onEdit:            (service: ApiService) => void
  onDelete:          (service: ApiService) => void
  onAddContract:     (service: ApiService) => void
  onEditContract:    (service: ApiService, contract: ApiServiceContract) => void
  onDeleteContract:  (service: ApiService, contract: ApiServiceContract) => void
  onRecordPayment:   (service: ApiService, contract: ApiServiceContract) => void
}

export function ServiceCard({
  service, isSyndic,
  onEdit, onDelete, onAddContract,
  onEditContract, onDeleteContract, onRecordPayment,
}: ServiceCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-5 space-y-4">
        {/* Service header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
            <Wrench size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{service.name}</h3>
              {service.type && (
                <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', getTypeColorClass(service.type))}>
                  {service.type}
                </span>
              )}
            </div>
            {service.contact_info?.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Phone size={11} /> {service.contact_info.phone}
              </span>
            )}
          </div>
          {isSyndic && (
            <div className="flex gap-1.5 shrink-0">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(service)}>
                <Pencil size={13} />
              </Button>
              <Button
                variant="ghost" size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(service)}
              >
                <Trash2 size={13} />
              </Button>
            </div>
          )}
        </div>

        {/* Contracts */}
        {service.contracts.length > 0 ? (
          <div className="space-y-3">
            {service.contracts.map(c => (
              <ContractRow
                key={c.id}
                contract={c}
                isSyndic={isSyndic}
                onEdit={() => onEditContract(service, c)}
                onDelete={() => onDeleteContract(service, c)}
                onPay={() => onRecordPayment(service, c)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            {t('services.noContractsYet')}
          </p>
        )}

        {isSyndic && (
          <Button
            variant="outline" size="sm"
            className="w-full h-8 gap-1.5 text-xs border-dashed"
            onClick={() => onAddContract(service)}
          >
            <Plus size={12} /> {t('services.addContract')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface ContractRowProps {
  contract:  ApiServiceContract
  isSyndic:  boolean
  onEdit:    () => void
  onDelete:  () => void
  onPay:     () => void
}

function ContractRow({ contract, isSyndic, onEdit, onDelete, onPay }: ContractRowProps) {
  const { t } = useTranslation()
  const pct = paymentPercent(contract.amount_paid, contract.amount)
  const remaining = contract.amount - contract.amount_paid

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{contract.name}</p>
          {(contract.start_date || contract.end_date) && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {contract.start_date ? formatDate(contract.start_date) : '—'}
              {' → '}
              {contract.end_date ? formatDate(contract.end_date) : '—'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={getStatusVariant(contract.status)} className="text-[10px] h-5">
            {t(`services.status_${contract.status}`)}
          </Badge>
          {isSyndic && (
            <>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEdit}>
                <Pencil size={11} />
              </Button>
              <Button
                variant="ghost" size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 size={11} />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-1.5 rounded-md bg-background border">
          <p className="text-[11px] font-bold">{formatCurrency(contract.amount)}</p>
          <p className="text-[9px] text-muted-foreground">{t('services.totalContract')}</p>
        </div>
        <div className="p-1.5 rounded-md bg-emerald-50">
          <p className="text-[11px] font-bold text-emerald-600">{formatCurrency(contract.amount_paid)}</p>
          <p className="text-[9px] text-muted-foreground">{t('services.paid')}</p>
        </div>
        <div className="p-1.5 rounded-md bg-amber-50">
          <p className="text-[11px] font-bold text-amber-600">{formatCurrency(remaining)}</p>
          <p className="text-[9px] text-muted-foreground">{t('services.remaining')}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">{t('services.paymentProgress')}</span>
          <span className="text-[10px] font-medium">{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      {isSyndic && remaining > 0 && (
        <Button
          size="sm"
          className="w-full h-7 gap-1.5 text-[11px]"
          onClick={onPay}
        >
          <CreditCard size={11} /> {t('services.recordPayment')}
        </Button>
      )}
    </div>
  )
}
