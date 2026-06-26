import { useTranslation } from 'react-i18next'
import { Plus, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ServiceCard } from '../components/ServiceCard'
import type { ApiService, ApiServiceContract } from '@/lib/services.api'

interface ServicesGridProps {
  services:         ApiService[]
  isLoading:        boolean
  isError:          boolean
  isSyndic:         boolean
  onCreateService:  () => void
  onEdit:           (service: ApiService) => void
  onDelete:         (service: ApiService) => void
  onAddContract:    (service: ApiService) => void
  onEditContract:   (service: ApiService, contract: ApiServiceContract) => void
  onDeleteContract: (service: ApiService, contract: ApiServiceContract) => void
  onRecordPayment:  (service: ApiService, contract: ApiServiceContract) => void
  onAttachFile:     (service: ApiService, contract: ApiServiceContract, file: File) => void
  onRemoveFile:     (service: ApiService, contract: ApiServiceContract, docId: string) => void
  onTrackStaff:     (service: ApiService) => void
}

export function ServicesGrid({
  services, isLoading, isError, isSyndic,
  onCreateService, onEdit, onDelete,
  onAddContract, onEditContract, onDeleteContract, onRecordPayment,
  onAttachFile, onRemoveFile, onTrackStaff
}: ServicesGridProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-5">
            <div className="flex gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-2 w-20 rounded bg-muted" />
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-8 text-center">{t('services.loadError')}</p>
    )
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
          <Wrench size={24} className="text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">{t('services.noServicesYet')}</p>
          <p className="text-xs text-muted-foreground">{t('services.addFirstService')}</p>
        </div>
        {isSyndic && (
          <Button size="sm" className="gap-1.5" onClick={onCreateService}>
            <Plus size={13} /> {t('services.createService')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {services.map(service => (
        <ServiceCard
          key={service.id}
          service={service}
          isSyndic={isSyndic}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddContract={onAddContract}
          onEditContract={onEditContract}
          onDeleteContract={onDeleteContract}
          onRecordPayment={onRecordPayment}
          onAttachFile={(contract, file) => onAttachFile(service, contract, file)}
          onRemoveFile={(contract, docId) => onRemoveFile(service, contract, docId)}
          onTrackStaff={onTrackStaff}
        />
      ))}
    </div>
  )
}
