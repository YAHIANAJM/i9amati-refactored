import { toast } from '../useToast'

export const toastValidation = (message: string) =>
  toast({ variant: 'warning', title: 'تحقق من البيانات', description: message })

export const toastRequired = (field: string) =>
  toast({ variant: 'warning', title: 'حقل مطلوب', description: `${field} مطلوب` })

export const toastInvalidFormat = (field: string) =>
  toast({ variant: 'warning', title: 'تنسيق غير صحيح', description: `${field} غير صالح` })

export const toastFieldErrors = (errors: Record<string, string>) => {
  const first = Object.values(errors)[0]
  return toast({ variant: 'warning', title: 'بيانات غير مكتملة', description: first })
}
