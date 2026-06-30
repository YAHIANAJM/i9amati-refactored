import { Calendar, Loader2, Search, Trash2, User, X } from "lucide-react";
import InfiniteScrollTrigger from "../components/infinitScrollTriger";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiStaffProfile, servicesApi } from "@/lib/services.api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toastApiError, toastConfirmation, toastDeleted } from "@/components/toast";
import { defineServiceAbility } from "@i9amati/shared";
import { staffName } from "../utils";

export default function StaffTable({
    serviceId,
    setSelectedStaff,
    userServiceTrackingAbility,
    selectedStaff
}: {
    serviceId: string
    setSelectedStaff: (staff: ApiStaffProfile | null) => void
    userServiceTrackingAbility: ReturnType<typeof defineServiceAbility>
    selectedStaff: ApiStaffProfile | null
}) {

    const qc = useQueryClient()

    const [filter, setFilter] = useState({ name: '', dateFrom: '', dateTo: '' })


    // ── Staff infinite query ───────────────────────────────────────────────────
    const {
        data: staffData,
        isLoading: staffLoading,
        isFetchingNextPage: staffFetchingNext,
        hasNextPage: staffHasNext,
        fetchNextPage: staffFetchNext,
    } = useInfiniteQuery({
        queryKey: ['services', 'staff', serviceId, filter.name, filter.dateFrom, filter.dateTo],
        queryFn: ({ pageParam }) => servicesApi.getStaff(serviceId, pageParam as string | undefined, undefined, filter),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last) => last.nextCursor ?? undefined,
        enabled: !!serviceId,
    })

    const staffList = useMemo(
        () => staffData ? staffData.pages.flatMap(p => p.staff) : [],
        [staffData],
    )
    const { t } = useTranslation()

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


    const canManage = userServiceTrackingAbility.can('manage', 'all')

    useEffect(() => {
        if (staffList.length > 0 && !selectedStaff && !canManage) setSelectedStaff(staffList[0])
    }, [staffList, selectedStaff])

    return <>
        {/* Filter row */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
            <div className="relative flex-1 min-w-[180px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                    value={filter.name}
                    onChange={e => setFilter({ ...filter, name: e.target.value })}
                    placeholder={t('services.searchNameEmail')}
                    className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {filter.name && (
                    <button
                        onClick={() => setFilter({ ...filter, name: '' })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                    <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        type="date"
                        value={filter.dateFrom}
                        onChange={e => setFilter({ ...filter, dateFrom: e.target.value })}
                        className="h-9 rounded-md border border-input bg-background pl-8 pr-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <span className="text-xs text-muted-foreground">{t('common.to')}</span>
                <input
                    type="date"
                    value={filter.dateTo}
                    min={filter.dateFrom}
                    onChange={e => setFilter({ ...filter, dateTo: e.target.value })}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {(filter.dateFrom || filter.dateTo) && (
                    <button onClick={() => setFilter({ ...filter, dateFrom: '', dateTo: '' })}
                        className="text-muted-foreground hover:text-foreground">
                        <X size={13} />
                    </button>
                )}
            </div>
        </div>

        {/* Staff table — flex-1 scrollable */}
        <div className="flex-1 min-h-0 bg-card rounded-xl border overflow-hidden flex flex-col">
            {staffLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-muted-foreground" />
                </div>
            ) : staffList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <User size={28} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t('services.noStaffAssigned')}</p>
                </div>
            ) : (
                <>
                    {/* Sticky header */}
                    <table className="w-full text-sm shrink-0">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {t('services.staffTracking')}
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                                    {t('services.assignedDate')}
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {t('services.status_ACTIVE')}
                                </th>
                                {canManage && <th className="px-4 py-3 w-10" />}
                            </tr>
                        </thead>
                    </table>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm">
                            <tbody>
                                {staffList.map((staff, i) => (
                                    <tr
                                        key={staff.id}
                                        onClick={() => setSelectedStaff(staff)}
                                        className={cn(
                                            'border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors',
                                            i % 2 === 1 && 'bg-muted/10',
                                        )}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                    {staff.image
                                                        ? <img src={staff.image} alt="" className="h-full w-full rounded-full object-cover" />
                                                        : <User size={14} className="text-muted-foreground" />}
                                                </div>
                                                <span className="font-medium leading-none">{staffName(staff, t)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                                            {staff.assigned_at ? format(new Date(staff.assigned_at), 'MMM d, yyyy') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
                                                staff.is_active
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-muted text-muted-foreground',
                                            )}>
                                                <span className={cn(
                                                    'h-1.5 w-1.5 rounded-full',
                                                    staff.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                                                )} />
                                                {staff.is_active ? t('services.staffOnSite') : t('services.staffOffSite')}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => confirmDeleteStaff(staff)}
                                                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                                                    title={t('services.deleteStaff')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <InfiniteScrollTrigger
                            hasNextPage={!!staffHasNext}
                            isFetchingNextPage={staffFetchingNext}
                            fetchNextPage={staffFetchNext}
                        />
                    </div>
                </>
            )}
        </div>
    </>
}