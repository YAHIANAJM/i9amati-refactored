import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, MapPin, Clock, ChevronDown, X, Trash2,
  CheckCircle2, XCircle, Activity, Play, FileText,
  Printer, UserCheck, UserX, AlertTriangle, Scale, Loader2,
  Send, Building2, Mail, CalendarDays, TrendingUp,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Meeting, AgendaItem } from '@/data/mock/meetings'
import { cn } from '@/lib/utils'

// ─── helpers ──────────────────────────────────────────────────────────────────

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

const STATUS_VARIANT: Record<Meeting['status'], { variant: 'info' | 'warning' | 'success' | 'secondary'; stripe: string }> = {
  SCHEDULED:   { variant: 'info',      stripe: 'border-l-blue-400'    },
  IN_PROGRESS: { variant: 'warning',   stripe: 'border-l-amber-400'   },
  COMPLETED:   { variant: 'success',   stripe: 'border-l-emerald-400' },
  CANCELLED:   { variant: 'secondary', stripe: 'border-l-slate-300'   },
}

function useMeetingLabels() {
  const { t } = useTranslation()
  const typeLabel: Record<Meeting['type'], string> = {
    GLOBAL:      t('meetings.types.GLOBAL'),
    EXCEPTIONAL: t('meetings.types.EXCEPTIONAL'),
    NORMAL:      t('meetings.types.NORMAL'),
  }
  const statusConfig: Record<Meeting['status'], { label: string; variant: 'info' | 'warning' | 'success' | 'secondary'; stripe: string }> = {
    SCHEDULED:   { label: t('meetings.status.SCHEDULED'),   ...STATUS_VARIANT.SCHEDULED   },
    IN_PROGRESS: { label: t('meetings.status.IN_PROGRESS'), ...STATUS_VARIANT.IN_PROGRESS },
    COMPLETED:   { label: t('meetings.status.COMPLETED'),   ...STATUS_VARIANT.COMPLETED   },
    CANCELLED:   { label: t('meetings.status.CANCELLED'),   ...STATUS_VARIANT.CANCELLED   },
  }
  return { typeLabel, statusConfig, t }
}

const dateColor: Record<Meeting['status'], string> = {
  SCHEDULED:   'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  COMPLETED:   'bg-emerald-50 text-emerald-700',
  CANCELLED:   'bg-slate-100 text-slate-500',
}

function quorumRequired(totalEligible: number) {
  return Math.ceil(totalEligible * 0.5)
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function fmtElapsed(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// ─── animated number ──────────────────────────────────────────────────────────

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const mv      = useMotionValue(value)
  const spring  = useSpring(mv, { stiffness: 180, damping: 22 })
  const display = useTransform(spring, v => Math.round(v).toString())
  useEffect(() => { mv.set(value) }, [value, mv])
  return <motion.span className={className}>{display}</motion.span>
}

// ─── API hooks ────────────────────────────────────────────────────────────────

function useMeetings(refetchInterval?: number) {
  return useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn:  () => api.get('/api/meetings'),
    refetchInterval,
    staleTime: refetchInterval ? 0 : 30_000,
  })
}

function useMeetingMutations() {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: ['meetings'] })

  const startMeeting    = useMutation({ mutationFn: (id: string) => api.patch(`/api/meetings/${id}/start`),                                                                           onSuccess: refetch })
  const closeMeeting    = useMutation({ mutationFn: (id: string) => api.patch(`/api/meetings/${id}/close`),                                                                           onSuccess: refetch })
  const sendConvocation = useMutation({ mutationFn: (id: string) => api.patch(`/api/meetings/${id}/send-convocation`),                                                                onSuccess: refetch })
  const createMeeting   = useMutation({ mutationFn: (body: object) => api.post('/api/meetings', body),                                                                                onSuccess: refetch })
  const togglePresence  = useMutation({ mutationFn: ({ meetingId, attendeeId }: { meetingId: string; attendeeId: string }) => api.patch(`/api/meetings/${meetingId}/attendees/${attendeeId}/presence`), onSuccess: refetch })
  const openVote        = useMutation({ mutationFn: ({ meetingId, itemId }: { meetingId: string; itemId: string }) => api.post(`/api/meetings/${meetingId}/agenda/${itemId}/open`),   onSuccess: refetch })
  const closeVote       = useMutation({ mutationFn: ({ meetingId, itemId }: { meetingId: string; itemId: string }) => api.post(`/api/meetings/${meetingId}/agenda/${itemId}/close`),  onSuccess: refetch })
  const presidentDecide = useMutation({ mutationFn: ({ meetingId, itemId, result }: { meetingId: string; itemId: string; result: 'ADOPTED' | 'REJECTED' }) => api.post(`/api/meetings/${meetingId}/agenda/${itemId}/president`, { result }), onSuccess: refetch })

  const castVote = useMutation({
    mutationFn: ({ meetingId, itemId, type }: { meetingId: string; itemId: string; type: 'pour' | 'contre' | 'abstention' }) =>
      api.post(`/api/meetings/${meetingId}/agenda/${itemId}/cast`, { type }),
    onMutate: async ({ meetingId, itemId, type }) => {
      await qc.cancelQueries({ queryKey: ['meetings'] })
      const prev = qc.getQueryData<Meeting[]>(['meetings'])
      qc.setQueryData<Meeting[]>(['meetings'], old =>
        old?.map(m => m.id !== meetingId ? m : {
          ...m, agenda: m.agenda.map(it => it.id !== itemId ? it : { ...it, [type]: it[type] + 1 }),
        })
      )
      return { prev }
    },
    onError:   (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['meetings'], ctx.prev) },
    onSettled: refetch,
  })

  return { startMeeting, closeMeeting, togglePresence, openVote, castVote, closeVote, presidentDecide, sendConvocation, createMeeting }
}

// ─── VoteBar (used in Detail panel) ──────────────────────────────────────────

function VoteBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.55, ease: 'easeOut' }} />
      </div>
    </div>
  )
}

// ─── VotingOverlay ────────────────────────────────────────────────────────────

const DONUT_COLORS = ['#10b981', '#ef4444', '#94a3b8']

type ZoneType     = 'pour' | 'contre' | 'abstention'
type OwnerVoteMap = Record<string, ZoneType>

// ─── zone config ─────────────────────────────────────────────────────────────

const ZONE_CFG = {
  pour: {
    label: 'Pour', Icon: CheckCircle2,
    bg: 'bg-emerald-50/70', border: 'border-emerald-200', hoverBorder: 'border-emerald-500',
    hoverBg: 'bg-emerald-100/90', shadow: 'shadow-emerald-200/60', overlay: 'bg-emerald-400/10',
    iconNormal: 'bg-emerald-100 text-emerald-600', iconActive: 'bg-emerald-500 text-white shadow-emerald-300',
    head: 'text-emerald-700', big: 'text-emerald-600', avatarBg: 'bg-emerald-500',
    chip: 'bg-emerald-100 border-emerald-200 text-emerald-800',
    divider: 'bg-emerald-200', ph: 'text-emerald-400 border-emerald-200', dropBg: 'bg-emerald-500 shadow-emerald-300/70',
  },
  contre: {
    label: 'Contre', Icon: XCircle,
    bg: 'bg-red-50/70', border: 'border-red-200', hoverBorder: 'border-red-500',
    hoverBg: 'bg-red-100/90', shadow: 'shadow-red-200/60', overlay: 'bg-red-400/10',
    iconNormal: 'bg-red-100 text-red-600', iconActive: 'bg-red-500 text-white shadow-red-300',
    head: 'text-red-700', big: 'text-red-600', avatarBg: 'bg-red-500',
    chip: 'bg-red-100 border-red-200 text-red-800',
    divider: 'bg-red-200', ph: 'text-red-400 border-red-200', dropBg: 'bg-red-500 shadow-red-300/70',
  },
  abstention: {
    label: 'Abstention', Icon: Scale,
    bg: 'bg-slate-50/70', border: 'border-slate-300', hoverBorder: 'border-slate-500',
    hoverBg: 'bg-slate-100/90', shadow: 'shadow-slate-300/60', overlay: 'bg-slate-400/10',
    iconNormal: 'bg-slate-100 text-slate-500', iconActive: 'bg-slate-500 text-white shadow-slate-300',
    head: 'text-slate-600', big: 'text-slate-500', avatarBg: 'bg-slate-400',
    chip: 'bg-slate-100 border-slate-200 text-slate-700',
    divider: 'bg-slate-200', ph: 'text-slate-400 border-slate-200', dropBg: 'bg-slate-500 shadow-slate-300/70',
  },
} as const

// ─── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({
  type, zoneRef, isHovered, isDragging, voted,
}: {
  type: ZoneType
  zoneRef: { current: HTMLDivElement | null }
  isHovered: boolean
  isDragging: boolean
  voted: Array<{ id: string; name: string }>
}) {
  const c = ZONE_CFG[type]
  const Icon = c.Icon

  return (
    <div
      ref={zoneRef}
      className={cn(
        'relative rounded-3xl border-2 flex flex-col overflow-hidden transition-all duration-200',
        isHovered
          ? `${c.hoverBg} ${c.hoverBorder} shadow-2xl ${c.shadow} scale-[1.015]`
          : `${c.bg} ${c.border}`,
        isDragging && !isHovered && 'opacity-50 scale-[0.985]',
      )}
    >
      {/* header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 shrink-0">
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200',
          isHovered ? `${c.iconActive} shadow-lg` : c.iconNormal,
        )}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-black uppercase tracking-widest', c.head)}>{c.label}</p>
          <p className={cn('text-[11px] font-medium mt-0.5', c.head, 'opacity-60')}>
            {voted.length} vote{voted.length !== 1 ? 's' : ''}
          </p>
        </div>
        {voted.length > 0 && (
          <AnimatedNumber value={voted.length} className={cn('text-4xl font-black tabular-nums shrink-0', c.big)} />
        )}
      </div>

      <div className={cn('mx-5 h-px shrink-0', c.divider)} />

      {/* content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {voted.length === 0 ? (
          <div className={cn(
            'h-full min-h-[72px] flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed',
            c.ph,
          )}>
            <Icon size={22} className="opacity-40" />
            <p className="text-xs font-bold opacity-50">Glissez ici</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {voted.map(att => (
                <motion.div key={att.id}
                  initial={{ opacity: 0, scale: 0.7, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-[11px] font-semibold whitespace-nowrap', c.chip)}
                >
                  <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0', c.avatarBg)}>
                    {initials(att.name)}
                  </div>
                  {att.name}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* drag-over pulse overlay */}
      <AnimatePresence>
        {isHovered && isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn('absolute inset-0 flex items-center justify-center pointer-events-none rounded-3xl', c.overlay)}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.72, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-3"
            >
              <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl', c.dropBg)}>
                <Icon size={28} />
              </div>
              <span className={cn('font-black text-base', c.head)}>Déposer ici</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── VotingOverlayProps ───────────────────────────────────────────────────────

type VotingOverlayProps = {
  meeting:           Meeting
  item:              AgendaItem
  onDismiss:         () => void
  onCloseVote:       () => void
  onCastForOwner:    (attendeeId: string, type: ZoneType) => void
  onPresidentDecide: (result: 'ADOPTED' | 'REJECTED') => void
  isCasting:         boolean
  isClosing:         boolean
}

function VotingOverlay({
  meeting, item, onDismiss, onCloseVote, onCastForOwner, onPresidentDecide, isCasting, isClosing,
}: VotingOverlayProps) {
  const [ownerVotes, setOwnerVotes] = useState<OwnerVoteMap>({})
  const [elapsed,    setElapsed]    = useState(0)
  const [draggingId,  setDraggingId]  = useState<string | null>(null)
  const [hoveredZone, setHoveredZone] = useState<ZoneType | null>(null)

  const pourRef   = useRef<HTMLDivElement>(null)
  const contreRef = useRef<HTMLDivElement>(null)
  const abstRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const total     = item.pour + item.contre + item.abstention
  const pct       = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0
  const present   = meeting.attendeeList.filter(a => a.present)
  const absent    = meeting.attendeeList.filter(a => !a.present)
  const qReq      = quorumRequired(meeting.totalEligible)
  const qOk       = present.length >= qReq || meeting.convocationNumber === 2
  const processed = Object.keys(ownerVotes).length
  const isTie     = item.voteStatus === 'CLOSED' && item.result === undefined
  const isDone    = item.voteStatus === 'CLOSED' && !!item.result

  const pool        = present.filter(a => !ownerVotes[a.id])
  const votedPour   = present.filter(a => ownerVotes[a.id] === 'pour')
  const votedContre = present.filter(a => ownerVotes[a.id] === 'contre')
  const votedAbst   = present.filter(a => ownerVotes[a.id] === 'abstention')

  const topAccent = isDone
    ? item.result === 'ADOPTED' ? 'bg-emerald-500' : 'bg-red-500'
    : isTie ? 'bg-yellow-400' : 'bg-amber-400'

  const donutData = total > 0
    ? [
        { name: 'Pour',       value: item.pour       },
        { name: 'Contre',     value: item.contre     },
        { name: 'Abstention', value: item.abstention },
      ].filter(d => d.value > 0)
    : [{ name: '–', value: 1 }]
  const donutColors = total > 0 ? DONUT_COLORS : ['#e2e8f0']

  function detectZone(x: number, y: number): ZoneType | null {
    const checks: Array<[{ current: HTMLDivElement | null }, ZoneType]> = [
      [pourRef, 'pour'], [contreRef, 'contre'], [abstRef, 'abstention'],
    ]
    for (const [ref, type] of checks) {
      const rect = ref.current?.getBoundingClientRect()
      if (rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return type
    }
    return null
  }

  function handleCast(attendeeId: string, type: ZoneType) {
    if (ownerVotes[attendeeId]) return
    onCastForOwner(attendeeId, type)
    setOwnerVotes(prev => ({ ...prev, [attendeeId]: type }))
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      style={{ background: 'linear-gradient(145deg, #f0fdf4 0%, #f8fafc 45%, #fff1f2 100%)' }}
    >
      {/* ── Decorative background ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <div className="absolute -top-56 -left-56 w-[750px] h-[750px] rounded-full bg-emerald-300/20 blur-[110px]" />
        <div className="absolute -top-28 right-0 w-[520px] h-[640px] rounded-full bg-red-300/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] rounded-full bg-slate-400/12 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{ backgroundImage: 'radial-gradient(circle, #475569 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
        />
      </div>

      {/* ── Top accent ── */}
      <div className={cn('h-1.5 w-full shrink-0 transition-colors duration-500', topAccent)} />

      {/* ── Header ── */}
      <div className="relative shrink-0 flex items-center gap-4 px-6 py-4 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {item.voteStatus === 'OPEN' && (
            <span className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Vote en cours</span>
            </span>
          )}
          {isDone && (
            <span className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 shrink-0 border text-[10px] font-black uppercase tracking-widest',
              item.result === 'ADOPTED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700',
            )}>
              {item.result === 'ADOPTED' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              {item.result === 'ADOPTED' ? 'Adoptée' : 'Rejetée'}
            </span>
          )}
          {isTie && (
            <span className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 shrink-0 text-[10px] font-black uppercase tracking-widest text-yellow-700">
              <Scale size={11} /> Égalité
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">{item.title}</h1>
            {item.description && (
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block mt-0.5">{item.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {item.voteStatus === 'OPEN' && (
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200">
              <Clock size={11} className="text-muted-foreground" />
              <span className="font-mono text-slate-700 text-sm tabular-nums font-bold">{fmtElapsed(elapsed)}</span>
            </div>
          )}
          {item.voteStatus === 'OPEN' && (
            <Button size="sm" variant="destructive" className="h-9 text-xs gap-1.5 shadow-sm px-4" disabled={isClosing} onClick={onCloseVote}>
              {isClosing ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Clôturer le vote
            </Button>
          )}
          <button onClick={onDismiss} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/80 transition-colors border border-transparent hover:border-slate-200">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="relative shrink-0 bg-white/70 backdrop-blur-sm border-b border-slate-200/70 px-6 py-4">
        <div className="grid grid-cols-[1fr_1fr_1fr_176px] gap-3">

          {/* POUR stat */}
          <div className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/20 p-4 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-emerald-400" />
            <div className="flex items-center justify-between pl-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Pour</span>
              </div>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{pct(item.pour)}%</span>
            </div>
            <AnimatedNumber value={item.pour} className="text-4xl font-black text-emerald-600 tabular-nums block pl-2" />
            <div className="pl-2 h-1.5 w-full rounded-full bg-emerald-100 overflow-hidden">
              <motion.div className="h-full rounded-full bg-emerald-500" animate={{ width: `${pct(item.pour)}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>

          {/* CONTRE stat */}
          <div className="rounded-2xl border-2 border-red-100 bg-gradient-to-br from-red-50/90 via-white to-red-50/20 p-4 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-red-400" />
            <div className="flex items-center justify-between pl-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-black uppercase tracking-wider text-red-700">Contre</span>
              </div>
              <span className="text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">{pct(item.contre)}%</span>
            </div>
            <AnimatedNumber value={item.contre} className="text-4xl font-black text-red-600 tabular-nums block pl-2" />
            <div className="pl-2 h-1.5 w-full rounded-full bg-red-100 overflow-hidden">
              <motion.div className="h-full rounded-full bg-red-500" animate={{ width: `${pct(item.contre)}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>

          {/* ABSTENTION stat */}
          <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50/90 via-white to-slate-50/20 p-4 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-slate-400" />
            <div className="flex items-center justify-between pl-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-600">Abstention</span>
              </div>
              <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">{pct(item.abstention)}%</span>
            </div>
            <AnimatedNumber value={item.abstention} className="text-4xl font-black text-slate-500 tabular-nums block pl-2" />
            <div className="pl-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div className="h-full rounded-full bg-slate-400" animate={{ width: `${pct(item.abstention)}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>

          {/* Donut + quorum */}
          <div className="rounded-2xl border-2 border-slate-100 bg-white/80 p-3 flex flex-col items-center justify-center gap-2">
            <div className="relative w-full" style={{ height: 88 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={28} outerRadius={42}
                    dataKey="value" startAngle={90} endAngle={450} isAnimationActive stroke="none">
                    {donutData.map((_, i) => <Cell key={i} fill={donutColors[i % donutColors.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 11 }}
                    itemStyle={{ color: '#334155' }}
                    formatter={(v: number, name: string) => [`${v} voix`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-foreground text-xl font-black tabular-nums">{total}</span>
                <span className="text-muted-foreground text-[9px] uppercase tracking-wider font-bold">voix</span>
              </div>
            </div>
            <div className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border',
              qOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
            )}>
              {qOk ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
              {present.length}/{meeting.totalEligible} présents
            </div>
            {!qOk && <p className="text-[9px] text-red-500 font-semibold">Min. {qReq}</p>}
            {meeting.convocationNumber === 2 && <p className="text-[9px] text-blue-500 font-semibold">2ème conv. — libre</p>}
          </div>
        </div>
      </div>

      {/* ── Result screen ── */}
      {isDone && (
        <div className="relative flex-1 flex flex-col items-center justify-center gap-8 p-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            className={cn('w-36 h-36 rounded-full flex items-center justify-center shadow-2xl',
              item.result === 'ADOPTED' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-red-500 shadow-red-200',
            )}
          >
            {item.result === 'ADOPTED'
              ? <CheckCircle2 size={60} className="text-white" strokeWidth={1.5} />
              : <XCircle size={60} className="text-white" strokeWidth={1.5} />}
          </motion.div>
          <div className="text-center space-y-3">
            <motion.h2
              initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.12 }}
              className={cn('text-5xl font-black', item.result === 'ADOPTED' ? 'text-emerald-600' : 'text-red-600')}
            >
              {item.result === 'ADOPTED' ? 'Résolution Adoptée' : 'Résolution Rejetée'}
            </motion.h2>
            <motion.p initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-muted-foreground text-base">{item.title}</motion.p>
            <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.28 }}
              className="flex items-center justify-center gap-3">
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-sm font-semibold">
                <CheckCircle2 size={12} /> {item.pour} pour
              </span>
              <span className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-sm font-semibold">
                <XCircle size={12} /> {item.contre} contre
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-sm font-semibold">
                <Scale size={12} /> {item.abstention} abst.
              </span>
            </motion.div>
          </div>
          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.36 }}>
            <Button size="lg" variant="outline" className="px-12 border-2 h-12 text-sm font-semibold" onClick={onDismiss}>Fermer</Button>
          </motion.div>
        </div>
      )}

      {/* ── Tie screen ── */}
      {isTie && (
        <div className="relative flex-1 flex flex-col items-center justify-center gap-8 p-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            className="w-36 h-36 rounded-full bg-yellow-400 shadow-2xl shadow-yellow-200 flex items-center justify-center"
          >
            <Scale size={60} className="text-white" strokeWidth={1.5} />
          </motion.div>
          <div className="text-center space-y-3">
            <motion.h2 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.12 }}
              className="text-5xl font-black text-yellow-600">Égalité des voix</motion.h2>
            <motion.p initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Le Président exerce sa voix prépondérante conformément à la{' '}
              <span className="font-semibold text-foreground">Loi 18-00, art. 30</span>.
            </motion.p>
          </div>
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex gap-4">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2.5 px-10 h-12 text-sm font-bold shadow-lg shadow-emerald-200" disabled={isClosing} onClick={() => onPresidentDecide('ADOPTED')}>
              {isClosing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={16} />} Adopter
            </Button>
            <Button size="lg" className="bg-red-600 hover:bg-red-500 text-white gap-2.5 px-10 h-12 text-sm font-bold shadow-lg shadow-red-200" disabled={isClosing} onClick={() => onPresidentDecide('REJECTED')}>
              {isClosing ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={16} />} Rejeter
            </Button>
          </motion.div>
        </div>
      )}

      {/* ── Drag-to-vote screen ── */}
      {item.voteStatus === 'OPEN' && (
        <div className="relative flex-1 flex flex-col gap-4 p-5 min-h-0 overflow-hidden">

          {/* instruction + progress bar */}
          <div className="shrink-0 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <span className="inline-block w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center">↑</span>
              Glissez chaque copropriétaire dans sa zone de vote
            </p>
            <div className="flex items-center gap-3">
              {pool.length > 0 ? (
                <motion.span key={pool.length} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                  className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full tabular-nums">
                  {pool.length} restant{pool.length > 1 ? 's' : ''}
                </motion.span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 size={11} /> Tous traités
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{processed}</span>/{present.length}
                </span>
                <div className="relative w-28 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <motion.div className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    animate={{ width: `${present.length > 0 ? Math.round((processed / present.length) * 100) : 0}%` }}
                    transition={{ duration: 0.35, ease: 'easeOut' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Three drop zones ── */}
          <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
            <DropZone type="pour"       zoneRef={pourRef}   isHovered={hoveredZone === 'pour'}       isDragging={!!draggingId} voted={votedPour} />
            <DropZone type="contre"     zoneRef={contreRef} isHovered={hoveredZone === 'contre'}     isDragging={!!draggingId} voted={votedContre} />
            <DropZone type="abstention" zoneRef={abstRef}   isHovered={hoveredZone === 'abstention'} isDragging={!!draggingId} voted={votedAbst} />
          </div>

          {/* ── Draggable chip pool ── */}
          <div className="shrink-0 bg-white/85 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100">
              <span className="text-xs font-bold text-foreground">Copropriétaires à traiter</span>
              {absent.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{absent.length} absent{absent.length > 1 ? 's' : ''} non affichés</span>
              )}
            </div>
            <div className="p-4 flex flex-wrap gap-2.5 min-h-[68px] items-center">
              <AnimatePresence>
                {pool.map(att => (
                  <motion.div
                    key={att.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.14 } }}
                    drag
                    dragMomentum={false}
                    dragElastic={0.12}
                    dragSnapToOrigin
                    whileDrag={{ scale: 1.12, zIndex: 999, boxShadow: '0 20px 48px rgba(0,0,0,0.22)', rotateZ: 1.5 }}
                    onDragStart={() => setDraggingId(att.id)}
                    onDrag={(_, info) => {
                      const z = detectZone(info.point.x, info.point.y)
                      if (z !== hoveredZone) setHoveredZone(z)
                    }}
                    onDragEnd={(_, info) => {
                      const z = detectZone(info.point.x, info.point.y)
                      setDraggingId(null)
                      setHoveredZone(null)
                      if (z) handleCast(att.id, z)
                    }}
                    style={{ touchAction: 'none', position: 'relative' }}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border-2 select-none',
                      'shadow-md hover:shadow-lg transition-shadow',
                      draggingId === att.id
                        ? 'border-primary/60 opacity-40 cursor-grabbing'
                        : 'border-slate-200 cursor-grab hover:border-primary/40',
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                      {initials(att.name)}
                    </div>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{att.name}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline">{att.apartment}</span>
                  </motion.div>
                ))}
                {pool.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <CheckCircle2 size={16} /> Tous les copropriétaires ont voté !
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── AgendaItemRow ────────────────────────────────────────────────────────────

type AgendaRowProps = {
  item: AgendaItem; isLive: boolean; quorumOk: boolean; noQuorumRequired: boolean
  onOpenVote: () => void; onViewLive?: () => void
  onCast: (type: 'pour' | 'contre' | 'abstention') => void
  onClose: () => void; onPresidentDecide: (d: 'ADOPTED' | 'REJECTED') => void; loading: boolean
}

function AgendaItemRow({ item, isLive, quorumOk, noQuorumRequired, onOpenVote, onViewLive, onCast, onClose, onPresidentDecide, loading }: AgendaRowProps) {
  const total   = item.pour + item.contre + item.abstention
  const canVote = quorumOk || noQuorumRequired
  const isTie   = item.voteStatus === 'CLOSED' && item.result === undefined

  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-3 transition-all',
      item.voteStatus === 'OPEN'   && 'border-amber-200 bg-amber-50/40',
      item.voteStatus === 'CLOSED' && item.result === 'ADOPTED'  && 'border-emerald-200 bg-emerald-50/30',
      item.voteStatus === 'CLOSED' && item.result === 'REJECTED' && 'border-red-200 bg-red-50/20',
      item.voteStatus === 'PENDING' && 'bg-white',
      isTie && 'border-amber-300 bg-amber-50/60',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-snug">{item.title}</p>
          {item.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
        </div>
        <div className="shrink-0">
          {item.voteStatus === 'CLOSED' && item.result && (
            <Badge variant={item.result === 'ADOPTED' ? 'success' : 'destructive'} className="text-[10px] gap-1">
              {item.result === 'ADOPTED' ? <><CheckCircle2 size={9} />Adopté</> : <><XCircle size={9} />Rejeté</>}
            </Badge>
          )}
          {isTie && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"><Scale size={9} /> Égalité</span>}
          {item.voteStatus === 'OPEN' && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Vote en cours
              </span>
              {onViewLive && (
                <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5 gap-1 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={onViewLive}>
                  <Activity size={10} /> Rejoindre
                </Button>
              )}
            </div>
          )}
          {item.voteStatus === 'PENDING' && isLive && (
            <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5 border-dashed gap-1"
              disabled={!canVote || loading}
              title={!canVote ? 'Quorum non atteint — 1ère convocation' : undefined}
              onClick={onOpenVote}>
              <Activity size={10} /> Ouvrir le vote
            </Button>
          )}
        </div>
      </div>

      {(item.voteStatus === 'OPEN' || item.voteStatus === 'CLOSED') && (
        <div className="space-y-2">
          <VoteBar label="Pour"       count={item.pour}       total={total} color="bg-emerald-500" />
          <VoteBar label="Contre"     count={item.contre}     total={total} color="bg-red-500" />
          <VoteBar label="Abstention" count={item.abstention} total={total} color="bg-slate-300" />
          {item.voteStatus === 'OPEN' && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading} onClick={() => onCast('pour')}>+1 Pour</Button>
              <Button size="sm" className="flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white"          disabled={loading} onClick={() => onCast('contre')}>+1 Contre</Button>
              <Button size="sm" className="flex-1 h-8 text-xs bg-slate-500 hover:bg-slate-600 text-white"      disabled={loading} onClick={() => onCast('abstention')}>+1 Abst.</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs px-3 shrink-0"                        disabled={loading} onClick={onClose}>Clôturer</Button>
            </div>
          )}
          {isTie && (
            <div className="rounded-xl bg-amber-100 border border-amber-200 p-3 space-y-2.5">
              <p className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                <Scale size={11} />Égalité — le Président exerce sa voix prépondérante (Loi 18-00)
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading} onClick={() => onPresidentDecide('ADOPTED')}>Décision : Adopté</Button>
                <Button size="sm" className="flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white"         disabled={loading} onClick={() => onPresidentDecide('REJECTED')}>Décision : Rejeté</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

type DetailPanelProps = {
  meeting:            Meeting
  mutations:          ReturnType<typeof useMeetingMutations>
  onShowPV:           (id: string) => void
  onSendConvocation:  (id: string) => void
  onOpenVotingScreen: (meetingId: string, itemId: string) => void
}

function DetailPanel({ meeting: m, mutations, onShowPV, onSendConvocation, onOpenVotingScreen }: DetailPanelProps) {
  const present        = m.attendeeList.filter(a => a.present).length
  const required       = quorumRequired(m.totalEligible)
  const quorumReached  = present >= required
  const noQuorumReq    = m.convocationNumber === 2
  const quorumOk       = quorumReached || noQuorumReq
  const quorumPct      = m.totalEligible > 0 ? Math.min(100, Math.round((present / m.totalEligible) * 100)) : 0
  const rsvpAccepted   = m.attendeeList.filter(a => a.rsvp === 'ACCEPTED').length
  const allDone        = m.agenda.length > 0 && m.agenda.every(i => i.voteStatus === 'CLOSED' && i.result !== undefined)
  const anyLoading     = mutations.castVote.isPending || mutations.openVote.isPending || mutations.closeVote.isPending || mutations.presidentDecide.isPending || mutations.togglePresence.isPending

  return (
    <div className="px-6 pb-6 pt-4 bg-gradient-to-b from-slate-50/80 to-white">
      <div className="space-y-5">

        {/* Quorum banner */}
        <div className="rounded-xl border bg-white p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quorum & Présences</p>
          {noQuorumReq && (
            <div className="flex items-center gap-2.5 rounded-lg bg-blue-50 border border-blue-200 px-3.5 py-2.5">
              <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
              <p className="text-xs font-semibold text-blue-800">2ème convocation — quorum non requis (Loi 18-00 art. 30)</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', quorumReached ? 'bg-emerald-50' : 'bg-red-50')}>
              {quorumReached ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-red-400" />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-foreground">
                  {present} / {m.totalEligible} présents
                  {!noQuorumReq && <span className="text-muted-foreground font-normal"> (requis : {required})</span>}
                </span>
                <span className={cn('font-bold text-xs', quorumReached ? 'text-emerald-600' : noQuorumReq ? 'text-muted-foreground' : 'text-red-500')}>
                  {quorumReached ? 'Quorum ✓' : noQuorumReq ? '—' : 'Non atteint'}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', quorumReached ? 'bg-emerald-500' : 'bg-red-400')}
                  initial={{ width: 0 }} animate={{ width: `${quorumPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
          {m.status === 'IN_PROGRESS' && !quorumOk && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5">
              <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">Marquez les présences ci-dessous avant d'ouvrir les votes.</p>
            </div>
          )}
        </div>

        {/* Pointage */}
        {m.status === 'IN_PROGRESS' && (
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pointage — Présence physique</p>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{rsvpAccepted} confirmés · {present} présents</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {m.attendeeList.map(att => (
                <button key={att.id}
                  onClick={() => mutations.togglePresence.mutate({ meetingId: m.id, attendeeId: att.id })}
                  disabled={anyLoading}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all',
                    att.present ? 'bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-100' : 'bg-white border-dashed hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', att.present ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500')}>
                      {initials(att.name)}
                    </div>
                    <div className="min-w-0">
                      <p className={cn('text-[11px] font-semibold truncate', att.present ? 'text-emerald-900' : 'text-muted-foreground')}>{att.name}</p>
                      <p className="text-[10px] text-muted-foreground/70">{att.apartment}</p>
                    </div>
                  </div>
                  {att.present ? <UserCheck size={13} className="text-emerald-600 shrink-0" /> : <UserX size={13} className="text-muted-foreground/30 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Agenda + attendees */}
        <div className={cn('gap-5', m.status !== 'IN_PROGRESS' ? 'grid grid-cols-[1fr_220px]' : '')}>
          <div className="space-y-3">
            <div className="rounded-xl border bg-white p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ordre du jour</p>
              {m.agenda.map((item, i) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <AgendaItemRow
                      item={item}
                      isLive={m.status === 'IN_PROGRESS'}
                      quorumOk={quorumReached}
                      noQuorumRequired={noQuorumReq}
                      loading={anyLoading}
                      onOpenVote={() => {
                        mutations.openVote.mutate({ meetingId: m.id, itemId: item.id }, {
                          onSuccess: () => onOpenVotingScreen(m.id, item.id),
                        })
                      }}
                      onViewLive={item.voteStatus === 'OPEN' ? () => onOpenVotingScreen(m.id, item.id) : undefined}
                      onCast={type    => mutations.castVote.mutate({ meetingId: m.id, itemId: item.id, type })}
                      onClose={()     => mutations.closeVote.mutate({ meetingId: m.id, itemId: item.id })}
                      onPresidentDecide={result => mutations.presidentDecide.mutate({ meetingId: m.id, itemId: item.id, result })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {m.status !== 'IN_PROGRESS' && (
            <div className="rounded-xl border bg-white p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {m.status === 'SCHEDULED' ? 'Réponses convocation' : 'Participants'}
              </p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {m.attendeeList.map(att => (
                  <div key={att.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 border">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {initials(att.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate">{att.name}</p>
                      <p className="text-[10px] text-muted-foreground">{att.apartment}</p>
                    </div>
                    {m.status === 'SCHEDULED'
                      ? <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                          att.rsvp === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                          att.rsvp === 'DECLINED' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                        )}>
                          {att.rsvp === 'ACCEPTED' ? 'Confirmé' : att.rsvp === 'DECLINED' ? 'Excusé' : 'En attente'}
                        </span>
                      : att.present
                        ? <UserCheck size={13} className="text-emerald-500 shrink-0" />
                        : <UserX size={13} className="text-muted-foreground/30 shrink-0" />
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2.5 pt-1">
          {m.status === 'SCHEDULED' && (
            <>
              {!m.convocationSentAt ? (
                <Button size="sm" variant="outline" className="h-9 text-xs gap-2" onClick={() => onSendConvocation(m.id)}>
                  <Send size={12} /> Envoyer convocation
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 h-9">
                  <Mail size={12} /> Convocation envoyée ✓
                </div>
              )}
              <Button size="sm" className="h-9 text-xs gap-2 bg-primary hover:bg-primary/90"
                disabled={mutations.startMeeting.isPending}
                onClick={() => mutations.startMeeting.mutate(m.id)}>
                {mutations.startMeeting.isPending ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Démarrer la réunion
              </Button>
            </>
          )}
          {m.status === 'IN_PROGRESS' && allDone && (
            <Button size="sm" className="h-9 text-xs gap-2 bg-slate-800 hover:bg-slate-900 text-white"
              disabled={mutations.closeMeeting.isPending}
              onClick={() => mutations.closeMeeting.mutate(m.id)}>
              {mutations.closeMeeting.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Clôturer la réunion
            </Button>
          )}
          {m.status === 'COMPLETED' && (
            <Button size="sm" variant="outline" className="h-9 text-xs gap-2" onClick={() => onShowPV(m.id)}>
              <FileText size={12} /> Générer le PV
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ConvocationModal ─────────────────────────────────────────────────────────

function ConvocationModal({ meeting: m, onClose, onConfirm, loading }: {
  meeting: Meeting; onClose: () => void; onConfirm: () => void; loading: boolean
}) {
  const { typeLabel } = useMeetingLabels()
  const date = new Date(m.scheduledAt)
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden" showClose={false}>
        <div className="bg-primary/5 border-b px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Send size={16} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold">Envoyer la convocation</DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Email envoyé à tous les membres ci-dessous</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0"><X size={14} /></button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border bg-slate-50 p-4 space-y-2 text-xs">
            <p className="font-bold text-sm text-foreground">{m.title}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
              <span>{typeLabel[m.type]} · {m.convocationNumber}ème convocation</span>
              <span className="flex items-center gap-1"><Clock size={10} />{date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              {m.location && <span className="flex items-center gap-1"><MapPin size={10} />{m.location}</span>}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{m.attendeeList.length} destinataire{m.attendeeList.length > 1 ? 's' : ''}</p>
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {m.attendeeList.map(att => (
                <div key={att.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50 border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">{initials(att.name)}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-xs truncate">{att.name}</p><p className="text-muted-foreground text-[10px]">{att.apartment}</p></div>
                  <Mail size={11} className="text-muted-foreground/40 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2.5 px-6 py-4 border-t bg-slate-50/60">
          <Button variant="ghost" className="flex-1 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 text-sm gap-2" disabled={loading} onClick={onConfirm}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Confirmer l'envoi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── PVModal ──────────────────────────────────────────────────────────────────

function PVModal({ meeting: m, onClose }: { meeting: Meeting; onClose: () => void }) {
  const { typeLabel } = useMeetingLabels()
  const date    = new Date(m.scheduledAt)
  const present = m.attendeeList.filter(a => a.present).length
  const qOk     = present >= quorumRequired(m.totalEligible) || m.convocationNumber === 2

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto p-0" showClose={false}>
        <div className="flex items-center justify-between px-6 py-5 border-b bg-slate-50">
          <DialogTitle className="flex items-center gap-2.5 text-sm font-bold">
            <FileText size={15} className="text-primary" /> Procès-Verbal de Réunion
          </DialogTitle>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="rounded-xl border bg-slate-50 p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {[
              ['Titre',       m.title],
              ['Type',        typeLabel[m.type]],
              ['Date',        date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })],
              ['Heure',       date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })],
              ['Convocation', `${m.convocationNumber}ème`],
              ...(m.buildingName ? [['Immeuble', m.buildingName]] : []),
              ...(m.location ? [['Lieu', m.location]] : []),
            ].map(([k, v]) => (
              <div key={k}><span className="text-muted-foreground">{k} : </span><span className="font-semibold">{v}</span></div>
            ))}
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Quorum</p>
            {m.convocationNumber === 2
              ? <p className="text-xs">{present} présents / {m.totalEligible} — <span className="font-bold text-blue-600">2ème convocation : quorum non requis</span></p>
              : <p className="text-xs">{present} présents / {m.totalEligible} (requis : {quorumRequired(m.totalEligible)}) — Quorum <span className={cn('font-bold', qOk ? 'text-emerald-600' : 'text-red-600')}>{qOk ? 'atteint ✓' : 'non atteint ✗'}</span></p>
            }
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Résolutions votées</p>
            {m.agenda.map((item, i) => {
              const total = item.pour + item.contre + item.abstention
              const p     = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0
              return (
                <div key={item.id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[10px] text-muted-foreground">Résolution {i + 1}</p><p className="text-xs font-semibold mt-0.5">{item.title}</p></div>
                    {item.result && <Badge variant={item.result === 'ADOPTED' ? 'success' : 'destructive'} className="text-[10px] shrink-0">{item.result === 'ADOPTED' ? 'Adopté' : 'Rejeté'}</Badge>}
                  </div>
                  {item.voteStatus === 'CLOSED' && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center py-2 rounded-lg bg-emerald-50 border border-emerald-100"><p className="font-bold text-emerald-700 text-sm">{item.pour}</p><p className="text-[10px] text-muted-foreground mt-0.5">Pour ({p(item.pour)}%)</p></div>
                      <div className="text-center py-2 rounded-lg bg-red-50 border border-red-100"><p className="font-bold text-red-700 text-sm">{item.contre}</p><p className="text-[10px] text-muted-foreground mt-0.5">Contre ({p(item.contre)}%)</p></div>
                      <div className="text-center py-2 rounded-lg bg-slate-50 border"><p className="font-bold text-slate-700 text-sm">{item.abstention}</p><p className="text-[10px] text-muted-foreground mt-0.5">Abstention</p></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="pt-2 border-t space-y-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Signatures</p>
            <div className="grid grid-cols-2 gap-16">
              {['Le Syndic', 'Le Président du Conseil'].map(role => (
                <div key={role} className="text-center"><div className="h-16 border-b border-dashed border-slate-300 mb-3" /><p className="text-[11px] text-muted-foreground">{role}</p></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t bg-slate-50">
          <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>Fermer</Button>
          <Button size="sm" className="text-xs gap-2" onClick={() => window.print()}><Printer size={12} /> Imprimer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── CreateMeetingDrawer ──────────────────────────────────────────────────────

type BuildingOption = { id: string; name: string; residence_name: string }
type DraftMeeting = {
  title: string; type: Meeting['type']; convocationNumber: 1 | 2
  date: string; time: string; location: string
  buildingId: string
  items: Array<{ id: string; title: string; description: string }>
}

const emptyDraft = (): DraftMeeting => ({
  title: '', type: 'GLOBAL', convocationNumber: 1, date: '', time: '', location: '',
  buildingId: '',
  items: [{ id: makeId(), title: '', description: '' }],
})

function CreateMeetingDrawer({ onClose, onSubmit, loading }: {
  onClose: () => void; onSubmit: (d: DraftMeeting) => void; loading: boolean
}) {
  const [draft, setDraft] = useState<DraftMeeting>(emptyDraft)
  const { data: buildings = [] } = useQuery<BuildingOption[]>({ queryKey: ['union-buildings'], queryFn: () => api.get('/api/union/buildings') })
  const addItem    = () => setDraft(d => ({ ...d, items: [...d.items, { id: makeId(), title: '', description: '' }] }))
  const removeItem = (id: string) => setDraft(d => ({ ...d, items: d.items.filter(it => it.id !== id) }))
  const setItem    = (id: string, key: 'title' | 'description', val: string) =>
    setDraft(d => ({ ...d, items: d.items.map(it => it.id === id ? { ...it, [key]: val } : it) }))
  const valid    = draft.title.trim() && draft.date && draft.buildingId && draft.items.every(it => it.title.trim())
  const inputCls = 'w-full h-10 px-3.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/60'

  return (
    <>
      <motion.div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-white shadow-2xl flex flex-col"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
        <div className="flex items-center justify-between px-6 py-5 border-b bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><CalendarDays size={15} className="text-primary" /></div>
            <div><h2 className="text-sm font-bold">Planifier une réunion</h2><p className="text-[11px] text-muted-foreground mt-0.5">Assemblée générale ou réunion de conseil</p></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Titre *</label>
            <input className={inputCls} placeholder="Ex: Assemblée Générale Ordinaire 2025" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</label>
            <select className={inputCls} value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value as Meeting['type'] }))}>
              <option value="GLOBAL">Assemblée Générale Ordinaire</option>
              <option value="EXCEPTIONAL">AG Extraordinaire</option>
              <option value="NORMAL">Réunion de Conseil</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Convocation</label>
            <div className="grid grid-cols-2 gap-2">
              {([1, 2] as const).map(n => (
                <button key={n} onClick={() => setDraft(d => ({ ...d, convocationNumber: n }))}
                  className={cn('h-10 rounded-xl border text-sm font-semibold transition-all', draft.convocationNumber === n ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-foreground hover:bg-muted')}>
                  {n}ème convocation
                </button>
              ))}
            </div>
            {draft.convocationNumber === 2 && (
              <p className="text-[10px] text-blue-600 flex items-center gap-1.5 bg-blue-50 rounded-lg px-3 py-2">
                <CheckCircle2 size={10} className="shrink-0" /> Quorum non requis — Loi 18-00 art. 30
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date *</label><input type="date" className={inputCls} value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Heure</label><input type="time" className={inputCls} value={draft.time} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lieu</label>
            <input className={inputCls} placeholder="Salle de réunion, en ligne..." value={draft.location} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Building2 size={10} /> Immeuble *</label>
            <select className={inputCls} value={draft.buildingId} onChange={e => setDraft(d => ({ ...d, buildingId: e.target.value }))}>
              <option value="">{buildings.length === 0 ? 'Aucun immeuble disponible' : '— Sélectionner un immeuble —'}</option>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.residence_name} — {b.name}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ordre du jour *</label>
              <button className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors" onClick={addItem}><Plus size={12} /> Ajouter</button>
            </div>
            {draft.items.map((item, i) => (
              <div key={item.id} className="rounded-xl border bg-slate-50 p-3.5 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10"><span className="text-[10px] font-bold text-primary tabular-nums">{i + 1}</span></div>
                  <input className="flex-1 h-9 px-3 rounded-lg border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60" placeholder="Point de l'ordre du jour *" value={item.title} onChange={e => setItem(item.id, 'title', e.target.value)} />
                  {draft.items.length > 1 && (
                    <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors shrink-0"><Trash2 size={12} /></button>
                  )}
                </div>
                <textarea className="w-full px-3 py-2 rounded-lg border bg-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60" rows={2} placeholder="Description (optionnel)" value={item.description} onChange={e => setItem(item.id, 'description', e.target.value)} />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t bg-slate-50/80 flex gap-3 shrink-0">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 gap-2" disabled={!valid || loading} onClick={() => onSubmit(draft)}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <CalendarDays size={13} />} Planifier
          </Button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MeetingSkeleton() {
  return (
    <div className="rounded-2xl border border-l-4 border-l-muted bg-white p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-muted shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
          <div className="flex gap-4"><div className="h-3 bg-muted rounded w-16" /><div className="h-3 bg-muted rounded w-20" /></div>
        </div>
        <div className="w-20 h-8 bg-muted rounded-lg shrink-0" />
      </div>
    </div>
  )
}

// ─── Meetings page ────────────────────────────────────────────────────────────

type Filter = 'ALL' | Meeting['status']

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL',         label: 'Toutes'     },
  { key: 'SCHEDULED',   label: 'Planifiées' },
  { key: 'IN_PROGRESS', label: 'En cours'   },
  { key: 'COMPLETED',   label: 'Terminées'  },
  { key: 'CANCELLED',   label: 'Annulées'   },
]

type ActiveVote = { meetingId: string; itemId: string }

export function Meetings() {
  const { typeLabel, statusConfig, t } = useMeetingLabels()
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [pvId,        setPvId]        = useState<string | null>(null)
  const [convoId,     setConvoId]     = useState<string | null>(null)
  const [filter,      setFilter]      = useState<Filter>('ALL')
  const [activeVote,  setActiveVote]  = useState<ActiveVote | null>(null)

  // Poll every 1.5 s while a vote is open — gives real-time live updates
  const { data: meetings = [], isLoading, error } = useMeetings(activeVote ? 1500 : undefined)
  const mutations = useMeetingMutations()

  const filtered = filter === 'ALL' ? meetings : meetings.filter(m => m.status === filter)

  // Derive the live item from fresh query data so the overlay always has updated counts
  const activeMeeting = activeVote ? meetings.find(m => m.id === activeVote.meetingId) ?? null : null
  const activeItem    = activeMeeting?.agenda.find(i => i.id === activeVote?.itemId) ?? null

  // Auto-dismiss overlay if the meeting somehow disappears
  useEffect(() => {
    if (activeVote && !activeMeeting) setActiveVote(null)
  }, [activeVote, activeMeeting])

  const handleCreate = (draft: DraftMeeting) => {
    mutations.createMeeting.mutate({
      title: draft.title, type: draft.type, convocationNumber: draft.convocationNumber,
      scheduledAt: `${draft.date}T${draft.time || '10:00'}:00`,
      location: draft.location || undefined, totalEligible: 8,
      buildingId: draft.buildingId,
      agenda: draft.items.map(it => ({ title: it.title, description: it.description || undefined })),
    }, { onSuccess: () => setDrawerOpen(false) })
  }

  const pvMeeting    = pvId    ? meetings.find(m => m.id === pvId)    ?? null : null
  const convoMeeting = convoId ? meetings.find(m => m.id === convoId) ?? null : null

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={t('meetings.title')}
        subtitle=""
        actions={
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => setDrawerOpen(true)}>
            <Plus size={13} /> {t('meetings.newMeeting')}
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-4 animate-fade-in">

        {/* Filter tabs */}
        {!isLoading && meetings.length > 0 && (
          <div className="flex gap-1.5 bg-muted/60 p-1 rounded-xl w-fit">
            {FILTERS.map(f => {
              const count = f.key === 'ALL' ? meetings.length : meetings.filter(m => m.status === f.key).length
              if (f.key !== 'ALL' && count === 0) return null
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={cn('flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    filter === f.key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f.label}
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums',
                    filter === f.key ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10'
                  )}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={14} /> Erreur : {(error as Error).message}
          </div>
        )}

        {isLoading && <div className="space-y-3">{[0, 1, 2].map(i => <MeetingSkeleton key={i} />)}</div>}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <CalendarDays size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Aucune réunion {filter !== 'ALL' ? statusConfig[filter as Meeting['status']]?.label.toLowerCase() : ''}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === 'ALL' ? 'Planifiez votre première réunion avec le bouton ci-dessus.' : 'Changez le filtre pour voir d\'autres réunions.'}
            </p>
          </div>
        )}

        {/* Meeting cards */}
        {!isLoading && filtered.map(m => {
          const date         = new Date(m.scheduledAt)
          const cfg          = statusConfig[m.status]
          const presentCount = m.attendeeList.filter(a => a.present).length
          const votedItems   = m.agenda.filter(a => a.voteStatus === 'CLOSED').length
          const isExpanded   = expandedId === m.id

          return (
            <motion.div key={m.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Card className={cn('overflow-hidden border-l-4 transition-shadow hover:shadow-md', cfg.stripe)}>
                <CardContent className="p-0">
                  {m.status === 'IN_PROGRESS' && (
                    <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-5 py-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span className="text-xs font-bold text-amber-700">Réunion en cours</span>
                    </div>
                  )}

                  <div className="flex items-start gap-4 p-5">
                    <div className={cn('flex flex-col items-center justify-center h-14 w-14 rounded-xl shrink-0', dateColor[m.status])}>
                      <span className="text-xl font-black leading-none">{date.getDate()}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide opacity-80 mt-0.5">{date.toLocaleString('fr-MA', { month: 'short' })}</span>
                      <span className="text-[9px] opacity-60">{date.getFullYear()}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-sm font-bold text-foreground">{m.title}</h3>
                        <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{typeLabel[m.type]}</span>
                        {m.convocationNumber === 2 && <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">2ème conv.</span>}
                        {m.convocationSentAt && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Mail size={9} /> Convocation envoyée
                          </span>
                        )}
                      </div>
                      {m.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{m.description}</p>}
                      <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={11} />{date.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}</span>
                        {m.buildingName && <span className="flex items-center gap-1"><Building2 size={11} /> {m.buildingName}</span>}
                        {m.location && <span className="flex items-center gap-1"><MapPin size={11} /> {m.location}</span>}
                        {m.attendeeList.length > 0 && <span className="flex items-center gap-1"><UserCheck size={11} /> {presentCount}/{m.totalEligible} présents</span>}
                        {m.agenda.length > 0 && <span className="flex items-center gap-1"><FileText size={11} /> {votedItems}/{m.agenda.length} points votés</span>}
                      </div>
                    </div>

                    <Button size="sm" variant={isExpanded ? 'secondary' : 'ghost'}
                      className="text-xs h-8 gap-1 shrink-0 self-start"
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                      Détails <ChevronDown size={12} className={cn('transition-transform duration-200', isExpanded && 'rotate-180')} />
                    </Button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden border-t">
                        <DetailPanel
                          meeting={m} mutations={mutations}
                          onShowPV={setPvId} onSendConvocation={setConvoId}
                          onOpenVotingScreen={(meetingId, itemId) => setActiveVote({ meetingId, itemId })}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ─── Full-screen voting overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {activeVote && activeMeeting && activeItem && (
          <VotingOverlay
            key={`${activeVote.meetingId}-${activeVote.itemId}`}
            meeting={activeMeeting}
            item={activeItem}
            onDismiss={() => setActiveVote(null)}
            onCloseVote={() =>
              mutations.closeVote.mutate(
                { meetingId: activeVote.meetingId, itemId: activeVote.itemId },
              )
            }
            onCastForOwner={(_attendeeId, type) =>
              mutations.castVote.mutate({ meetingId: activeVote.meetingId, itemId: activeVote.itemId, type })
            }
            onPresidentDecide={result =>
              mutations.presidentDecide.mutate(
                { meetingId: activeVote.meetingId, itemId: activeVote.itemId, result },
                { onSuccess: () => setActiveVote(null) }
              )
            }
            isCasting={mutations.castVote.isPending}
            isClosing={mutations.closeVote.isPending || mutations.presidentDecide.isPending}
          />
        )}
      </AnimatePresence>

      {/* ─── Drawers & modals ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <CreateMeetingDrawer onClose={() => setDrawerOpen(false)} onSubmit={handleCreate} loading={mutations.createMeeting.isPending} />
        )}
      </AnimatePresence>

      {pvMeeting    && <PVModal meeting={pvMeeting} onClose={() => setPvId(null)} />}
      {convoMeeting && (
        <ConvocationModal
          meeting={convoMeeting} onClose={() => setConvoId(null)}
          onConfirm={() => mutations.sendConvocation.mutate(convoId!, { onSuccess: () => setConvoId(null) })}
          loading={mutations.sendConvocation.isPending}
        />
      )}
    </div>
  )
}
