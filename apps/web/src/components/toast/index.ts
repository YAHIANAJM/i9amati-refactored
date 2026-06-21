export { toast, dismissToast, useToast } from './useToast'
export type { ToastItem, ToastVariant } from './useToast'
export { Toaster } from './Toaster'

// error presets  (bottom-right)
export { toastError, toastNotFound, toastUnauthorized, toastForbidden, toastApiError } from './presets/error'

// success presets  (bottom-right)
export { toastSuccess, toastCreated, toastUpdated, toastDeleted, toastSaved, toastCopied } from './presets/success'

// validation presets  (bottom-right)
export { toastValidation, toastRequired, toastInvalidFormat, toastFieldErrors } from './presets/validation'

// confirmation presets  (top-right)
export { toastConfirmation, toastPaymentConfirmed, toastMeetingScheduled, toastInviteSent } from './presets/confirmation'
