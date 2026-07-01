import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { ApiServiceContract } from '@/lib/services.api'
import { z } from 'zod'
import { RecordPaymentSchema } from '@i9amati/shared'
import { toastApiError } from '@/components/toast'

interface PaymentDialogProps {
  open:      boolean
  contract:  ApiServiceContract | null
  isPending: boolean
  onClose:   () => void
  onSubmit:  (amount: number) => void
}

export function PaymentDialog({ open, contract, isPending, onClose, onSubmit }: PaymentDialogProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (open) setAmount('')
  }, [open])

  const remaining = contract ? contract.amount - contract.amount_paid : 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) return
    try {
      RecordPaymentSchema.parse({ amount: parsed })
      onSubmit(parsed)
    } catch (err) {
      if (err instanceof z.ZodError) {
        toastApiError({ error: { code: 'VALIDATION_ERROR', message: err.errors.map(e => e.message).join('|') } })
      } else {
        toastApiError(err)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm p-6">
        <DialogTitle className="text-base font-semibold mb-1">
          {t('services.recordPayment')}
        </DialogTitle>
        {contract && (
          <p className="text-xs text-muted-foreground mb-4">
            {contract.name} — {t('services.remaining')}: {formatCurrency(remaining)}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('services.paymentAmount')} (MAD) *</label>
            <input
              type="number"
              min={0.01}
              max={remaining}
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
              required
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('services.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={!amount || isPending}>
              {isPending && <Loader2 size={13} className="animate-spin mr-1" />}
              {t('services.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
