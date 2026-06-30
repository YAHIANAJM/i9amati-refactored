import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { staffName } from "../utils";
import { ApiStaffProfile, servicesApi } from "@/lib/services.api";
import { Trash2 } from "lucide-react";
import { defineServiceAbility } from "@i9amati/shared";
import { useCallback } from "react";
import { toastApiError, toastConfirmation, toastDeleted } from "@/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function StaffProfile({
    selectedStaff,
    staffProfileServiceAbility,
    setSelectedStaff,
    serviceId
}: {
    selectedStaff: ApiStaffProfile
    staffProfileServiceAbility: ReturnType<typeof defineServiceAbility>
    setSelectedStaff: (staff: ApiStaffProfile | null) => void
    serviceId: string
}) {
    const canManage = staffProfileServiceAbility.can('manage', 'all')
    const { t } = useTranslation()
    const qc = useQueryClient()

    const deleteStaff = useMutation({
        mutationFn: (profileId: string) => servicesApi.deleteStaff(profileId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['services', 'staff', serviceId] })
            toastDeleted(t('services.staffDeleted'))
            setSelectedStaff(null)
        },
        onError: toastApiError,
    })

    const confirmDeleteStaff = useCallback((staff: ApiStaffProfile) => {
        toastConfirmation(
            t('services.deleteStaffTitle'),
            `${t('services.deleteStaffDesc')} ${[staff.firstName, staff.lastName].filter(Boolean).join(' ')}?`,
            {
                label: t('common.delete'),
                variant: 'destructive',
                onClick: () => deleteStaff.mutate(staff.id),
            },
            t('common.cancel'),
        )
    }, [t, deleteStaff])
    return (
        <div className="bg-card rounded-xl border p-5 space-y-4 sticky top-24">
            <div className="flex flex-col items-center text-center gap-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    {selectedStaff.image
                        ? <img src={selectedStaff.image} alt="" className="h-full w-full rounded-full object-cover" />
                        : <User size={28} className="text-muted-foreground" />}
                </div>
                <div>
                    <p className="font-semibold text-sm">{staffName(selectedStaff, t)}</p>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {selectedStaff.role}
                    </span>
                </div>
            </div>

            <div className="space-y-3 border-t pt-4">
                {selectedStaff.assigned_at && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{t('services.assignedDate')}</span>
                        <span className="text-xs font-medium">
                            {format(new Date(selectedStaff.assigned_at), 'MMM d, yyyy')}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('services.status_ACTIVE')}</span>
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        selectedStaff.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground',
                    )}>
                        {selectedStaff.is_active ? t('services.staffOnSite') : t('services.staffOffSite')}
                    </span>
                </div>
            </div>

            {canManage && (
                <div className="border-t pt-4">
                    <button
                        onClick={() => confirmDeleteStaff(selectedStaff)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-destructive hover:bg-destructive/5 py-2 rounded-lg transition-colors"
                    >
                        <Trash2 size={13} />
                        {t('services.deleteStaff')}
                    </button>
                </div>
            )}
        </div>
    )
}