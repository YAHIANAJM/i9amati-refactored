import { Button } from "@/components/ui/button"
import InfiniteScrollTrigger from "../components/infinitScrollTriger"
import { ChevronLeft, ChevronRight, Loader2, Play, Square, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ApiServiceSession, ApiStaffProfile, servicesApi } from "@/lib/services.api"
import { useMemo } from "react"
import { toastApiError, toastCreated, toastUpdated } from "@/components/toast"
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import { calcDuration, staffName } from "../utils"


export default function SessionTable({ serviceId, selectedStaff, setSelectedStaff }: {
    serviceId: string
    selectedStaff: ApiStaffProfile | null
    setSelectedStaff: (staff: ApiStaffProfile | null) => void
}) {
    const qc = useQueryClient()

    // ── Sessions infinite query (per staff member) ─────────────────────────────
    const {
        data: sessionsData,
        isLoading: sessionsLoading,
        isFetchingNextPage: sessionsFetchingNext,
        hasNextPage: sessionsHasNext,
        fetchNextPage: sessionsFetchNext,
    } = useInfiniteQuery({
        queryKey: ['services', serviceId, 'sessions', selectedStaff?.id],
        queryFn: ({ pageParam }) =>
            servicesApi.getSessions(serviceId!, selectedStaff!.id, pageParam as string | undefined),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last) => last.nextCursor ?? undefined,
        enabled: !!serviceId && !!selectedStaff,
    })

    const allSessions: ApiServiceSession[] = useMemo(
        () => sessionsData?.pages.flatMap(p => p.sessions) ?? [],
        [sessionsData],
    )

    const activeSession = useMemo(
        () => allSessions.find(s => !s.check_out_at) ?? null,
        [allSessions],
    )
    const { t } = useTranslation()

    // ── Mutations ──────────────────────────────────────────────────────────────

    const checkIn = useMutation<ApiServiceSession, unknown, void>({
        mutationFn: () => servicesApi.checkIn(serviceId!, selectedStaff!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['services', serviceId, 'sessions', selectedStaff?.id] })
            qc.invalidateQueries({ queryKey: ['services', 'staff', serviceId] })
            toastCreated(t('services.staffCheckedIn'))
        },
        onError: (err) => toastApiError(err),
    })

    const checkOut = useMutation({
        mutationFn: (sessionId: string) => servicesApi.checkOut(serviceId!, sessionId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['services', serviceId, 'sessions', selectedStaff?.id] })
            qc.invalidateQueries({ queryKey: ['services', 'staff', serviceId] })
            toastUpdated(t('services.staffCheckedOut'))
        },
        onError: toastApiError,
    })

    return (
        /* ── Sessions view ───────────────────────────────────────────── */
        <>
            {/* Back nav + check-in button */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSelectedStaff(null)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft size={15} />
                        {t('services.allStaff')}
                    </button>
                    <ChevronRight size={13} className="text-muted-foreground" />
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                            {selectedStaff!.image
                                ? <img src={selectedStaff!.image} alt="" className="h-full w-full rounded-full object-cover" />
                                : <User size={12} className="text-muted-foreground" />}
                        </div>
                        <span className="text-sm font-semibold">{staffName(selectedStaff!, t)}</span>
                    </div>
                </div>

                {!activeSession && !sessionsLoading && (
                    <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={checkIn.isPending}
                        onClick={() => checkIn.mutate()}
                    >
                        <Play size={13} />
                        {t('services.checkIn')}
                    </Button>
                )}
            </div>

            {/* Sessions table — flex-1 scrollable */}
            <div className="flex-1 min-h-0 bg-card rounded-xl border overflow-hidden flex flex-col">
                {sessionsLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-muted-foreground" />
                    </div>
                ) : allSessions.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">{t('services.noSessionsYet')}</p>
                    </div>
                ) : (
                    <>
                        {/* Sticky header */}
                        <table className="w-full text-sm shrink-0">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        {t('services.checkIn')}
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        {t('services.checkOut')}
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                                        {t('services.sessionDuration')}
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        {t('services.status_ACTIVE')}
                                    </th>
                                    <th className="px-4 py-3 w-28" />
                                </tr>
                            </thead>
                        </table>

                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm">
                                <tbody>
                                    {allSessions.map((session, i) => {
                                        const isActive = !session.check_out_at
                                        return (
                                            <tr key={session.id} className={cn('border-b last:border-0', i % 2 === 1 && 'bg-muted/10')}>
                                                <td className="px-4 py-3 text-xs">
                                                    {format(new Date(session.check_in_at), 'MMM d, HH:mm')}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {session.check_out_at ? format(new Date(session.check_out_at), 'MMM d, HH:mm') : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                                                    {session.check_out_at ? calcDuration(session.check_in_at, session.check_out_at) : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
                                                        isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground',
                                                    )}>
                                                        <span className={cn(
                                                            'h-1.5 w-1.5 rounded-full',
                                                            isActive ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                                                        )} />
                                                        {isActive ? t('services.staffOnSite') : t('services.staffOffSite')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {isActive && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1.5 h-7 text-xs"
                                                            disabled={checkOut.isPending}
                                                            onClick={() => checkOut.mutate(session.id)}
                                                        >
                                                            <Square size={11} className="fill-current" />
                                                            {t('services.checkOut')}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            <InfiniteScrollTrigger
                                hasNextPage={!!sessionsHasNext}
                                isFetchingNextPage={sessionsFetchingNext}
                                fetchNextPage={sessionsFetchNext}
                            />
                        </div>
                    </>
                )}
            </div>
        </>
    )
}