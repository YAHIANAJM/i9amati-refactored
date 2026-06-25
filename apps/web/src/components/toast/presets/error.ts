import { toast } from '../useToast'

export const toastError = (message: string, description?: string) =>
  toast({ variant: 'error', title: message, description })

export const toastNotFound = (resource = 'العنصر') =>
  toast({ variant: 'error', title: `${resource} غير موجود`, description: 'تحقق من البيانات وحاول مرة أخرى' })

export const toastUnauthorized = () =>
  toast({ variant: 'error', title: 'غير مصرح', description: 'يرجى تسجيل الدخول أولاً' })

export const toastForbidden = () =>
  toast({ variant: 'error', title: 'ممنوع الوصول', description: 'ليس لديك صلاحية لهذا الإجراء' })

export const toastApiError = (err: unknown, fallbackTitle = 'خطأ') => {
  const e = err as { error?: { message?: string; code?: string }; message?: string } | null

  const code   = e?.error?.code
  const msg    = e?.error?.message ?? e?.message ?? 'حدث خطأ غير متوقع'

  if (code === 'NOT_FOUND')         return toastNotFound()
  if (code === 'UNAUTHORIZED')      return toastUnauthorized()
  if (code === 'FORBIDDEN')         return toastForbidden()
  if (code === 'CONFLICT')          return toast({ variant: 'error', title: 'تعارض في البيانات', description: msg })
  if (code === 'VALIDATION_ERROR')  return toast({ variant: 'warning', title: 'بيانات غير صالحة', description: msg })

  return toast({ variant: 'error', title: fallbackTitle, description: msg })
}
