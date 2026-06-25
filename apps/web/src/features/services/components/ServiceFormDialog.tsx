import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ApiService } from '@/lib/services.api'

const SERVICE_TYPES = [
  'Nettoyage', 'Sécurité', 'Ascenseur', 'Plomberie',
  'Électricité', 'Jardinage', 'Peinture',
]

interface ServiceFormDialogProps {
  open:      boolean
  service:   ApiService | null
  isPending: boolean
  onClose:   () => void
  onSubmit:  (data: { name: string; type: string; phone: string; email: string }) => void
}

export function ServiceFormDialog({ open, service, isPending, onClose, onSubmit }: ServiceFormDialogProps) {
  const { t } = useTranslation()
  const [name,  setName]  = useState('')
  const [type,  setType]  = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (open) {
      setName(service?.name ?? '')
      setType(service?.type ?? '')
      setPhone(service?.contact_info?.phone ?? '')
      setEmail(service?.contact_info?.email ?? '')
    }
  }, [open, service])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), type: type.trim(), phone: phone.trim(), email: email.trim() })
  }

  const isEdit = !!service

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle className="text-base font-semibold mb-4">
          {isEdit ? t('services.editService') : t('services.createService')}
        </DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('services.providerName')} *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('services.serviceType')}</label>
            <input
              list="service-types"
              value={type}
              onChange={e => setType(e.target.value)}
              placeholder={t('services.serviceTypePlaceholder')}
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
            <datalist id="service-types">
              {SERVICE_TYPES.map(st => <option key={st} value={st} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t('services.phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t('services.email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('services.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim() || isPending}>
              {isPending && <Loader2 size={13} className="animate-spin mr-1" />}
              {t('services.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
