import { toast } from '../useToast'

export const toastSuccess = (message: string, description?: string) =>
  toast({ variant: 'success', title: message, description })

export const toastCreated = (entity: string) =>
  toast({ variant: 'success', title: `تم إضافة ${entity}`, description: 'تمت العملية بنجاح' })

export const toastUpdated = (entity: string) =>
  toast({ variant: 'success', title: `تم تحديث ${entity}`, description: 'تم حفظ التغييرات' })

export const toastDeleted = (entity: string) =>
  toast({ variant: 'success', title: `تم حذف ${entity}`, description: 'تمت عملية الحذف بنجاح' })

export const toastSaved = () =>
  toast({ variant: 'success', title: 'تم الحفظ', description: 'تم حفظ البيانات بنجاح' })

export const toastCopied = () =>
  toast({ variant: 'success', title: 'تم النسخ', duration: 2000 })
