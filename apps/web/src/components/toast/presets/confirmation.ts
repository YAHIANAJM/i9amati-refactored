import { toast } from '../useToast'

export const toastConfirmation = (title: string, description?: string, action?: { label: string, onClick: () => void, variant?: 'default' | 'destructive' }, cancelLabel?: string) =>
  toast({ variant: 'confirmation', title, description, action, cancelLabel, duration: 15000 })

export const toastPaymentConfirmed = (amount: string) =>
  toast({ variant: 'confirmation', title: 'تم تأكيد الدفع', description: `المبلغ: ${amount}` })

export const toastMeetingScheduled = (date: string) =>
  toast({ variant: 'confirmation', title: 'تم جدولة الاجتماع', description: date })

export const toastInviteSent = (email: string) =>
  toast({ variant: 'confirmation', title: 'تم إرسال الدعوة', description: email })
