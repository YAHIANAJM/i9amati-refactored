import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, Phone, Mail, Building2, Trash2, UserCheck,
  Loader2, Share2, StickyNote, ChevronDown, AlertCircle, Clock, Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

// ─── API Types ────────────────────────────────────────────────────────────────

type Building = { id: string; name: string; residence_name: string }

type PendingDelegate = {
  id: string; name: string; email: string; phone: string | null
  gender: 'male' | 'female'; building_id: string | null; building_name: string | null
  note: string | null; status: 'PENDING'; created_at: string
}
type ActiveDelegate = {
  id: string; name: string; email: string; phone: string | null
  gender: null; building_id: string | null; building_name: string | null
  note: null; status: 'ACTIVE'
}
type Delegate = PendingDelegate | ActiveDelegate

type PartnerSyndic = {
  id: string; name: string; email: string; phone: string | null
  gender: 'male' | 'female'; residence: string; note: string | null; linked_at: string
}

// ─── Gender / image config ────────────────────────────────────────────────────

const FEMALE_NAMES = new Set([
  'fatima','nadia','sarah','leila','samira','amina','zineb','khadija','hafsa',
  'meryem','houda','soukaina','rim','iman','siham','loubna','ghita','hind',
  'asmaa','widad','rokia','nassima','ilham','bouchra','naima','rajaa','lamia',
  'sonia','malika','laila','marie','sophie','claire','camille','julie','emma',
  'alice','yasmine','rania','salma','mona','dina','layla','sanaa','zainab','hana',
])

function guessGender(name: string): 'male' | 'female' {
  return FEMALE_NAMES.has(name.split(' ')[0].toLowerCase()) ? 'female' : 'male'
}

type BoardCfg = { src: string; top: string; left: string; right: string; height: string }

function boardCfg(gender: 'male' | 'female'): BoardCfg {
  if (gender === 'female') {
    return { src: '/woman.png', top: '37%', left: '5%', right: '5%', height: '33%' }
  }
  return { src: '/man.png', top: '17%', left: '8%', right: '8%', height: '19%' }
}

// ─── Shared form helpers ──────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  )
}

const inpCls = (err?: string) => cn(
  'w-full h-10 rounded-xl border-2 bg-white px-3.5 text-sm text-foreground',
  'placeholder:text-slate-400 outline-none transition-all duration-200',
  err
    ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
    : 'border-slate-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]',
)

function GenderToggle({ value, onChange }: { value: 'male' | 'female'; onChange: (v: 'male' | 'female') => void }) {
  return (
    <div className="flex gap-2">
      {(['male', 'female'] as const).map(g => (
        <button key={g} type="button" onClick={() => onChange(g)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-semibold transition-all',
            value === g
              ? 'border-primary bg-primary/8 text-primary'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
          )}
        >
          <img
            src={g === 'male' ? '/man.png' : '/woman.png'}
            alt={g}
            className="w-5 h-5 object-contain object-top"
          />
          {g === 'male' ? 'Homme' : 'Femme'}
        </button>
      ))}
    </div>
  )
}

// ─── DelegateCard ─────────────────────────────────────────────────────────────

function DelegateCard({ d, onDelete }: { d: Delegate; onDelete: () => void }) {
  const gender = d.gender ?? guessGender(d.name)
  const cfg = boardCfg(gender)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className="flex flex-col items-center group"
    >
      <div className="relative w-48 select-none" style={{ aspectRatio: '624/980' }}>
        <img src={cfg.src} alt="" className="w-full h-full object-contain object-top" draggable={false} />
        {d.status === 'PENDING' && (
          <div className="absolute top-[62%] left-[8%] right-[8%] flex justify-center">
            <span className="inline-flex items-center gap-0.5 text-[7.5px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              <Clock size={6} /> Invitation en attente
            </span>
          </div>
        )}
      </div>

      <div className="text-center -mt-1 mb-2">
        <p className="text-sm font-bold text-foreground leading-tight">{d.name}</p>
        {d.building_name
          ? <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5"><Building2 size={9} />{d.building_name}</p>
          : <p className="text-[11px] text-muted-foreground/50 italic">Aucun immeuble</p>
        }
        {d.note && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 max-w-[180px] truncate">{d.note}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {d.email && (
          <a href={`mailto:${d.email}`}
            className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 transition-colors">
            <Mail size={10} /> Email
          </a>
        )}
        {d.phone && (
          <a href={`tel:${d.phone}`}
            className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">
            <Phone size={10} />
          </a>
        )}
        <button onClick={onDelete}
          className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── PartnerCard ──────────────────────────────────────────────────────────────

function PartnerCard({ ps, onEdit, onDelete }: { ps: PartnerSyndic; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const cfg = boardCfg(ps.gender)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className="flex flex-col items-center group"
    >
      <div className="relative w-48 select-none" style={{ aspectRatio: '624/980' }}>
        <img src={cfg.src} alt="" className="w-full h-full object-contain object-top" draggable={false} />
      </div>

      <div className="text-center -mt-1 mb-2">
        <p className="text-sm font-bold text-foreground leading-tight">{ps.name}</p>
        <p className="text-[11px] text-muted-foreground">{ps.residence}</p>
        <button onClick={() => setOpen(v => !v)}
          className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5 mx-auto hover:underline">
          Parties communes
          <ChevronDown size={9} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <p className="text-[9px] text-muted-foreground/60 italic mt-1.5">Géré par Yahia (owners associations)</p>
            </motion.div>
          )}
        </AnimatePresence>
        {ps.note && <p className="text-[10px] text-muted-foreground/60 mt-0.5 max-w-[180px] truncate">{ps.note}</p>}
      </div>

      <div className="flex items-center gap-2">
        <a href={`mailto:${ps.email}`}
          className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
          <Mail size={10} /> Email
        </a>
        {ps.phone && (
          <a href={`tel:${ps.phone}`}
            className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">
            <Phone size={10} />
          </a>
        )}
        <button onClick={onEdit}
          className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-primary hover:bg-primary/8 border border-transparent hover:border-primary/20 transition-all">
          <Pencil size={11} />
        </button>
        <button onClick={onDelete}
          className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── AddRightHandModal ────────────────────────────────────────────────────────

type RHForm = { name: string; building_id: string; email: string; phone: string; gender: 'male' | 'female'; note: string }
const EMPTY_RH: RHForm = { name: '', building_id: '', email: '', phone: '', gender: 'male', note: '' }

function AddRightHandModal({ open, onClose, buildings, buildingsLoading, buildingsError }: {
  open: boolean; onClose: () => void; buildings: Building[]; buildingsLoading?: boolean; buildingsError?: string
}) {
  const qc = useQueryClient()
  const [form, setForm]       = useState<RHForm>(EMPTY_RH)
  const [errors, setErrors]   = useState<Partial<Record<keyof RHForm, string>>>({})
  const [apiError, setApiErr] = useState<string | null>(null)

  function set<K extends keyof RHForm>(k: K, v: RHForm[K]) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: undefined }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.name.trim())  e.name  = 'Requis'
    if (!form.email.trim()) e.email = 'Requis'
    return e
  }

  const mutation = useMutation({
    mutationFn: async (f: RHForm) => {
      const resp = await fetch(`${API}/api/union/delegates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() || undefined,
          gender: f.gender, building_id: f.building_id || undefined, note: f.note.trim() || undefined,
        }),
      })
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}))
        throw new Error(d?.error?.message ?? 'Erreur serveur')
      }
      return resp.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['union-delegates'] })
      setForm(EMPTY_RH); setApiErr(null); onClose()
    },
    onError: (e: Error) => setApiErr(e.message),
  })

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setApiErr(null)
    mutation.mutate(form)
  }

  function close() { onClose(); setForm(EMPTY_RH); setErrors({}); setApiErr(null); mutation.reset() }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) close() }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" showClose={false}>
        <DialogTitle className="sr-only">Affecter un délégué d'immeuble</DialogTitle>
        <div className="flex min-h-[500px]">
          <div className="w-52 shrink-0 bg-gradient-to-b from-[hsl(221,83%,53%)] to-[hsl(221,83%,38%)] flex flex-col items-center justify-between py-8 px-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3 border border-white/20">
                <UserCheck size={22} className="text-white" />
              </div>
              <h3 className="text-white font-black text-sm leading-tight">Délégué d'immeuble</h3>
              <p className="text-white/65 text-[10px] mt-1.5 leading-relaxed">
                Désignez une personne de confiance pour gérer un immeuble en votre nom
              </p>
            </div>
            <img
              src={form.gender === 'female' ? '/woman.png' : '/man.png'}
              alt=""
              className="relative w-40 h-auto -mb-8 drop-shadow-lg"
              draggable={false}
            />
          </div>

          <form onSubmit={submit} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-foreground">Affecter un délégué</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Renseignez les informations du délégué</p>
              </div>
              <button type="button" onClick={close}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-foreground transition-colors">
                ×
              </button>
            </div>

            <div className="flex-1 px-7 py-5 space-y-4 overflow-y-auto">
              <Field label="Genre">
                <GenderToggle value={form.gender} onChange={v => set('gender', v)} />
              </Field>

              <Field label="Nom complet *" error={errors.name}>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Ex: Youssef Benkirane" className={inpCls(errors.name)} />
              </Field>

              <Field label="Immeuble affecté" error={buildingsError}>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                  <select
                    value={form.building_id}
                    onChange={e => set('building_id', e.target.value)}
                    disabled={buildingsLoading}
                    className={cn(inpCls(), 'pl-9 cursor-pointer disabled:opacity-60')}
                  >
                    <option value="">
                      {buildingsLoading ? 'Chargement…' : buildings.length === 0 ? 'Aucun immeuble dans la DB' : '— Sélectionner un immeuble —'}
                    </option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.residence_name} — {b.name}</option>
                    ))}
                  </select>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Email *" error={errors.email}>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="email@ex.com" className={cn(inpCls(errors.email), 'pl-9')} />
                  </div>
                </Field>
                <Field label="Téléphone">
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="+212 6 XX XX XX" className={cn(inpCls(), 'pl-9')} />
                  </div>
                </Field>
              </div>

              <Field label="Note (optionnel)">
                <div className="relative">
                  <StickyNote size={14} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <textarea value={form.note} onChange={e => set('note', e.target.value)}
                    placeholder="Responsabilités, périmètre d'intervention…"
                    rows={2} className={cn(inpCls(), 'h-auto py-2.5 pl-9 resize-none leading-relaxed')} />
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-slate-100 bg-slate-50/50">
              {apiError
                ? <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle size={12} />{apiError}</p>
                : <span />}
              <div className="flex gap-3">
                <Button type="button" variant="outline" size="sm" onClick={close} className="h-9 px-5">Annuler</Button>
                <Button type="submit" size="sm" disabled={mutation.isPending} className="h-9 px-6 gap-2 min-w-[140px]">
                  {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                  {mutation.isPending ? 'Envoi…' : 'Affecter + inviter'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── EditPartnerModal ─────────────────────────────────────────────────────────

type EditPSForm = { name: string; phone: string; note: string }

function EditPartnerModal({ ps, open, onClose }: { ps: PartnerSyndic | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const { t: tr } = useTranslation()
  const [form, setForm]       = useState<EditPSForm>({ name: '', phone: '', note: '' })
  const [apiError, setApiErr] = useState<string | null>(null)

  useEffect(() => {
    if (ps) setForm({ name: ps.name, phone: ps.phone ?? '', note: ps.note ?? '' })
  }, [ps?.id])

  function set<K extends keyof EditPSForm>(k: K, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  const mutation = useMutation({
    mutationFn: async (f: EditPSForm) => {
      const resp = await fetch(`${API}/api/union/partners/${ps!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: f.name.trim(), phone: f.phone.trim() || undefined, note: f.note.trim() || undefined }),
      })
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}))
        throw new Error(d?.error?.message ?? 'Erreur serveur')
      }
      return resp.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['union-partners'] })
      setApiErr(null); onClose()
    },
    onError: (e: Error) => setApiErr(e.message),
  })

  function close() { onClose(); setApiErr(null); mutation.reset() }

  if (!ps) return null

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) close() }}>
      <DialogContent className="max-w-md p-0 overflow-hidden" showClose={false}>
        <DialogTitle className="sr-only">Modifier le syndic partenaire</DialogTitle>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Pencil size={15} className="text-emerald-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-black text-foreground">{tr('unionMembers.partners.edit')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{ps.residence}</p>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">×</button>
        </div>

        <form onSubmit={e => { e.preventDefault(); if (form.name.trim()) mutation.mutate(form) }} className="px-6 py-5 space-y-4">
          <Field label="Nom du syndic *">
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Nom complet" className={inpCls(!form.name.trim() ? 'err' : undefined)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone">
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+212 6 XX XX XX" className={cn(inpCls(), 'pl-9')} />
              </div>
            </Field>
            <Field label="Email">
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="email" value={ps.email} disabled
                  className={cn(inpCls(), 'pl-9 opacity-50 cursor-not-allowed bg-slate-50')} />
              </div>
            </Field>
          </div>

          <Field label="Note">
            <div className="relative">
              <StickyNote size={14} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <textarea value={form.note} onChange={e => set('note', e.target.value)}
                placeholder="Coordination, contrats partagés…"
                rows={2} className={cn(inpCls(), 'h-auto py-2.5 pl-9 resize-none leading-relaxed')} />
            </div>
          </Field>

          <div className="flex items-center justify-between gap-3 pt-1">
            {apiError
              ? <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle size={12} />{apiError}</p>
              : <span />}
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="outline" size="sm" onClick={close} className="h-9 px-5">{tr('unionMembers.confirm.cancel')}</Button>
              <Button type="submit" size="sm" disabled={mutation.isPending || !form.name.trim()}
                className="h-9 px-6 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Pencil size={13} />}
                {mutation.isPending ? tr('unionMembers.partners.saving') : tr('unionMembers.partners.save')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── DeleteDialog ─────────────────────────────────────────────────────────────

function DeleteDialog({ name, open, onClose, onConfirm, loading }: {
  name: string; open: boolean; onClose: () => void; onConfirm: () => void; loading?: boolean
}) {
  const { t: tr } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden" showClose={false}>
        <DialogTitle className="sr-only">Confirmation</DialogTitle>
        <div className="bg-red-50 px-6 py-5 flex items-center gap-3 border-b border-red-100">
          <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
            <Trash2 size={17} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-black text-red-800">{tr('unionMembers.confirm.deleteDelegate')}</p>
            <p className="text-xs text-red-600 mt-0.5">{name}</p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose} className="h-9 px-5">{tr('unionMembers.confirm.cancel')}</Button>
            <Button size="sm" onClick={onConfirm} disabled={loading}
              className="h-9 px-5 bg-red-600 hover:bg-red-500 text-white gap-1.5">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {tr('unionMembers.confirm.yes')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── UnionMembers page ────────────────────────────────────────────────────────

type Tab = 'delegates' | 'partners'

export function UnionMembers() {
  const { t: tr } = useTranslation()
  const qc = useQueryClient()
  const [tab, setTab]           = useState<Tab>('delegates')
  const [showAddRH, setAddRH]   = useState(false)
  const [editingPS, setEditPS]   = useState<PartnerSyndic | null>(null)
  const [deletingRH, setDelRH]  = useState<Delegate | null>(null)
  const [deletingPS, setDelPS]  = useState<PartnerSyndic | null>(null)

  async function apiFetch<T>(path: string): Promise<T> {
    const r = await fetch(`${API}${path}`, { credentials: 'include' })
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error ?? `HTTP ${r.status}`) }
    return r.json()
  }

  const buildingsQ = useQuery<Building[]>({
    queryKey: ['union-buildings'],
    queryFn: () => apiFetch<Building[]>('/api/union/buildings'),
  })

  const delegatesQ = useQuery<{ pending: PendingDelegate[]; active: ActiveDelegate[] }>({
    queryKey: ['union-delegates'],
    queryFn: () => apiFetch('/api/union/delegates'),
  })

  const partnersQ = useQuery<PartnerSyndic[]>({
    queryKey: ['union-partners'],
    queryFn: () => apiFetch<PartnerSyndic[]>('/api/union/partners'),
  })

  const allDelegates: Delegate[] = [
    ...(delegatesQ.data?.pending ?? []),
    ...(delegatesQ.data?.active  ?? []),
  ]
  const partners = partnersQ.data ?? []

  const deleteRHMutation = useMutation({
    mutationFn: (id: string) => fetch(`${API}/api/union/delegates/${id}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['union-delegates'] }); setDelRH(null) },
  })

  const deletePSMutation = useMutation({
    mutationFn: (id: string) => fetch(`${API}/api/union/partners/${id}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['union-partners'] }); setDelPS(null) },
  })

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={tr('unionMembers.title')}
        subtitle=""
        actions={
          tab === 'delegates'
            ? <Button size="sm" className="gap-1.5 text-xs" onClick={() => setAddRH(true)}>
                <Plus size={13} /> {tr('unionMembers.delegates.invite')}
              </Button>
            : undefined
        }
      />

      <div className="flex-1 p-6 space-y-6 animate-fade-in">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {([
            { key: 'delegates' as Tab, label: tr('unionMembers.tabs.delegates'), icon: <UserCheck size={13} />, count: allDelegates.length },
            { key: 'partners'  as Tab, label: tr('unionMembers.tabs.partners'),  icon: <Share2 size={13} />,   count: partners.length },
          ] as const).map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                tab === item.key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}>
              {item.icon} {item.label}
              <span className={cn(
                'text-[10px] font-black px-1.5 py-0.5 rounded-full tabular-nums',
                tab === item.key
                  ? item.key === 'partners' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'
                  : 'bg-slate-200 text-muted-foreground',
              )}>{item.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === 'delegates' && (
            <motion.div key="delegates"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}>
              {delegatesQ.isPending ? (
                <div className="py-24 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
              ) : allDelegates.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-3 text-muted-foreground">
                  <UserCheck size={40} className="text-slate-300" />
                  <p className="text-sm font-semibold">{tr('unionMembers.delegates.noActive')}</p>
                  <Button size="sm" className="gap-1.5 mt-2" onClick={() => setAddRH(true)}>
                    <Plus size={13} /> {tr('unionMembers.delegates.invite')}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                  <AnimatePresence>
                    {allDelegates.map(d => (
                      <DelegateCard key={d.id} d={d} onDelete={() => setDelRH(d)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'partners' && (
            <motion.div key="partners"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}>
              {partnersQ.isPending ? (
                <div className="py-24 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
              ) : partners.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-3 text-muted-foreground">
                  <Share2 size={40} className="text-slate-300" />
                  <p className="text-sm font-semibold">{tr('unionMembers.partners.noPartners')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                  <AnimatePresence>
                    {partners.map(ps => (
                      <PartnerCard key={ps.id} ps={ps} onEdit={() => setEditPS(ps)} onDelete={() => setDelPS(ps)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AddRightHandModal
        open={showAddRH}
        onClose={() => setAddRH(false)}
        buildings={buildingsQ.data ?? []}
        buildingsLoading={buildingsQ.isPending}
        buildingsError={buildingsQ.isError ? String(buildingsQ.error) : undefined}
      />
      <EditPartnerModal ps={editingPS} open={!!editingPS} onClose={() => setEditPS(null)} />

      <DeleteDialog
        name={deletingRH ? `${deletingRH.name}${deletingRH.building_name ? ` — ${deletingRH.building_name}` : ''}` : ''}
        open={!!deletingRH}
        onClose={() => setDelRH(null)}
        onConfirm={() => deletingRH && deleteRHMutation.mutate(deletingRH.id)}
        loading={deleteRHMutation.isPending}
      />
      <DeleteDialog
        name={deletingPS ? `${deletingPS.name} — ${deletingPS.residence}` : ''}
        open={!!deletingPS}
        onClose={() => setDelPS(null)}
        onConfirm={() => deletingPS && deletePSMutation.mutate(deletingPS.id)}
        loading={deletePSMutation.isPending}
      />
    </div>
  )
}
