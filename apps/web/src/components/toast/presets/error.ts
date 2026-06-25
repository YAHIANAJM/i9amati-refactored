import { toast } from '../useToast'
import i18n from '@/lib/i18n'
export const toastError = (message: string, description?: string) =>
  toast({ variant: 'error', title: message, description })

export const toastNotFound = (resource = i18n.t('errors.title.NOT_FOUND')) =>
  toast({ variant: 'error', title: `${resource}`, description: i18n.t('errors.codes.NOT_FOUND') })

export const toastUnauthorized = () =>
  toast({ variant: 'error', title: i18n.t('errors.title.UNAUTHORIZED'), description: i18n.t('errors.codes.UNAUTHORIZED') })

export const toastForbidden = () =>
  toast({ variant: 'error', title: i18n.t('errors.title.FORBIDDEN'), description: i18n.t('errors.codes.FORBIDDEN') })

export const toastApiError = (err: unknown, fallbackTitle?: string) => {
  const e = err as { error?: { message?: string; code?: string }; message?: string } | null

  const code = e?.error?.code
  const msg  = e?.error?.message ?? e?.message ?? i18n.t('errors.codes.INTERNAL_ERROR')

  // VALIDATION_ERROR: msg is '|'-joined translation keys from shared Zod schemas
  if (code === 'VALIDATION_ERROR') {
    const description = msg
      .split('|')
      .map(k => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = i18n.t(k as any) as string
        return t !== k ? t : i18n.t('errors.codes.VALIDATION_ERROR')
      })
      .join('. ')
    return toast({ variant: 'warning', title: i18n.t('errors.title.VALIDATION_ERROR'), description })
  }
  // CONFLICT: msg is a translation key (e.g. 'conflict.amountBelowPaid')
  if (code === 'CONFLICT') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = i18n.t(msg as any) as string
    return toast({ variant: 'error', title: i18n.t('errors.title.CONFLICT'), description: t !== msg ? t : i18n.t('errors.codes.CONFLICT') })
  }
  // NOT_FOUND: server string is English — always use the generic i18n message
  if (code === 'NOT_FOUND') return toast({ variant: 'error', title: i18n.t('errors.title.NOT_FOUND'), description: i18n.t('errors.codes.NOT_FOUND') })
  if (code === 'UNAUTHORIZED')     return toastUnauthorized()
  if (code === 'FORBIDDEN')        return toastForbidden()

  // Domain-specific codes defined in errors.codes translations
  if (code) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translatedMsg = i18n.t(`errors.codes.${code}` as any) as string
    if (translatedMsg !== `errors.codes.${code}`) {
      return toast({ variant: 'error', title: fallbackTitle || i18n.t('errors.title.error'), description: translatedMsg })
    }
  }

  return toast({ variant: 'error', title: fallbackTitle || i18n.t('errors.title.error'), description: msg })
}
