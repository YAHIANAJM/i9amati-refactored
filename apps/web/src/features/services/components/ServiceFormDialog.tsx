import { useState, useEffect, useRef, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Check, Paperclip, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toastCreated, toastUpdated, toastApiError, toastConfirmation } from '@/components/toast'
import { servicesApi } from '@/lib/services.api'
import type { ApiService, ServiceContractStatus } from '@/lib/services.api'
import { z } from 'zod'
import { CreateServiceSchema, UpdateServiceSchema, CreateContractSchema } from '@i9amati/shared'

const SERVICE_TYPES = [
  'Nettoyage', 'Sécurité', 'Ascenseur', 'Plomberie', 'Électricité', 'Jardinage', 'Peinture',
]
const STATUSES: ServiceContractStatus[] = ['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED']

type WizardStep = 'provider' | 'contract' | 'documents'

interface Props {
  open: boolean
  service: ApiService | null
  onClose: () => void
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const WIZARD_STEPS: {
  key: WizardStep
  labelKey: 'services.stepProvider' | 'services.stepContract' | 'services.stepDocuments'
  optional: boolean
}[] = [
    { key: 'provider', labelKey: 'services.stepProvider', optional: false },
    { key: 'contract', labelKey: 'services.stepContract', optional: true },
    { key: 'documents', labelKey: 'services.stepDocuments', optional: true },
  ]

function StepIndicator({ current }: { current: WizardStep }) {
  const { t } = useTranslation()
  const currentIdx = WIZARD_STEPS.findIndex(s => s.key === current)
  return (
    <div className="flex items-start justify-center mb-6">
      {WIZARD_STEPS.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 w-24">
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all',
                done && 'bg-primary border-primary text-primary-foreground',
                active && 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20',
                !done && !active && 'bg-background border-muted-foreground/35',
              )}>
                {done && <Check size={12} strokeWidth={2.5} className="text-primary-foreground" />}
              </div>
              <span className={cn(
                'text-[11px] font-medium text-center leading-tight',
                active ? 'text-primary' : '',
                done ? 'text-foreground/70' : '',
                !done && !active ? 'text-muted-foreground' : '',
              )}>
                {t(step.labelKey)}
                {step.optional && (
                  <span className={cn(
                    'block text-[10px] font-normal',
                    active ? 'text-primary/70' : 'text-muted-foreground/70',
                  )}>
                    {t('services.stepOptional')}
                  </span>
                )}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={cn(
                'h-[2px] w-8 mt-3 mx-1 shrink-0 transition-colors',
                i < currentIdx ? 'bg-primary' : 'bg-muted-foreground/20',
              )} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background'

function buildContactInfo(phone: string, email: string) {
  return (phone || email) ? { phone: phone || undefined, email: email || undefined } : null
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ServiceFormDialog({ open, service, onClose }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEdit = !!service

  // Provider fields
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Wizard state
  const [step, setStep] = useState<WizardStep>('provider')
  const [contractName, setContractName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [contractStatus, setContractStatus] = useState<ServiceContractStatus>('PENDING')
  const [files, setFiles] = useState<File[]>([])

  // IDs of entities already saved in this wizard session
  const [savedServiceId, setSavedServiceId] = useState<string | null>(null)
  const [savedContractId, setSavedContractId] = useState<string | null>(null)

  const [isPending, setIsPending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(service?.name ?? '')
      setType(service?.type ?? '')
      setPhone(service?.contact_info?.phone ?? '')
      setEmail(service?.contact_info?.email ?? '')
      if (!service) {
        setStep('provider')
        setContractName('')
        setDescription('')
        setAmount('')
        setStartDate('')
        setEndDate('')
        setContractStatus('PENDING')
        setFiles([])
        setSavedServiceId(null)
        setSavedContractId(null)
      }
    }
  }, [open, service])

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['services'] })
  }

  const providerValid = name.trim().length > 0
  const amountNum = parseFloat(amount)
  const datesValid = !!(startDate && endDate && endDate >= startDate)
  const contractFilled = !!(contractName.trim() && amount && !isNaN(amountNum) && amountNum >= 0 && datesValid)

  // ── Edit mode ──────────────────────────────────────────────────────────────

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!service || !providerValid) return
    try {
      const payload = {
        name: name.trim(),
        type: type || null,
        contact_info: buildContactInfo(phone, email),
      }
      UpdateServiceSchema.parse(payload)
      
      toastConfirmation(
        t('services.confirmUpdate', 'Êtes-vous sûr de vouloir mettre à jour?'),
        t('services.confirmUpdateDesc', 'Cette action va modifier les données.'),
        {
          label: t('services.confirm', 'Confirmer'),
          onClick: async () => {
            setIsPending(true)
            try {
              await servicesApi.update(service.id, payload)
              invalidate()
              toastUpdated(t('services.updated'))
              onClose()
            } catch (err) {
              toastApiError(err)
            } finally {
              setIsPending(false)
            }
          }
        },
        t('services.cancel', 'Annuler')
      )
    } catch (err) {
      if (err instanceof z.ZodError) {
        toastApiError({ error: { code: 'VALIDATION_ERROR', message: err.errors.map(e => e.message).join('|') } })
      } else {
        toastApiError(err)
      }
      setIsPending(false)
    }
  }

  // ── Wizard: Provider → save service, go to Contract ───────────────────────

  async function handleProviderNext() {
    if (!providerValid) return
    setIsPending(true)
    try {
      const payload = {
        name: name.trim(),
        type: type || null,
        contact_info: buildContactInfo(phone, email),
      }
      if (savedServiceId) {
        UpdateServiceSchema.parse(payload)
        await servicesApi.update(savedServiceId, payload)
      } else {
        CreateServiceSchema.parse(payload)
        const svc = await servicesApi.create(payload)
        setSavedServiceId(svc.id)
      }
      invalidate()
      setStep('contract')
    } catch (err) {
      if (err instanceof z.ZodError) {
        toastApiError({ error: { code: 'VALIDATION_ERROR', message: err.errors.map(e => e.message).join('|') } })
      } else {
        toastApiError(err)
      }
    } finally {
      setIsPending(false)
    }
  }

  // ── Wizard: Contract → save contract, go to Documents ─────────────────────

  async function handleContractNext() {
    if (!contractFilled || !savedServiceId) return
    setIsPending(true)
    try {
      const payload = {
        name: contractName.trim(),
        description: description.trim() || null,
        amount: amountNum,
        start_date: startDate,
        end_date: endDate,
        status: contractStatus,
      }
      CreateContractSchema.parse(payload)
      if (savedContractId) {
        await servicesApi.updateContract(savedServiceId, savedContractId, payload)
      } else {
        const contract = await servicesApi.addContract(savedServiceId, payload)
        setSavedContractId(contract.id)
      }
      invalidate()
      setStep('documents')
    } catch (err) {
      if (err instanceof z.ZodError) {
        toastApiError({ error: { code: 'VALIDATION_ERROR', message: err.errors.map(e => e.message).join('|') } })
      } else {
        toastApiError(err)
      }
    } finally {
      setIsPending(false)
    }
  }

  // ── Wizard: skip contract step, service already saved ─────────────────────

  function handleSkipAndClose() {
    invalidate()
    toastCreated(t('services.created'))
    onClose()
  }

  // ── Wizard: Documents → attach files, done ────────────────────────────────

  async function handleDocumentsSave() {
    if (!savedServiceId || !savedContractId) return
    setIsPending(true)
    try {
      if (files.length > 0) {
        await Promise.all(files.map(f => servicesApi.attachFile(savedServiceId!, savedContractId!, f)))
        invalidate()
      }
      toastCreated(t('services.created'))
      onClose()
    } catch (err) {
      toastApiError(err)
    } finally {
      setIsPending(false)
    }
  }

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    e.target.value = ''
  }

  // Ensure cache is fresh if dialog is closed mid-wizard after service was created
  function handleOpenChange(v: boolean) {
    if (!v) {
      if (savedServiceId) invalidate()
      onClose()
    }
  }

  // ── Edit mode: single-step form ────────────────────────────────────────────

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md p-6">
          <DialogTitle className="text-base font-semibold mb-4">{t('services.editService')}</DialogTitle>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <Field label={`${t('services.providerName')} *`}>
              <input value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
            </Field>
            <Field label={t('services.serviceType')}>
              <input list="svc-types-edit" value={type} onChange={e => setType(e.target.value)}
                placeholder={t('services.serviceTypePlaceholder')} className={inputCls} />
              <datalist id="svc-types-edit">
                {SERVICE_TYPES.map(s => <option key={s} value={s} />)}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('services.phone')}>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t('services.email')}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>{t('services.cancel')}</Button>
              <Button type="submit" size="sm" disabled={!providerValid || isPending}>
                {isPending && <Loader2 size={13} className="animate-spin mr-1" />}
                {t('services.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Create mode: multi-step wizard ─────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogTitle className="text-base font-semibold mb-2">{t('services.createService')}</DialogTitle>

        <StepIndicator current={step} />

        {/* ── Step: Provider ── */}
        {step === 'provider' && (
          <div className="space-y-3">
            <Field label={`${t('services.providerName')} *`}>
              <input value={name} onChange={e => setName(e.target.value)} autoFocus className={inputCls} />
            </Field>
            <Field label={t('services.serviceType')}>
              <input list="svc-types-wiz" value={type} onChange={e => setType(e.target.value)}
                placeholder={t('services.serviceTypePlaceholder')} className={inputCls} />
              <datalist id="svc-types-wiz">
                {SERVICE_TYPES.map(s => <option key={s} value={s} />)}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('services.phone')}>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t('services.email')}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>{t('services.cancel')}</Button>
              <Button type="button" size="sm" disabled={!providerValid || isPending} onClick={handleProviderNext}>
                {isPending && <Loader2 size={13} className="animate-spin mr-1" />}
                {t('services.next')} <ChevronRight size={13} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Contract ── */}
        {step === 'contract' && (
          <div className="space-y-3">
            <Field label={`${t('services.contractName')} *`}>
              <input value={contractName} onChange={e => setContractName(e.target.value)} autoFocus className={inputCls} />
            </Field>
            <Field label={t('services.description')}>
              <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                className={cn(inputCls, 'resize-none')} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`${t('services.amount')} *`}>
                <input type="number" min={0} step="0.01" value={amount}
                  onChange={e => setAmount(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t('services.status')}>
                <select value={contractStatus}
                  onChange={e => setContractStatus(e.target.value as ServiceContractStatus)}
                  className={inputCls}>
                  {STATUSES.map(s => <option key={s} value={s}>{t(`services.status_${s}`)}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`${t('services.startDate')} *`}>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label={`${t('services.endDate')} *`}>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className={cn(inputCls, startDate && endDate && endDate < startDate ? 'border-destructive focus:ring-destructive' : '')} />
              </Field>
            </div>
            {startDate && endDate && endDate < startDate && (
              <p className="text-xs text-destructive">{t('validation.date.endBeforeStart')}</p>
            )}
            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => setStep('provider')}>
                <ChevronLeft size={13} className="mr-1" /> {t('services.back')}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleSkipAndClose}>
                  {t('services.skipAndSave')}
                </Button>
                <Button type="button" size="sm" disabled={!contractFilled || isPending} onClick={handleContractNext}>
                  {isPending && <Loader2 size={13} className="animate-spin mr-1" />}
                  {t('services.next')} <ChevronRight size={13} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step: Documents ── */}
        {step === 'documents' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t('services.documentsFor', { contract: contractName })}
            </p>

            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={addFiles} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-lg p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Paperclip size={14} />
              {t('services.clickToAttach')}
            </button>

            {files.length > 0 && (
              <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-1.5 text-xs">
                    <span className="truncate max-w-[65%] font-medium">{f.name}</span>
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                      <span>{(f.size / 1024).toFixed(0)} KB</span>
                      <button type="button"
                        onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="hover:text-destructive transition-colors ml-1">
                        <X size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => setStep('contract')}>
                <ChevronLeft size={13} className="mr-1" /> {t('services.back')}
              </Button>
              <Button type="button" size="sm" disabled={isPending} onClick={handleDocumentsSave}>
                {isPending && <Loader2 size={13} className="animate-spin mr-1" />}
                {files.length > 0 ? t('services.saveWithFiles') : t('services.save')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
