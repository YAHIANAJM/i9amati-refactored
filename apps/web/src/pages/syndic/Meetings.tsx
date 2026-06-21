import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, MapPin, Users, Clock, ChevronDown, X, Trash2,
  CheckCircle2, XCircle, Activity, Play, FileText,
  Printer, UserCheck, UserX, AlertTriangle, Scale, Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Meeting, AgendaItem } from '@/data/mock/meetings'

// ─── helpers ──────────────────────────────────────────────────────────────────

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

const typeLabel: Record<Meeting['type'], string> = {
  GLOBAL:      'Assemblée Générale',
  EXCEPTIONAL: 'AG Extraordinaire',
  NORMAL:      'Réunion',
}

const statusConfig: Record<Meeting['status'], { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' }> = {
  SCHEDULED:   { label: 'Planifiée', variant: 'info' },
  IN_PROGRESS: { label: 'En cours',  variant: 'warning' },
  COMPLETED:   { label: 'Terminée',  variant: 'success' },
  CANCELLED:   { label: 'Annulée',   variant: 'secondary' },
}

function quorumRequired(totalEligible: number) {
  return Math.ceil(totalEligible * 0.5)
}

// ─── API hooks ────────────────────────────────────────────────────────────────

function useMeetings() {
  return useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn:  () => api.get('/api/meetings'),
  })
}

function useMeetingMutations() {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: ['meetings'] })

  const startMeeting = useMutation({
    mutationFn: (id: string) => api.patch(`/api/meetings/${id}/start`),
    onSuccess:  refetch,
  })
  const closeMeeting = useMutation({
    mutationFn: (id: string) => api.patch(`/api/meetings/${id}/close`),
    onSuccess:  refetch,
  })
  const togglePresence = useMutation({
    mutationFn: ({ meetingId, attendeeId }: { meetingId: string; attendeeId: string }) =>
      api.patch(`/api/meetings/${meetingId}/attendees/${attendeeId}/presence`),
    onSuccess: refetch,
  })
  const openVote = useMutation({
    mutationFn: ({ meetingId, itemId }: { meetingId: string; itemId: string }) =>
      api.post(`/api/meetings/${meetingId}/agenda/${itemId}/open`),
    onSuccess: refetch,
  })
  const castVote = useMutation({
    mutationFn: ({ meetingId, itemId, type }: { meetingId: string; itemId: string; type: 'pour' | 'contre' | 'abstention' }) =>
      api.post(`/api/meetings/${meetingId}/agenda/${itemId}/cast`, { type }),
    // Optimistic: increment the count locally so the UI is instant
    onMutate: async ({ meetingId, itemId, type }) => {
      await qc.cancelQueries({ queryKey: ['meetings'] })
      const prev = qc.getQueryData<Meeting[]>(['meetings'])
      qc.setQueryData<Meeting[]>(['meetings'], old =>
        old?.map(m => m.id !== meetingId ? m : {
          ...m,
          agenda: m.agenda.map(it => it.id !== itemId ? it : { ...it, [type]: it[type] + 1 }),
        })
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['meetings'], ctx.prev) },
    onSettled: refetch,
  })
  const closeVote = useMutation({
    mutationFn: ({ meetingId, itemId }: { meetingId: string; itemId: string }) =>
      api.post(`/api/meetings/${meetingId}/agenda/${itemId}/close`),
    onSuccess: refetch,
  })
  const presidentDecide = useMutation({
    mutationFn: ({ meetingId, itemId, result }: { meetingId: string; itemId: string; result: 'ADOPTED' | 'REJECTED' }) =>
      api.post(`/api/meetings/${meetingId}/agenda/${itemId}/president`, { result }),
    onSuccess: refetch,
  })
  const createMeeting = useMutation({
    mutationFn: (body: object) => api.post('/api/meetings', body),
    onSuccess: refetch,
  })

  return { startMeeting, closeMeeting, togglePresence, openVote, castVote, closeVote, presidentDecide, createMeeting }
}

// ─── VoteBar ──────────────────────────────────────────────────────────────────

function VoteBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ─── AgendaItemRow ────────────────────────────────────────────────────────────

type AgendaRowProps = {
  item: AgendaItem
  isLive: boolean
  quorumOk: boolean
  noQuorumRequired: boolean
  onCast: (type: 'pour' | 'contre' | 'abstention') => void
  onOpen: () => void
  onClose: () => void
  onPresidentDecide: (d: 'ADOPTED' | 'REJECTED') => void
  loading: boolean
}

function AgendaItemRow({ item, isLive, quorumOk, noQuorumRequired, onCast, onOpen, onClose, onPresidentDecide, loading }: AgendaRowProps) {
  const total   = item.pour + item.contre + item.abstention
  const canVote = quorumOk || noQuorumRequired
  const isTie   = item.voteStatus === 'CLOSED' && item.result === undefined

  return (
    <div className="rounded-xl border bg-white p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">{item.title}</p>
          {item.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
          )}
        </div>
        {item.voteStatus === 'CLOSED' && item.result && (
          <Badge variant={item.result === 'ADOPTED' ? 'success' : 'destructive'} className="shrink-0 text-[10px] gap-0.5">
            {item.result === 'ADOPTED' ? <><CheckCircle2 size={9} />Adopté</> : <><XCircle size={9} />Rejeté</>}
          </Badge>
        )}
        {isTie && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 shrink-0"><Scale size={10} /> Égalité</span>
        )}
        {item.voteStatus === 'OPEN' && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Vote en cours
          </span>
        )}
        {item.voteStatus === 'PENDING' && isLive && (
          <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 shrink-0" disabled={!canVote || loading}
            title={!canVote ? "Quorum non atteint — vote impossible (1ère convocation)" : undefined} onClick={onOpen}>
            <Activity size={10} className="mr-1" /> Ouvrir le vote
          </Button>
        )}
      </div>

      {(item.voteStatus === 'OPEN' || item.voteStatus === 'CLOSED') && (
        <div className="space-y-1.5">
          <VoteBar label="Pour"       count={item.pour}       total={total} color="bg-emerald-500" />
          <VoteBar label="Contre"     count={item.contre}     total={total} color="bg-red-500" />
          <VoteBar label="Abstention" count={item.abstention} total={total} color="bg-slate-300" />
          {item.voteStatus === 'OPEN' && (
            <div className="flex gap-1.5 pt-1">
              <Button size="sm" className="flex-1 h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading} onClick={() => onCast('pour')}>+1 Pour</Button>
              <Button size="sm" className="flex-1 h-7 text-[11px] bg-red-600 hover:bg-red-700 text-white"          disabled={loading} onClick={() => onCast('contre')}>+1 Contre</Button>
              <Button size="sm" className="flex-1 h-7 text-[11px] bg-slate-500 hover:bg-slate-600 text-white"      disabled={loading} onClick={() => onCast('abstention')}>+1 Abst.</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5 shrink-0" disabled={loading} onClick={onClose}>Clôturer</Button>
            </div>
          )}
          {isTie && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 space-y-2">
              <p className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                <Scale size={11} />Égalité — le Président du Conseil exerce sa voix prépondérante (Loi 18-00)
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading} onClick={() => onPresidentDecide('ADOPTED')}>Décision : Adopté</Button>
                <Button size="sm" className="flex-1 h-7 text-[11px] bg-red-600 hover:bg-red-700 text-white"         disabled={loading} onClick={() => onPresidentDecide('REJECTED')}>Décision : Rejeté</Button>
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
  meeting: Meeting
  mutations: ReturnType<typeof useMeetingMutations>
  onShowPV: (id: string) => void
}

function DetailPanel({ meeting: m, mutations, onShowPV }: DetailPanelProps) {
  const present        = m.attendeeList.filter(a => a.present).length
  const required       = quorumRequired(m.totalEligible)
  const quorumReached  = present >= required
  const noQuorumReq    = m.convocationNumber === 2
  const quorumOk       = quorumReached || noQuorumReq
  const quorumPct      = Math.min(100, Math.round((present / m.totalEligible) * 100))
  const rsvpAccepted   = m.attendeeList.filter(a => a.rsvp === 'ACCEPTED').length
  const allDone        = m.agenda.length > 0 && m.agenda.every(i => i.voteStatus === 'CLOSED' && i.result !== undefined)
  const anyLoading     = mutations.castVote.isPending || mutations.openVote.isPending || mutations.closeVote.isPending || mutations.presidentDecide.isPending || mutations.togglePresence.isPending

  return (
    <div className="px-5 pb-5 pt-3">
      <div className="rounded-xl bg-slate-50 border p-4 space-y-4">

        {/* Quorum */}
        <div className="space-y-2">
          {noQuorumReq && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
              <CheckCircle2 size={13} className="text-blue-500 shrink-0" />
              <p className="text-[11px] font-semibold text-blue-800">2ème convocation — quorum non requis (Loi 18-00 art. 30)</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            {quorumReached ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" /> : <XCircle size={15} className="text-red-400 shrink-0" />}
            <div className="flex-1">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-medium">
                  Présents physiquement : {present}/{m.totalEligible}
                  {!noQuorumReq && <span className="text-muted-foreground"> (requis : {required})</span>}
                </span>
                <span className={`font-bold ${quorumReached ? 'text-emerald-600' : 'text-red-500'}`}>
                  {quorumReached ? 'Quorum atteint ✓' : noQuorumReq ? '—' : 'Non atteint'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${quorumReached ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${quorumPct}%` }} />
              </div>
            </div>
          </div>
          {m.status === 'IN_PROGRESS' && !quorumOk && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-800">Quorum non atteint — marquez les présences avant d'ouvrir les votes. Si insuffisant, une 2ème convocation sera nécessaire.</p>
            </div>
          )}
        </div>

        {/* Pointage */}
        {m.status === 'IN_PROGRESS' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pointage — Présence physique</p>
              <span className="text-[10px] text-muted-foreground">{rsvpAccepted} confirmés · {present} présents</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {m.attendeeList.map(att => (
                <button key={att.id}
                  onClick={() => mutations.togglePresence.mutate({ meetingId: m.id, attendeeId: att.id })}
                  disabled={anyLoading}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${att.present ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-dashed hover:border-slate-300'}`}
                >
                  <div className="min-w-0">
                    <p className={`text-[11px] font-medium truncate ${att.present ? 'text-emerald-900' : 'text-muted-foreground'}`}>{att.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground/70">{att.apartment}</span>
                      {att.rsvp === 'ACCEPTED' && <span className="text-[9px] font-medium text-blue-500 bg-blue-50 px-1 rounded">Confirmé</span>}
                      {att.rsvp === 'DECLINED' && <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1 rounded">Excusé</span>}
                    </div>
                  </div>
                  {att.present ? <UserCheck size={13} className="text-emerald-600 shrink-0" /> : <UserX size={13} className="text-muted-foreground/30 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Agenda + attendees (non IN_PROGRESS: two-column layout) */}
        <div className={m.status === 'IN_PROGRESS' ? '' : 'grid grid-cols-[1fr_200px] gap-4'}>
          <div className="space-y-2 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ordre du jour</p>
            {m.agenda.map((item, i) => (
              <div key={item.id} className="flex gap-2">
                <span className="text-[10px] font-bold text-muted-foreground mt-2 shrink-0 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1 min-w-0">
                  <AgendaItemRow
                    item={item}
                    isLive={m.status === 'IN_PROGRESS'}
                    quorumOk={quorumReached}
                    noQuorumRequired={noQuorumReq}
                    loading={anyLoading}
                    onCast={type  => mutations.castVote.mutate({ meetingId: m.id, itemId: item.id, type })}
                    onOpen={() => mutations.openVote.mutate({ meetingId: m.id, itemId: item.id })}
                    onClose={() => mutations.closeVote.mutate({ meetingId: m.id, itemId: item.id })}
                    onPresidentDecide={result => mutations.presidentDecide.mutate({ meetingId: m.id, itemId: item.id, result })}
                  />
                </div>
              </div>
            ))}
          </div>

          {m.status !== 'IN_PROGRESS' && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {m.status === 'SCHEDULED' ? 'Réponses convocation' : 'Participants'}
              </p>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {m.attendeeList.map(att => (
                  <div key={att.id} className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-white border text-xs">
                    <div className="min-w-0">
                      <p className="font-medium truncate text-[11px]">{att.name}</p>
                      <p className="text-muted-foreground text-[10px]">{att.apartment}</p>
                    </div>
                    {m.status === 'SCHEDULED'
                      ? <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${att.rsvp === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : att.rsvp === 'DECLINED' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                          {att.rsvp === 'ACCEPTED' ? 'Confirmé' : att.rsvp === 'DECLINED' ? 'Excusé' : 'En attente'}
                        </span>
                      : att.present ? <UserCheck size={12} className="text-emerald-500 shrink-0" /> : <UserX size={12} className="text-muted-foreground/40 shrink-0" />
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(m.status === 'SCHEDULED' || (m.status === 'IN_PROGRESS' && allDone) || m.status === 'COMPLETED') && (
          <div className="flex gap-2 pt-1 border-t">
            {m.status === 'SCHEDULED' && (
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={mutations.startMeeting.isPending}
                onClick={() => mutations.startMeeting.mutate(m.id)}>
                {mutations.startMeeting.isPending ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />} Démarrer la réunion
              </Button>
            )}
            {m.status === 'IN_PROGRESS' && allDone && (
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-slate-800 hover:bg-slate-900 text-white"
                disabled={mutations.closeMeeting.isPending}
                onClick={() => mutations.closeMeeting.mutate(m.id)}>
                {mutations.closeMeeting.isPending && <Loader2 size={11} className="animate-spin" />} Clôturer la réunion
              </Button>
            )}
            {m.status === 'COMPLETED' && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onShowPV(m.id)}>
                <FileText size={11} /> Générer le PV
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PVModal ──────────────────────────────────────────────────────────────────

function PVModal({ meeting: m, onClose }: { meeting: Meeting; onClose: () => void }) {
  const date     = new Date(m.scheduledAt)
  const present  = m.attendeeList.filter(a => a.present).length
  const required = quorumRequired(m.totalEligible)
  const quorum   = present >= required || m.convocationNumber === 2

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto" showClose={false}>
        <div className="flex items-center gap-2 px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold">
            <FileText size={15} /> Procès-Verbal de Réunion
          </DialogTitle>
        </div>
        <div className="px-6 pb-2 space-y-5 text-sm">
          <div className="rounded-lg bg-slate-50 border p-3.5 text-xs space-y-1.5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div><span className="text-muted-foreground">Titre : </span><span className="font-semibold">{m.title}</span></div>
              <div><span className="text-muted-foreground">Type : </span><span className="font-semibold">{typeLabel[m.type]}</span></div>
              <div><span className="text-muted-foreground">Date : </span><span className="font-semibold">{date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
              <div><span className="text-muted-foreground">Heure : </span><span className="font-semibold">{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
              <div><span className="text-muted-foreground">Convocation : </span><span className="font-semibold">{m.convocationNumber}ème</span></div>
              {m.location && <div><span className="text-muted-foreground">Lieu : </span><span className="font-semibold">{m.location}</span></div>}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">Quorum</p>
            {m.convocationNumber === 2
              ? <p className="text-xs">{present} présents sur {m.totalEligible} — <span className="font-bold text-blue-600">2ème convocation : quorum non requis</span></p>
              : <p className="text-xs">{present} présents sur {m.totalEligible} (requis : {required}) — Quorum <span className={`font-bold ${quorum ? 'text-emerald-600' : 'text-red-600'}`}>{quorum ? 'atteint ✓' : 'non atteint ✗'}</span></p>
            }
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Résolutions votées</p>
            <div className="space-y-2.5">
              {m.agenda.map((item, i) => {
                const total = item.pour + item.contre + item.abstention
                const pct   = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0
                return (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><span className="text-[10px] font-bold text-muted-foreground">Résolution {i + 1} — </span><span className="text-xs font-semibold">{item.title}</span></div>
                      {item.result && <Badge variant={item.result === 'ADOPTED' ? 'success' : 'destructive'} className="text-[10px] shrink-0">{item.result === 'ADOPTED' ? 'Adopté' : 'Rejeté'}</Badge>}
                    </div>
                    {item.voteStatus === 'CLOSED' && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center py-1.5 rounded bg-emerald-50 border border-emerald-100"><p className="font-bold text-emerald-700">{item.pour}</p><p className="text-[10px] text-muted-foreground">Pour ({pct(item.pour)}%)</p></div>
                        <div className="text-center py-1.5 rounded bg-red-50 border border-red-100"><p className="font-bold text-red-700">{item.contre}</p><p className="text-[10px] text-muted-foreground">Contre ({pct(item.contre)}%)</p></div>
                        <div className="text-center py-1.5 rounded bg-slate-50 border"><p className="font-bold text-slate-700">{item.abstention}</p><p className="text-[10px] text-muted-foreground">Abstention ({pct(item.abstention)}%)</p></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-4">Signatures</p>
            <div className="grid grid-cols-2 gap-8">
              {['Le Syndic', 'Le Président du Conseil'].map(role => (
                <div key={role} className="text-center"><div className="h-14 border-b border-dashed mb-2" /><p className="text-[11px] text-muted-foreground">{role}</p></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t px-6 pb-5">
          <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>Fermer</Button>
          <Button size="sm" className="text-xs gap-1.5" onClick={() => window.print()}><Printer size={12} /> Imprimer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── CreateMeetingDrawer ──────────────────────────────────────────────────────

type DraftMeeting = {
  title: string; type: Meeting['type']; convocationNumber: 1 | 2
  date: string; time: string; location: string
  items: Array<{ id: string; title: string; description: string }>
}

const emptyDraft = (): DraftMeeting => ({
  title: '', type: 'GLOBAL', convocationNumber: 1,
  date: '', time: '', location: '',
  items: [{ id: makeId(), title: '', description: '' }],
})

function CreateMeetingDrawer({ onClose, onSubmit, loading }: { onClose: () => void; onSubmit: (d: DraftMeeting) => void; loading: boolean }) {
  const [draft, setDraft] = useState<DraftMeeting>(emptyDraft)
  const addItem    = () => setDraft(d => ({ ...d, items: [...d.items, { id: makeId(), title: '', description: '' }] }))
  const removeItem = (id: string) => setDraft(d => ({ ...d, items: d.items.filter(it => it.id !== id) }))
  const setItem    = (id: string, key: 'title' | 'description', val: string) =>
    setDraft(d => ({ ...d, items: d.items.map(it => it.id === id ? { ...it, [key]: val } : it) }))
  const valid      = draft.title.trim() && draft.date && draft.items.every(it => it.title.trim())
  const inputCls   = 'w-full h-9 px-3 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition'

  return (
    <>
      <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[460px] bg-white shadow-2xl flex flex-col"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div><h2 className="text-sm font-bold">Planifier une réunion</h2><p className="text-[11px] text-muted-foreground mt-0.5">Renseigner les détails de la nouvelle assemblée</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Titre *</label>
            <input className={inputCls} placeholder="Ex: Assemblée Générale Ordinaire 2025" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Type</label>
            <select className={inputCls} value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value as Meeting['type'] }))}>
              <option value="GLOBAL">Assemblée Générale Ordinaire</option>
              <option value="EXCEPTIONAL">AG Extraordinaire</option>
              <option value="NORMAL">Réunion de Conseil</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Convocation</label>
            <div className="flex gap-2">
              {([1, 2] as const).map(n => (
                <button key={n} onClick={() => setDraft(d => ({ ...d, convocationNumber: n }))}
                  className={`flex-1 h-9 rounded-lg border text-sm font-semibold transition-all ${draft.convocationNumber === n ? 'bg-primary text-white border-primary' : 'bg-white text-foreground hover:bg-muted'}`}>
                  {n}ère convocation
                </button>
              ))}
            </div>
            {draft.convocationNumber === 2 && <p className="text-[10px] text-blue-600">Quorum non requis — délibère valablement quel que soit le nombre de présents (Loi 18-00 art. 30).</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Date *</label><input type="date" className={inputCls} value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Heure</label><input type="time" className={inputCls} value={draft.time} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Lieu</label>
            <input className={inputCls} placeholder="Salle de réunion, en ligne..." value={draft.location} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ordre du jour *</label>
              <button className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5" onClick={addItem}><Plus size={11} /> Ajouter un point</button>
            </div>
            {draft.items.map((item, i) => (
              <div key={item.id} className="rounded-lg border p-3 space-y-2 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground shrink-0 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <input className="flex-1 h-8 px-2.5 rounded-md border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/25" placeholder="Point de l'ordre du jour *" value={item.title} onChange={e => setItem(item.id, 'title', e.target.value)} />
                  {draft.items.length > 1 && <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"><Trash2 size={12} /></button>}
                </div>
                <textarea className="w-full px-2.5 py-1.5 rounded-md border bg-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/25" rows={2} placeholder="Description (optionnel)" value={item.description} onChange={e => setItem(item.id, 'description', e.target.value)} />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3 shrink-0">
          <Button variant="ghost" className="flex-1 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 text-sm" disabled={!valid || loading} onClick={() => onSubmit(draft)}>
            {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Planifier
          </Button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Meetings page ────────────────────────────────────────────────────────────

export function Meetings() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pvId, setPvId]             = useState<string | null>(null)

  const { data: meetings = [], isLoading, error } = useMeetings()
  const mutations = useMeetingMutations()

  const handleCreate = (draft: DraftMeeting) => {
    mutations.createMeeting.mutate({
      title:             draft.title,
      type:              draft.type,
      convocationNumber: draft.convocationNumber,
      scheduledAt:       `${draft.date}T${draft.time || '10:00'}:00`,
      location:          draft.location || undefined,
      totalEligible:     8,
      agenda:            draft.items.map(it => ({ title: it.title, description: it.description || undefined })),
    }, { onSuccess: () => setDrawerOpen(false) })
  }

  const pvMeeting = pvId ? meetings.find(m => m.id === pvId) ?? null : null

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Réunions & AG" subtitle="Assemblées générales et réunions de copropriété" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Réunions & AG" subtitle="Assemblées générales et réunions de copropriété" />
        <div className="flex-1 flex items-center justify-center text-sm text-destructive">
          Erreur de chargement : {(error as Error).message}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Réunions & AG"
        subtitle="Assemblées générales et réunions de copropriété"
        actions={
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => setDrawerOpen(true)}>
            <Plus size={13} /> Planifier une réunion
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-3 animate-fade-in">
        {meetings.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            Aucune réunion planifiée. Créez-en une avec le bouton ci-dessus.
          </div>
        )}
        {meetings.map(m => {
          const date         = new Date(m.scheduledAt)
          const cfg          = statusConfig[m.status]
          const presentCount = m.attendeeList.filter(a => a.present).length
          const isExpanded   = expandedId === m.id

          return (
            <Card key={m.id} className="overflow-hidden hover:shadow-sm transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-5">
                  <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl bg-primary/10 shrink-0">
                    <span className="text-xl font-bold text-primary leading-none">{date.getDate()}</span>
                    <span className="text-[11px] text-primary/70 uppercase tracking-wide">{date.toLocaleString('fr-MA', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold">{m.title}</h3>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{typeLabel[m.type]}</span>
                      {m.convocationNumber === 2 && <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">2ème convocation</span>}
                    </div>
                    {m.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{m.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={11} />{date.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}</span>
                      {m.location && <span className="flex items-center gap-1"><MapPin size={11} /> {m.location}</span>}
                      {m.attendeeList.length > 0 && <span className="flex items-center gap-1"><Users size={11} /> {presentCount}/{m.totalEligible} présents</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 items-center">
                    {m.status === 'SCHEDULED' && <Button size="sm" variant="outline" className="text-xs h-8">Envoyer convocation</Button>}
                    {m.status === 'IN_PROGRESS' && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 h-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />En cours
                      </span>
                    )}
                    <Button size="sm" variant={isExpanded ? 'secondary' : 'ghost'} className="text-xs h-8 gap-1"
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                      Détails <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden border-t">
                      <DetailPanel meeting={m} mutations={mutations} onShowPV={setPvId} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <CreateMeetingDrawer onClose={() => setDrawerOpen(false)} onSubmit={handleCreate} loading={mutations.createMeeting.isPending} />
        )}
      </AnimatePresence>

      {pvMeeting && <PVModal meeting={pvMeeting} onClose={() => setPvId(null)} />}
    </div>
  )
}
