import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { z } from 'zod'
import {
  ChevronRight, ChevronLeft, User, Play, Square,
  Search, Calendar, X, Plus, Trash2, Loader2,
} from 'lucide-react'
import { defineServiceAbility, CreateStaffSchema } from '@i9amati/shared'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import {
  toastApiError, toastCreated, toastUpdated, toastDeleted, toastConfirmation,
} from '@/components/toast'
import {
  servicesApi,
  type ApiStaffProfile, type ApiServiceSession, type ServicesResponse,
} from '@/lib/services.api'
import { cn } from '@/lib/utils'

type CreateForm = z.infer<typeof CreateStaffSchema>

// Sentinel div that triggers fetchNextPage when it enters the viewport
function InfiniteScrollTrigger({
  hasNextPage, isFetchingNextPage, fetchNextPage,
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div ref={ref} className="h-8 flex items-center justify-center">
      {isFetchingNextPage && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
    </div>
  )
}

export function StaffTrackingPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const navigate      = useNavigate()
  const { t }         = useTranslation()
  const qc            = useQueryClient()

  // ── View state ─────────────────────────────────────────────────────────────
  const [selectedStaff, setSelectedStaff] = useState<ApiStaffProfile | null>(null)
  const [nameFilter,    setNameFilter]    = useState('')
  const [dateFrom,      setDateFrom]      = useState('')
  const [dateTo,        setDateTo]        = useState('')
  const [form,          setForm]          = useState<CreateForm>({ firstName: '', lastName: '', email: '' })
  const [formErrors,    setFormErrors]    = useState<Partial<Record<keyof CreateForm, string>>>({})

  // ── Service + role ─────────────────────────────────────────────────────────
  const { data: servicesData } = useQuery<ServicesResponse>({
    queryKey: ['services'],
    queryFn:  servicesApi.list,
    staleTime: 60_000,
  })
  const service     = servicesData?.services.find(s => s.id === serviceId)
  const profileRole = servicesData?.profileRole ?? ''
  const canManage   = defineServiceAbility(profileRole).can('manage', 'all')

  // ── Staff infinite query ───────────────────────────────────────────────────
  const {
    data:              staffData,
    isLoading:         staffLoading,
    isFetchingNextPage: staffFetchingNext,
    hasNextPage:       staffHasNext,
    fetchNextPage:     staffFetchNext,
  } = useInfiniteQuery({
    queryKey: ['services', 'staff', serviceId],
    queryFn:  ({ pageParam }) => servicesApi.getStaff(serviceId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!serviceId,
  })

  const allStaff = useMemo(
    () => staffData?.pages.flatMap(p => p.staff) ?? [],
    [staffData],
  )

  const filteredStaff = useMemo(() => allStaff.filter(s => {
    const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.toLowerCase()
    if (nameFilter && !name.includes(nameFilter.toLowerCase())) return false
    if (dateFrom || dateTo) {
      const raw = s.assigned_at
      if (!raw) return false
      const d = new Date(raw)
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false
    }
    return true
  }), [allStaff, nameFilter, dateFrom, dateTo])

  // ── Sessions infinite query (per staff member) ─────────────────────────────
  const {
    data:              sessionsData,
    isLoading:         sessionsLoading,
    isFetchingNextPage: sessionsFetchingNext,
    hasNextPage:       sessionsHasNext,
    fetchNextPage:     sessionsFetchNext,
  } = useInfiniteQuery({
    queryKey: ['services', serviceId, 'sessions', selectedStaff?.id],
    queryFn:  ({ pageParam }) =>
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

  // ── Mutations ──────────────────────────────────────────────────────────────

  const checkIn = useMutation<ApiServiceSession, unknown, void>({
    mutationFn: () => servicesApi.checkIn(serviceId!, selectedStaff!.id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['services', serviceId, 'sessions', selectedStaff?.id] })
      qc.invalidateQueries({ queryKey: ['services', 'staff', serviceId] })
      toastCreated(t('services.staffCheckedIn'))
    },
    onError: (err) => toastApiError(err),
  })

  const checkOut = useMutation({
    mutationFn: (sessionId: string) => servicesApi.checkOut(serviceId!, sessionId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['services', serviceId, 'sessions', selectedStaff?.id] })
      qc.invalidateQueries({ queryKey: ['services', 'staff', serviceId] })
      toastUpdated(t('services.staffCheckedOut'))
    },
    onError: toastApiError,
  })

  const deleteStaff = useMutation({
    mutationFn: (profileId: string) => servicesApi.deleteStaff(profileId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['services', 'staff', serviceId] })
      toastDeleted(t('services.staffDeleted'))
      setSelectedStaff(null)
    },
    onError: toastApiError,
  })

  const createStaff = useMutation({
    mutationFn: async (data: CreateForm) => {
      const res = await servicesApi.createStaff(data)
      await servicesApi.assignStaff(serviceId!, res.id)
      return res
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', 'staff', serviceId] })
      toastCreated(t('services.staffCreatedSuccessfully'))
      setForm({ firstName: '', lastName: '', email: '' })
      setFormErrors({})
    },
    onError: (err) => toastApiError(err),
  })

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const result = CreateStaffSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const err of result.error.errors) {
        if (err.path[0]) errs[String(err.path[0])] = err.message
      }
      setFormErrors(errs)
      return
    }
    setFormErrors({})
    createStaff.mutate(result.data)
  }, [form, createStaff])

  const confirmDeleteStaff = useCallback((staff: ApiStaffProfile) => {
    toastConfirmation(
      t('services.deleteStaffTitle'),
      `${t('services.deleteStaffDesc')} ${[staff.firstName, staff.lastName].filter(Boolean).join(' ')}?`,
      {
        label:   t('common.delete'),
        variant: 'destructive',
        onClick: () => deleteStaff.mutate(staff.id),
      },
      t('common.cancel'),
    )
  }, [t, deleteStaff])

  const staffName = (s: ApiStaffProfile) =>
    [s.firstName, s.lastName].filter(Boolean).join(' ') || t('services.noName')

  const view = selectedStaff ? 'sessions' : 'staff'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      <TopBar
        title={
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => navigate('/syndic/services')}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              {t('services.pageTitle')}
            </button>
            <ChevronRight size={13} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-sm">{service?.name ?? '…'}</span>
            <ChevronRight size={13} className="text-muted-foreground shrink-0" />
            <span className="text-foreground text-sm font-semibold">{t('services.staffTracking')}</span>
          </div>
        }
        subtitle={t('services.trackStaffDesc')}
        hideSearch
      />

      {/* Two-panel body — fills remaining height */}
      <div className="flex-1 flex gap-5 p-6 min-h-0">

        {/* ── Main panel ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 min-h-0">

          {view === 'staff' ? (
            <>
              {/* Filter row */}
              <div className="flex items-center gap-3 flex-wrap shrink-0">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                    placeholder={t('services.searchNameEmail')}
                    className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {nameFilter && (
                    <button
                      onClick={() => setNameFilter('')}
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
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background pl-8 pr-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{t('common.to')}</span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    onChange={e => setDateTo(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo('') }}
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
                ) : filteredStaff.length === 0 ? (
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
                          {filteredStaff.map((staff, i) => (
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
                                  <span className="font-medium leading-none">{staffName(staff)}</span>
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
          ) : (
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
                    <span className="text-sm font-semibold">{staffName(selectedStaff!)}</span>
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
          )}
        </div>

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        <div className="w-72 shrink-0">
          {selectedStaff ? (
            <div className="bg-card rounded-xl border p-5 space-y-4 sticky top-24">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  {selectedStaff.image
                    ? <img src={selectedStaff.image} alt="" className="h-full w-full rounded-full object-cover" />
                    : <User size={28} className="text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{staffName(selectedStaff)}</p>
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
                  <span className="text-xs text-muted-foreground">{t('services.totalSessions')}</span>
                  <span className="text-xs font-medium">{allSessions.length}</span>
                </div>
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
          ) : canManage ? (
            <div className="bg-card rounded-xl border p-5 space-y-4 sticky top-24">
              <div>
                <p className="text-sm font-semibold">{t('services.createStaff')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('services.createStaffHint')}</p>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">{t('services.firstName')}</label>
                  <input
                    value={form.firstName}
                    onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="John"
                  />
                  {formErrors.firstName && (
                    <p className="text-xs text-destructive">{t(formErrors.firstName as any)}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">{t('services.lastName')}</label>
                  <input
                    value={form.lastName}
                    onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Doe"
                  />
                  {formErrors.lastName && (
                    <p className="text-xs text-destructive">{t(formErrors.lastName as any)}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">{t('services.email')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="john@example.com"
                  />
                  {formErrors.email && (
                    <p className="text-xs text-destructive">{t(formErrors.email as any)}</p>
                  )}
                </div>
                <Button type="submit" size="sm" className="w-full gap-1.5" disabled={createStaff.isPending}>
                  <Plus size={13} />
                  {t('services.createStaffButton')}
                </Button>
              </form>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  )
}

function calcDuration(checkIn: string, checkOut: string): string {
  const mins = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60_000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
