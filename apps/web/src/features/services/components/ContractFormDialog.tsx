import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ApiServiceContract, ServiceContractStatus } from '@/lib/services.api'
import { z } from 'zod'
import { CreateContractSchema, UpdateContractSchema } from '@i9amati/shared'
import { toastApiError } from '@/components/toast'

const STATUSES: ServiceContractStatus[] = ['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED']

function toDateInput(v: string | null | undefined): string {
  if (!v) return ''
  return v.slice(0, 10)
}

interface ContractFormDialogProps {
  open:       boolean
  contract:   ApiServiceContract | null
  isPending:  boolean
  onClose:    () => void
  onSubmit:   (data: {
    name:         string
    description:  string
    amount:       number
    amount_paid?: number
    start_date:   string
    end_date:     string
    status:       ServiceContractStatus
  }) => void
}

export function ContractFormDialog({ open, contract, isPending, onClose, onSubmit }: ContractFormDialogProps) {
  const { t } = useTranslation()
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [amountPaid,  setAmountPaid]  = useState('')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')
  const [status,      setStatus]      = useState<ServiceContractStatus>('PENDING')

  useEffect(() => {
    if (open) {
      setName(contract?.name ?? '')
      setDescription(contract?.description ?? '')
      setAmount(contract?.amount !== undefined ? String(contract.amount) : '')
      setAmountPaid(contract?.amount_paid !== undefined ? String(contract.amount_paid) : '')
      setStartDate(toDateInput(contract?.start_date))
      setEndDate(toDateInput(contract?.end_date))
      setStatus(contract?.status ?? 'PENDING')
    }
  }, [open, contract])

  const dateOrderError = !!(startDate && endDate && endDate < startDate)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!name.trim() || isNaN(parsed) || parsed < 0 || !startDate || !endDate || dateOrderError) return
    const parsedPaid = amountPaid !== '' ? parseFloat(amountPaid) : undefined
    const payload = {
      name:         name.trim(),
      description:  description.trim() || null,
      amount:       parsed,
      amount_paid:  parsedPaid !== undefined && !isNaN(parsedPaid) ? parsedPaid : undefined,
      start_date:   startDate,
      end_date:     endDate,
      status,
    }

    try {
      if (isEdit) {
        UpdateContractSchema.parse(payload)
      } else {
        CreateContractSchema.parse(payload)
      }
      // The parent expects description to be string, but payload uses string | null, wait, parent onSubmit is slightly different.
      // Let's pass the valid payload. But the onSubmit expects description as string.
      onSubmit({ ...payload, description: payload.description || '' })
    } catch (err) {
      if (err instanceof z.ZodError) {
        toastApiError({ error: { code: 'VALIDATION_ERROR', message: err.errors.map(e => e.message).join('|') } })
      } else {
        toastApiError(err)
      }
    }
  }

  const isEdit = !!contract

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle className="text-base font-semibold mb-4">
          {isEdit ? t('services.editContract') : t('services.addContract')}
        </DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('services.contractName')} *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('services.description')}</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full resize-none text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t('services.amount')} *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
            </div>
            {isEdit ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('services.paymentAmount')}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('services.status')}</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as ServiceContractStatus)}
                  className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{t(`services.status_${s}`)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isEdit && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t('services.status')}</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ServiceContractStatus)}
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{t(`services.status_${s}`)}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t('services.startDate')} *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t('services.endDate')} *</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={cn(
                  'w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 bg-background',
                  dateOrderError ? 'border-destructive focus:ring-destructive' : 'focus:ring-ring',
                )}
              />
            </div>
          </div>
          {dateOrderError && (
            <p className="text-xs text-destructive">{t('validation.date.endBeforeStart')}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('services.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim() || !amount || !startDate || !endDate || dateOrderError || isPending}>
              {isPending && <Loader2 size={13} className="animate-spin mr-1" />}
              {t('services.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
