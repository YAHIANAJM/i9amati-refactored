import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { toastCreated, toastUpdated, toastDeleted, toastApiError } from '@/components/toast'
import { ProfileRole } from '@i9amati/shared'
import { servicesApi } from '@/lib/services.api'
import type { ApiService, ApiServiceContract, ServiceContractStatus, ServicesResponse } from '@/lib/services.api'
import { ServicesGrid } from './sections/ServicesGrid'
import { ServiceFormDialog } from './components/ServiceFormDialog'
import { ContractFormDialog } from './components/ContractFormDialog'
import { PaymentDialog } from './components/PaymentDialog'

// ── Dialog state helpers ───────────────────────────────────────────────────────

type ServiceDialog = { open: boolean; service: ApiService | null }
type ContractDialog = { open: boolean; service: ApiService | null; contract: ApiServiceContract | null }
type PaymentDialogState = { open: boolean; service: ApiService | null; contract: ApiServiceContract | null }

const CLOSED_SERVICE:  ServiceDialog  = { open: false, service: null }
const CLOSED_CONTRACT: ContractDialog = { open: false, service: null, contract: null }
const CLOSED_PAYMENT:  PaymentDialogState = { open: false, service: null, contract: null }

// ── Component ─────────────────────────────────────────────────────────────────

export function Services() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [serviceDialog,  setServiceDialog]  = useState<ServiceDialog>(CLOSED_SERVICE)
  const [contractDialog, setContractDialog] = useState<ContractDialog>(CLOSED_CONTRACT)
  const [paymentDialog,  setPaymentDialog]  = useState<PaymentDialogState>(CLOSED_PAYMENT)

  // ── Query ──────────────────────────────────────────────────────────────────

  const { data: servicesResponse, isLoading, isError } = useQuery({
    queryKey: ['services'],
    queryFn:  servicesApi.list,
  })

  const services  = servicesResponse?.services ?? []
  const isSyndic  = servicesResponse?.profileRole === ProfileRole.SYNDIC

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createService = useMutation({
    mutationFn: servicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toastCreated(t('services.created'))
      setServiceDialog(CLOSED_SERVICE)
    },
    onError: (err: unknown) => toastApiError(err),
  })

  const updateService = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof servicesApi.update>[1]) =>
      servicesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toastUpdated(t('services.updated'))
      setServiceDialog(CLOSED_SERVICE)
    },
    onError: (err: unknown) => toastApiError(err),
  })

  const deleteService = useMutation({
    mutationFn: servicesApi.remove,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['services'] })
      const prev = queryClient.getQueryData<ServicesResponse>(['services'])
      queryClient.setQueryData(['services'], (old: ServicesResponse | undefined) =>
        old ? { ...old, services: old.services.filter(s => s.id !== id) } : old,
      )
      return { prev }
    },
    onError: (err: unknown, _id: string, ctx: { prev: ServicesResponse | undefined } | undefined) => {
      if (ctx?.prev) queryClient.setQueryData(['services'], ctx.prev)
      toastApiError(err)
    },
    onSuccess: () => toastDeleted(t('services.deleted')),
  })

  const addContract = useMutation({
    mutationFn: ({ serviceId, ...payload }: { serviceId: string } & Parameters<typeof servicesApi.addContract>[1]) =>
      servicesApi.addContract(serviceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toastCreated(t('services.contractCreated'))
      setContractDialog(CLOSED_CONTRACT)
    },
    onError: (err: unknown) => toastApiError(err),
  })

  const updateContract = useMutation({
    mutationFn: ({ serviceId, contractId, ...payload }: { serviceId: string; contractId: string } & Parameters<typeof servicesApi.updateContract>[2]) =>
      servicesApi.updateContract(serviceId, contractId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['services'], (old: ServicesResponse | undefined) =>
        old ? { ...old, services: old.services.map(s => ({
          ...s,
          contracts: s.contracts.map(c => c.id === updated.id ? updated : c),
        }))} : old,
      )
      toastUpdated(t('services.contractUpdated'))
      setContractDialog(CLOSED_CONTRACT)
    },
    onError: (err: unknown) => toastApiError(err),
  })

  const deleteContract = useMutation({
    mutationFn: ({ serviceId, contractId }: { serviceId: string; contractId: string }) =>
      servicesApi.removeContract(serviceId, contractId),
    onMutate: async ({ serviceId, contractId }) => {
      await queryClient.cancelQueries({ queryKey: ['services'] })
      const prev = queryClient.getQueryData<ServicesResponse>(['services'])
      queryClient.setQueryData(['services'], (old: ServicesResponse | undefined) =>
        old ? { ...old, services: old.services.map(s => s.id === serviceId
          ? { ...s, contracts: s.contracts.filter(c => c.id !== contractId) }
          : s,
        )} : old,
      )
      return { prev }
    },
    onError: (err: unknown, _v: { serviceId: string; contractId: string }, ctx: { prev: ServicesResponse | undefined } | undefined) => {
      if (ctx?.prev) queryClient.setQueryData(['services'], ctx.prev)
      toastApiError(err)
    },
    onSuccess: () => toastDeleted(t('services.contractDeleted')),
  })

  const attachContractFile = useMutation({
    mutationFn: ({ serviceId, contractId, file }: { serviceId: string; contractId: string; file: File }) =>
      servicesApi.attachFile(serviceId, contractId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
    onError: (err: unknown) => toastApiError(err),
  })

  const removeContractFile = useMutation({
    mutationFn: ({ serviceId, contractId, docId }: { serviceId: string; contractId: string; docId: string }) =>
      servicesApi.removeFile(serviceId, contractId, docId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
    onError: (err: unknown) => toastApiError(err),
  })

  const recordPayment = useMutation({
    mutationFn: ({ serviceId, contractId, amount }: { serviceId: string; contractId: string; amount: number }) =>
      servicesApi.recordPayment(serviceId, contractId, amount),
    onSuccess: (updated) => {
      queryClient.setQueryData(['services'], (old: ServicesResponse | undefined) =>
        old ? { ...old, services: old.services.map(s => ({
          ...s,
          contracts: s.contracts.map(c => c.id === updated.id ? updated : c),
        }))} : old,
      )
      toastUpdated(t('services.paymentRecorded'))
      setPaymentDialog(CLOSED_PAYMENT)
    },
    onError: (err: unknown) => toastApiError(err),
  })

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleServiceSubmit(data: { name: string; type: string; phone: string; email: string }) {
    const payload = {
      name: data.name,
      type: data.type || null,
      contact_info: (data.phone || data.email)
        ? { phone: data.phone || undefined, email: data.email || undefined }
        : null,
    }
    if (serviceDialog.service) {
      updateService.mutate({ id: serviceDialog.service.id, ...payload })
    } else {
      createService.mutate(payload)
    }
  }

  function handleContractSubmit(data: {
    name: string; description: string; amount: number; amount_paid?: number
    start_date: string; end_date: string; status: ServiceContractStatus
  }) {
    const payload = {
      name:        data.name,
      description: data.description || null,
      amount:      data.amount,
      amount_paid: data.amount_paid,
      start_date:  data.start_date,
      end_date:    data.end_date,
      status:      data.status,
    }
    if (contractDialog.contract && contractDialog.service) {
      updateContract.mutate({ serviceId: contractDialog.service.id, contractId: contractDialog.contract.id, ...payload })
    } else if (contractDialog.service) {
      addContract.mutate({ serviceId: contractDialog.service.id, ...payload })
    }
  }

  function handlePaymentSubmit(amount: number) {
    if (!paymentDialog.service || !paymentDialog.contract) return
    recordPayment.mutate({ serviceId: paymentDialog.service.id, contractId: paymentDialog.contract.id, amount })
  }

  function handleAttachFile(service: ApiService, contract: ApiServiceContract, file: File) {
    attachContractFile.mutate({ serviceId: service.id, contractId: contract.id, file })
  }

  function handleRemoveFile(service: ApiService, contract: ApiServiceContract, docId: string) {
    removeContractFile.mutate({ serviceId: service.id, contractId: contract.id, docId })
  }

  const isServicePending  = createService.isPending || updateService.isPending
  const isContractPending = addContract.isPending || updateContract.isPending

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={t('services.pageTitle')}
        subtitle={t('services.pageSubtitle')}
        actions={
          isSyndic ? (
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setServiceDialog({ open: true, service: null })}>
              <Plus size={13} /> {t('services.addProvider')}
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6 animate-fade-in">
        <ServicesGrid
          services={services}
          isLoading={isLoading}
          isError={isError}
          isSyndic={isSyndic}
          onCreateService={() => setServiceDialog({ open: true, service: null })}
          onEdit={service => setServiceDialog({ open: true, service })}
          onDelete={service => deleteService.mutate(service.id)}
          onAddContract={service => setContractDialog({ open: true, service, contract: null })}
          onEditContract={(service, contract) => setContractDialog({ open: true, service, contract })}
          onDeleteContract={(service, contract) => deleteContract.mutate({ serviceId: service.id, contractId: contract.id })}
          onRecordPayment={(service, contract) => setPaymentDialog({ open: true, service, contract })}
          onAttachFile={handleAttachFile}
          onRemoveFile={handleRemoveFile}
        />
      </div>

      <ServiceFormDialog
        open={serviceDialog.open}
        service={serviceDialog.service}
        isPending={isServicePending}
        onClose={() => setServiceDialog(CLOSED_SERVICE)}
        onSubmit={handleServiceSubmit}
      />
      <ContractFormDialog
        open={contractDialog.open}
        contract={contractDialog.contract}
        isPending={isContractPending}
        onClose={() => setContractDialog(CLOSED_CONTRACT)}
        onSubmit={handleContractSubmit}
      />
      <PaymentDialog
        open={paymentDialog.open}
        contract={paymentDialog.contract}
        isPending={recordPayment.isPending}
        onClose={() => setPaymentDialog(CLOSED_PAYMENT)}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  )
}
