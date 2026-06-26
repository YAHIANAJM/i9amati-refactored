import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toastApiError, toastCreated } from '@/components/toast'
import { servicesApi } from '@/lib/services.api'
import { CreateStaffSchema } from '@i9amati/shared'

interface CreateStaffDialogProps {
  open: boolean
  serviceId?: string
  onClose: () => void
}

type FormValues = z.infer<typeof CreateStaffSchema>

export function CreateStaffDialog({ open, serviceId, onClose }: CreateStaffDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<FormValues>({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const { mutate: createStaff, isPending } = useMutation<{ id: string }, any, FormValues>({
    mutationFn: async (data: FormValues) => {
      const res = await servicesApi.createStaff(data)
      if (serviceId) {
        await servicesApi.assignStaff(serviceId, res.id)
      }
      return res
    },
    onSuccess: () => {
      toastCreated(t('services.staffCreatedSuccessfully'))
      queryClient.invalidateQueries({ queryKey: ['services', 'staff'] })
      setFormData({ firstName: '', lastName: '', email: '' })
      setErrors({})
      onClose()
    },
    onError: (err: any) => toastApiError(err),
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate with Zod
    const result = CreateStaffSchema.safeParse(formData)
    if (!result.success) {
      const formattedErrors: Record<string, string> = {}
      for (const err of result.error.errors) {
        if (err.path[0]) {
          formattedErrors[err.path[0].toString()] = err.message
        }
      }
      setErrors(formattedErrors)
      return
    }

    setErrors({})
    createStaff(result.data)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setFormData({ firstName: '', lastName: '', email: '' })
        setErrors({})
        onClose()
      }
    }}>
      <DialogContent className="max-w-sm p-6">
        <div className="mb-4">
          <DialogTitle className="text-xl font-bold">{t('services.createStaff')}</DialogTitle>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('services.firstName')}</label>
            <input
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-xs text-red-500">{t(errors.firstName as any)}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('services.lastName')}</label>
            <input
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-xs text-red-500">{t(errors.lastName as any)}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('services.email')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{t(errors.email as any)}</p>
            )}
          </div>



          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {t('services.createStaffButton')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
