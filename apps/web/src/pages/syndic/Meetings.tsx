import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, MapPin, Users, Clock, ChevronDown, X, Trash2,
  CheckCircle2, XCircle, Activity, Play, FileText,
  Printer, UserCheck, UserX,
} from 'lucide-react'
import { mockMeetings, type Meeting, type AgendaItem } from '@/data/mock/meetings'

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
  onCast: (type: 'pour' | 'contre' | 'abstention') => void
  onOpen: () => void
  onClose: () => void
}

function AgendaItemRow({ item, isLive, onCast, onOpen, onClose }: AgendaRowProps) {
  const total = item.pour + item.contre + item.abstention
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
          <Badge
            variant={item.result === 'ADOPTED' ? 'success' : 'destructive'}
            className="shrink-0 text-[10px] gap-0.5"
          >
            {item.result === 'ADOPTED'
              ? <><CheckCircle2 size={9} />Adopté</>
              : <><XCircle size={9} />Rejeté</>
            }
          </Badge>
        )}
        {item.voteStatus === 'OPEN' && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Vote en cours
          </span>
        )}
        {item.voteStatus === 'PENDING' && isLive && (
          <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 shrink-0" onClick={onOpen}>
            <Activity size={10} className="mr-1" /> Ouvrir le vote
          </Button>
        )}
      </div>

      {(item.voteStatus === 'OPEN' || item.voteStatus === 'CLOSED') && (
        <div className="space-y-1.5">
          <VoteBar label="Pour"        count={item.pour}        total={total} color="bg-emerald-500" />
          <VoteBar label="Contre"      count={item.contre}      total={total} color="bg-red-500" />
          <VoteBar label="Abstention"  count={item.abstention}  total={total} color="bg-slate-300" />
          {item.voteStatus === 'OPEN' && (
            <div className="flex gap-1.5 pt-1">
              <Button size="sm" className="flex-1 h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onCast('pour')}>+1 Pour</Button>
              <Button size="sm" className="flex-1 h-7 text-[11px] bg-red-600 hover:bg-red-700 text-white"          onClick={() => onCast('contre')}>+1 Contre</Button>
              <Button size="sm" className="flex-1 h-7 text-[11px] bg-slate-500 hover:bg-slate-600 text-white"      onClick={() => onCast('abstention')}>+1 Abst.</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5 shrink-0" onClick={onClose}>Clôturer</Button>
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
  onCastVote:    (meetingId: string, itemId: string, type: 'pour' | 'contre' | 'abstention') => void
  onOpenVote:    (meetingId: string, itemId: string) => void
  onCloseVote:   (meetingId: string, itemId: string) => void
  onStartMeeting: (meetingId: string) => void
  onCloseMeeting: (meetingId: string) => void
  onShowPV:      (meetingId: string) => void
}

function DetailPanel({ meeting, onCastVote, onOpenVote, onCloseVote, onStartMeeting, onCloseMeeting, onShowPV }: DetailPanelProps) {
  const present         = meeting.attendeeList.filter(a => a.present).length
  const quorumRequired  = Math.ceil(meeting.totalEligible * 0.5)
  const quorumReached   = present >= quorumRequired
  const quorumPct       = Math.min(100, Math.round((present / meeting.totalEligible) * 100))
  const allVoted        = meeting.agenda.length > 0 && meeting.agenda.every(i => i.voteStatus === 'CLOSED')

  return (
    <div className="px-5 pb-5 pt-3">
      <div className="rounded-xl bg-slate-50 border p-4 space-y-4">
        {/* Quorum bar */}
        <div className="flex items-center gap-3">
          {quorumReached
            ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            : <XCircle      size={15} className="text-red-400    shrink-0" />
          }
          <div className="flex-1">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-medium text-foreground">
                Quorum — {meeting.attendeeList.length > 0 ? `${present}/${meeting.totalEligible} présents` : 'liste non définie'}
              </span>
              <span className={`font-bold ${quorumReached ? 'text-emerald-600' : 'text-red-500'}`}>
                {quorumReached ? 'Atteint ✓' : 'Non atteint'}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${quorumReached ? 'bg-emerald-500' : 'bg-red-400'}`}
                style={{ width: `${quorumPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-[1fr_200px] gap-4">
          {/* Agenda */}
          <div className="space-y-2 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ordre du jour</p>
            {meeting.agenda.map((item, i) => (
              <div key={item.id} className="flex gap-2">
                <span className="text-[10px] font-bold text-muted-foreground mt-2 shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <AgendaItemRow
                    item={item}
                    isLive={meeting.status === 'IN_PROGRESS'}
                    onCast={type  => onCastVote(meeting.id, item.id, type)}
                    onOpen={()    => onOpenVote(meeting.id, item.id)}
                    onClose={()   => onCloseVote(meeting.id, item.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Participants</p>
            {meeting.attendeeList.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">Aucun participant enregistré.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {meeting.attendeeList.map(att => (
                  <div key={att.id} className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-white border text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate text-[11px]">{att.name}</p>
                      <p className="text-muted-foreground text-[10px]">{att.apartment}</p>
                    </div>
                    {att.present
                      ? <UserCheck size={12} className="text-emerald-500 shrink-0" />
                      : <UserX    size={12} className="text-muted-foreground/40 shrink-0" />
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        {(meeting.status === 'SCHEDULED' || (meeting.status === 'IN_PROGRESS' && allVoted) || meeting.status === 'COMPLETED') && (
          <div className="flex gap-2 pt-1 border-t">
            {meeting.status === 'SCHEDULED' && (
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onStartMeeting(meeting.id)}>
                <Play size={11} /> Démarrer la réunion
              </Button>
            )}
            {meeting.status === 'IN_PROGRESS' && allVoted && (
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-slate-800 hover:bg-slate-900 text-white" onClick={() => onCloseMeeting(meeting.id)}>
                Clôturer la réunion
              </Button>
            )}
            {meeting.status === 'COMPLETED' && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onShowPV(meeting.id)}>
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

function PVModal({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const date    = new Date(meeting.scheduledAt)
  const present = meeting.attendeeList.filter(a => a.present).length
  const quorum  = present >= Math.ceil(meeting.totalEligible * 0.5)

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto" showClose={false}>
        <div className="flex items-center gap-2 px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold">
            <FileText size={15} /> Procès-Verbal de Réunion
          </DialogTitle>
        </div>

        <div className="px-6 pb-2 space-y-5 text-sm" id="pv-print">
          {/* Info header */}
          <div className="rounded-lg bg-slate-50 border p-3.5 text-xs space-y-1.5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div><span className="text-muted-foreground">Titre : </span><span className="font-semibold">{meeting.title}</span></div>
              <div><span className="text-muted-foreground">Type : </span><span className="font-semibold">{typeLabel[meeting.type]}</span></div>
              <div><span className="text-muted-foreground">Date : </span><span className="font-semibold">{date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
              <div><span className="text-muted-foreground">Heure : </span><span className="font-semibold">{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
              {meeting.location && (
                <div className="col-span-2"><span className="text-muted-foreground">Lieu : </span><span className="font-semibold">{meeting.location}</span></div>
              )}
            </div>
          </div>

          {/* Quorum */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">Quorum</p>
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">{present}</span> copropriétaires présents sur <span className="font-semibold">{meeting.totalEligible}</span> membres éligibles
              {' '}— Quorum{' '}
              <span className={`font-bold ${quorum ? 'text-emerald-600' : 'text-red-600'}`}>
                {quorum ? 'atteint ✓' : 'non atteint ✗'}
              </span>
            </p>
          </div>

          {/* Résolutions */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Résolutions votées</p>
            <div className="space-y-2.5">
              {meeting.agenda.map((item, i) => {
                const total = item.pour + item.contre + item.abstention
                const pct   = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0
                return (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground">Résolution {i + 1} — </span>
                        <span className="text-xs font-semibold">{item.title}</span>
                      </div>
                      {item.result && (
                        <Badge variant={item.result === 'ADOPTED' ? 'success' : 'destructive'} className="text-[10px] shrink-0">
                          {item.result === 'ADOPTED' ? 'Adopté' : 'Rejeté'}
                        </Badge>
                      )}
                    </div>
                    {item.voteStatus === 'CLOSED' && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center py-1.5 rounded bg-emerald-50 border border-emerald-100">
                          <p className="font-bold text-emerald-700">{item.pour}</p>
                          <p className="text-[10px] text-muted-foreground">Pour ({pct(item.pour)}%)</p>
                        </div>
                        <div className="text-center py-1.5 rounded bg-red-50 border border-red-100">
                          <p className="font-bold text-red-700">{item.contre}</p>
                          <p className="text-[10px] text-muted-foreground">Contre ({pct(item.contre)}%)</p>
                        </div>
                        <div className="text-center py-1.5 rounded bg-slate-50 border">
                          <p className="font-bold text-slate-700">{item.abstention}</p>
                          <p className="text-[10px] text-muted-foreground">Abstention ({pct(item.abstention)}%)</p>
                        </div>
                      </div>
                    )}
                    {item.voteStatus !== 'CLOSED' && (
                      <p className="text-[11px] text-muted-foreground italic">Vote non effectué.</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-2 border-t">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-4">Signatures</p>
            <div className="grid grid-cols-2 gap-8">
              {['Le Syndic', 'Le Président du Conseil'].map(role => (
                <div key={role} className="text-center">
                  <div className="h-14 border-b border-dashed mb-2" />
                  <p className="text-[11px] text-muted-foreground">{role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t px-6 pb-5">
          <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>Fermer</Button>
          <Button size="sm" className="text-xs gap-1.5" onClick={() => window.print()}>
            <Printer size={12} /> Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── CreateMeetingDrawer ──────────────────────────────────────────────────────

type DraftMeeting = {
  title:    string
  type:     Meeting['type']
  date:     string
  time:     string
  location: string
  items:    Array<{ id: string; title: string; description: string }>
}

const emptyDraft = (): DraftMeeting => ({
  title: '', type: 'GLOBAL', date: '', time: '', location: '',
  items: [{ id: makeId(), title: '', description: '' }],
})

function CreateMeetingDrawer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (d: DraftMeeting) => void }) {
  const [draft, setDraft] = useState<DraftMeeting>(emptyDraft)

  const addItem    = () => setDraft(d => ({ ...d, items: [...d.items, { id: makeId(), title: '', description: '' }] }))
  const removeItem = (id: string) => setDraft(d => ({ ...d, items: d.items.filter(it => it.id !== id) }))
  const setItem    = (id: string, key: 'title' | 'description', val: string) =>
    setDraft(d => ({ ...d, items: d.items.map(it => it.id === id ? { ...it, [key]: val } : it) }))

  const valid = draft.title.trim() && draft.date && draft.items.every(it => it.title.trim())

  const inputCls = 'w-full h-9 px-3 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition'

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[460px] bg-white shadow-2xl flex flex-col"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-sm font-bold">Planifier une réunion</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Renseigner les détails de la nouvelle assemblée</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Titre *</label>
            <input
              className={inputCls}
              placeholder="Ex: Assemblée Générale Ordinaire 2025"
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Type</label>
            <select
              className={inputCls}
              value={draft.type}
              onChange={e => setDraft(d => ({ ...d, type: e.target.value as Meeting['type'] }))}
            >
              <option value="GLOBAL">Assemblée Générale Ordinaire</option>
              <option value="EXCEPTIONAL">AG Extraordinaire</option>
              <option value="NORMAL">Réunion de Conseil</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Date *</label>
              <input type="date" className={inputCls} value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Heure</label>
              <input type="time" className={inputCls} value={draft.time} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Lieu</label>
            <input
              className={inputCls}
              placeholder="Salle de réunion, en ligne..."
              value={draft.location}
              onChange={e => setDraft(d => ({ ...d, location: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ordre du jour *</label>
              <button className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5" onClick={addItem}>
                <Plus size={11} /> Ajouter un point
              </button>
            </div>
            {draft.items.map((item, i) => (
              <div key={item.id} className="rounded-lg border p-3 space-y-2 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground shrink-0 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <input
                    className="flex-1 h-8 px-2.5 rounded-md border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Point de l'ordre du jour *"
                    value={item.title}
                    onChange={e => setItem(item.id, 'title', e.target.value)}
                  />
                  {draft.items.length > 1 && (
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <textarea
                  className="w-full px-2.5 py-1.5 rounded-md border bg-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/25"
                  rows={2}
                  placeholder="Description (optionnel)"
                  value={item.description}
                  onChange={e => setItem(item.id, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 shrink-0">
          <Button variant="ghost" className="flex-1 text-sm" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 text-sm" disabled={!valid} onClick={() => onSubmit(draft)}>Planifier</Button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Meetings page ────────────────────────────────────────────────────────────

export function Meetings() {
  const [meetings, setMeetings]     = useState<Meeting[]>(mockMeetings)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pvId, setPvId]             = useState<string | null>(null)

  const castVote = useCallback((meetingId: string, itemId: string, type: 'pour' | 'contre' | 'abstention') => {
    setMeetings(prev => prev.map(m => m.id !== meetingId ? m : {
      ...m, agenda: m.agenda.map(it => it.id !== itemId ? it : { ...it, [type]: it[type] + 1 }),
    }))
  }, [])

  const openVote = useCallback((meetingId: string, itemId: string) => {
    setMeetings(prev => prev.map(m => m.id !== meetingId ? m : {
      ...m, agenda: m.agenda.map(it => it.id !== itemId ? it : { ...it, voteStatus: 'OPEN' as const }),
    }))
  }, [])

  const closeVote = useCallback((meetingId: string, itemId: string) => {
    setMeetings(prev => prev.map(m => m.id !== meetingId ? m : {
      ...m, agenda: m.agenda.map(it => {
        if (it.id !== itemId) return it
        return { ...it, voteStatus: 'CLOSED' as const, result: it.pour > it.contre ? 'ADOPTED' as const : 'REJECTED' as const }
      }),
    }))
  }, [])

  const startMeeting = useCallback((meetingId: string) => {
    setMeetings(prev => prev.map(m => m.id !== meetingId ? m : { ...m, status: 'IN_PROGRESS' as const }))
  }, [])

  const closeMeeting = useCallback((meetingId: string) => {
    setMeetings(prev => prev.map(m => m.id !== meetingId ? m : { ...m, status: 'COMPLETED' as const }))
  }, [])

  const createMeeting = useCallback((draft: DraftMeeting) => {
    const scheduledAt = `${draft.date}T${draft.time || '10:00'}:00`
    const newM: Meeting = {
      id:           makeId(),
      title:        draft.title,
      type:         draft.type,
      status:       'SCHEDULED',
      scheduledAt,
      location:     draft.location || undefined,
      residenceId:  'res-1',
      createdAt:    new Date().toISOString(),
      totalEligible: 19,
      description:  '',
      agenda: draft.items.map(it => ({
        id: makeId(), title: it.title,
        description: it.description || undefined,
        voteStatus: 'PENDING' as const,
        pour: 0, contre: 0, abstention: 0,
      })),
      attendeeList: [],
    }
    setMeetings(prev => [newM, ...prev])
    setDrawerOpen(false)
  }, [])

  const pvMeeting = pvId ? meetings.find(m => m.id === pvId) ?? null : null

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
        {meetings.map(m => {
          const date        = new Date(m.scheduledAt)
          const cfg         = statusConfig[m.status]
          const presentCount = m.attendeeList.filter(a => a.present).length
          const isExpanded  = expandedId === m.id

          return (
            <Card key={m.id} className="overflow-hidden hover:shadow-sm transition-shadow">
              <CardContent className="p-0">
                {/* Card row */}
                <div className="flex items-start gap-4 p-5">
                  {/* Date block */}
                  <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl bg-primary/10 shrink-0">
                    <span className="text-xl font-bold text-primary leading-none">{date.getDate()}</span>
                    <span className="text-[11px] text-primary/70 uppercase tracking-wide">
                      {date.toLocaleString('fr-MA', { month: 'short' })}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold">{m.title}</h3>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {typeLabel[m.type]}
                      </span>
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{m.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {date.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {m.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {m.location}
                        </span>
                      )}
                      {m.attendeeList.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {presentCount}/{m.totalEligible} présents
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 items-center">
                    {m.status === 'SCHEDULED' && (
                      <Button size="sm" variant="outline" className="text-xs h-8">Envoyer convocation</Button>
                    )}
                    {m.status === 'IN_PROGRESS' && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 h-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        En cours
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant={isExpanded ? 'secondary' : 'ghost'}
                      className="text-xs h-8 gap-1"
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    >
                      Détails
                      <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Accordion detail */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden border-t"
                    >
                      <DetailPanel
                        meeting={m}
                        onCastVote={castVote}
                        onOpenVote={openVote}
                        onCloseVote={closeVote}
                        onStartMeeting={startMeeting}
                        onCloseMeeting={closeMeeting}
                        onShowPV={setPvId}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <CreateMeetingDrawer onClose={() => setDrawerOpen(false)} onSubmit={createMeeting} />
        )}
      </AnimatePresence>

      {/* PV modal */}
      {pvMeeting && <PVModal meeting={pvMeeting} onClose={() => setPvId(null)} />}
    </div>
  )
}
