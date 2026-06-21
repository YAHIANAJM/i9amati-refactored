import { toast } from '../useToast'

export const toastConfirmation = (title: string, description?: string) =>
  toast({ variant: 'confirmation', title, description })

export const toastPaymentConfirmed = (amount: string) =>
  toast({ variant: 'confirmation', title: 'تم تأكيد الدفع', description: `المبلغ: ${amount}` })

export const toastMeetingScheduled = (date: string) =>
  toast({ variant: 'confirmation', title: 'تم جدولة الاجتماع', description: date })

export const toastInviteSent = (email: string) =>
  toast({ variant: 'confirmation', title: 'تم إرسال الدعوة', description: email })
