import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toastApiError } from '@/components/toast'
import { servicesApi, type ApiService } from '@/lib/services.api'

interface AssignStaffDialogProps {
  open: boolean
  service: ApiService | null
  onClose: () => void
}

export function AssignStaffDialog({ open, service, onClose }: AssignStaffDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['services', 'staff', service?.id],
    queryFn: () => servicesApi.getStaff(service!.id),
    enabled: open && !!service,
  })

  const assignStaff = useMutation({
    mutationFn: (profileId: string) => servicesApi.assignStaff(service!.id, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'staff', service?.id] })
    },
    onError: toastApiError,
  })

  const unassignStaff = useMutation({
    mutationFn: (profileId: string) => servicesApi.unassignStaff(service!.id, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'staff', service?.id] })
    },
    onError: toastApiError,
  })

  const handleToggle = (profileId: string, currentlyAssigned: boolean) => {
    if (currentlyAssigned) {
      unassignStaff.mutate(profileId)
    } else {
      assignStaff.mutate(profileId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md p-6">
        <div className="mb-4">
          <DialogTitle className="text-xl font-bold">{t('services.assignStaff')}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('services.assignStaffDesc', { serviceName: service?.name })}
          </p>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{(t as any)('common.loading', 'Loading...')}</div>
        ) : staffList.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{t('services.noStaffFound')}</div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {staffList.map((staff) => (
              <div key={staff.id} className="flex items-center space-x-3 p-3 rounded-md border border-border/50 hover:bg-muted/30">
                <input
                  type="checkbox"
                  id={staff.id} 
                  checked={!!staff.is_assigned}
                  onChange={() => handleToggle(staff.id, !!staff.is_assigned)}
                  disabled={assignStaff.isPending || unassignStaff.isPending}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label 
                  htmlFor={staff.id} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {staff.firstName} {staff.lastName}
                </label>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
