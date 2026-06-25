import { toast } from '../useToast'
import i18n from '@/lib/i18n'

export const toastSuccess = (message: string, description?: string) =>
  toast({ variant: 'success', title: message, description })

export const toastCreated = (title: string = i18n.t('success.generic')) =>
  toast({ variant: 'success', title, description: i18n.t('success.generic') })

export const toastUpdated = (title: string = i18n.t('success.generic')) =>
  toast({ variant: 'success', title, description: i18n.t('success.generic') })

export const toastDeleted = (title: string = i18n.t('success.generic')) =>
  toast({ variant: 'success', title, description: i18n.t('success.generic') })

export const toastSaved = () =>
  toast({ variant: 'success', title: i18n.t('success.generic'), description: i18n.t('success.generic') })

export const toastCopied = () =>
  toast({ variant: 'success', title: i18n.t('success.generic'), duration: 2000 })
