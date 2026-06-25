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

  const code   = e?.error?.code
  const msg    = e?.error?.message ?? e?.message ?? i18n.t('errors.codes.INTERNAL_ERROR')

  if (code) {
    const translationKey = `errors.codes.${code}` as any
    const translatedMsg = i18n.t(translationKey) as string
    if (translatedMsg !== translationKey) {
      return toast({ variant: 'error', title: fallbackTitle || i18n.t('errors.title.error'), description: translatedMsg })
    }
  }

  if (code === 'NOT_FOUND')         return toastNotFound()
  if (code === 'UNAUTHORIZED')      return toastUnauthorized()
  if (code === 'FORBIDDEN')         return toastForbidden()
  if (code === 'CONFLICT')          return toast({ variant: 'error', title: i18n.t('errors.title.CONFLICT'), description: msg })
  if (code === 'VALIDATION_ERROR')  return toast({ variant: 'warning', title: i18n.t('errors.title.VALIDATION_ERROR'), description: msg })

  return toast({ variant: 'error', title: fallbackTitle || i18n.t('errors.title.error'), description: msg })
}
