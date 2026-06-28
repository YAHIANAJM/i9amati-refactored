import { useState, useEffect } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Pencil, X, Check, Loader2, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/toast/useToast'
import { getInitials } from '@/lib/utils'
import type { ApiShareholder } from '@/pages/syndic/Association'

// ── avatar helper (mirrors Association.tsx) ───────────────────────────────────
const FEMALE_NAMES = new Set([
  'sara','sarah','fatima','fatma','layla','leila','nadia','amira','hind','zineb',
  'khadija','maryam','mariam','yasmine','samia','sofia','soukaina','imane','salma',
  'ghita','houda','hasnaa','loubna','hanane','najat','bouchra','naima','rachida',
  'aicha','asma','basma','chaima','dounia','ikram','jihane','karima','lamia','mona',
  'noura','rania','rim','safaa','siham','soumaya','wafae','yousra','zahra','zainab',
  'nora','lina','dina','rina','hana','maha','reem','lama','amal','iman','rima',
  'warda','souad','nawal','bahija','jamila','malak','manal','nour','aya','sana','salwa',
])

function ownerAvatar(s: ApiShareholder) {
  const gender = s.gender ?? (FEMALE_NAMES.has(s.firstName.toLowerCase().trim()) ? 'FEMALE' : 'MALE')
  const seed   = encodeURIComponent(`${s.firstName}-${s.lastName}`)
  return gender === 'FEMALE'
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffd5dc,ffdfbf&top=longHairBigHair,longHairBob,longHairBun,longHairCurly,longHairCurvy,longHairStraight,longHairFroBand&facialHairChance=0`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede&top=shortHairDreads01,shortHairShortFlat,shortHairShortCurly,shortHairShortRound,shortHairShortWaved,shortHairSides`
}

// ── component ─────────────────────────────────────────────────────────────────
export function OwnerModal({
  open,
  onOpenChange,
  owners,
  apartmentId,
  apartmentCode,
  initialIdx = 0,
  initialMode = 'view',
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  owners: ApiShareholder[]
  apartmentId: string
  apartmentCode: string
  initialIdx?: number
  initialMode?: 'view' | 'edit'
  onSuccess?: () => void
}) {
  const [selectedIdx, setSelectedIdx] = useState(initialIdx)
  const [mode,        setMode]        = useState<'view' | 'edit'>(initialMode)
  const [form,        setForm]        = useState<ApiShareholder | null>(null)
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedIdx(initialIdx)
      setMode(initialMode)
      setForm(null)
    }
  }, [open, initialIdx, initialMode])

  const owner = owners[selectedIdx]
  if (!owner) return null

  const displayed = mode === 'edit' && form ? form : owner

  const selectOwner = (i: number) => {
    setSelectedIdx(i)
    setMode('view')
    setForm(null)
  }

  const startEdit = () => {
    setForm({ ...owner })
    setMode('edit')
  }

  const cancelEdit = () => {
    setMode('view')
    setForm(null)
  }

  const f = (k: keyof ApiShareholder, v: any) => setForm(prev => ({ ...prev!, [k]: v }))

  const save = async () => {
    if (!form) return
    setSaving(true)
    try {
      const updated = owners.map((o, i) => {
        if (i === selectedIdx) return { ...form, email: form.email || null }
        return form.isPrimary ? { ...o, isPrimary: false } : o
      })
      const res = await fetch(`/api/apartments/${apartmentId}/shareholders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareholders: updated }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Erreur serveur')
      }
      toast({ variant: 'success', title: 'Propriétaire mis à jour', description: `${form.firstName} ${form.lastName}` })
      setMode('view')
      setForm(null)
      onSuccess?.()
    } catch (e: any) {
      toast({ variant: 'error', title: 'Erreur', description: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[440px] overflow-hidden rounded-2xl bg-white shadow-2xl flex data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 duration-200">
          <DialogPrimitive.Title className="sr-only">Propriétaires — {apartmentCode}</DialogPrimitive.Title>

          {/* ── Left sidebar: sibling list ── */}
          <div className="w-44 shrink-0 bg-slate-50 border-r border-slate-100 flex flex-col">
            <div className="px-4 pt-5 pb-3 border-b border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Copropriétaires</p>
              <p className="text-[11px] font-semibold text-slate-600 mt-0.5">{apartmentCode}</p>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {owners.map((o, i) => {
                const isSelected = i === selectedIdx
                return (
                  <button key={i} onClick={() => selectOwner(i)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-all text-left group
                      ${isSelected ? 'bg-primary/10' : 'hover:bg-slate-100'}`}>
                    <div className="relative shrink-0">
                      <img src={ownerAvatar(o)} alt="" className="h-8 w-8 rounded-full object-cover bg-slate-200" />
                      {o.isPrimary && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center ring-1 ring-white">
                          <Star size={7} className="text-white fill-white" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-semibold truncate leading-tight ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                        {o.firstName} {o.lastName}
                      </p>
                      {o.isPrimary && <p className="text-[9px] text-primary/60 font-medium">Principal</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Right panel: view or edit ── */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <p className="text-sm font-bold text-slate-700">
                {mode === 'edit' ? 'Modifier le propriétaire' : 'Fiche propriétaire'}
              </p>
              <div className="flex items-center gap-1">
                {mode === 'view' && (
                  <button onClick={startEdit}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                    title="Modifier">
                    <Pencil size={14} />
                  </button>
                )}
                <DialogPrimitive.Close className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                  <X size={14} />
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* View mode */}
            {mode === 'view' && (
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center gap-4 mb-6">
                  <img src={ownerAvatar(owner)} alt="" className="h-16 w-16 rounded-2xl object-cover bg-slate-100 ring-2 ring-primary/10" />
                  <div>
                    <p className="text-xl font-bold text-slate-800">{owner.firstName} {owner.lastName}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {owner.isPrimary && (
                        <Badge variant="info" className="text-[10px] px-2 py-0.5 gap-1">
                          <Star size={8} className="fill-current" /> Représentant
                        </Badge>
                      )}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold
                        ${(owner.gender ?? 'MALE') === 'FEMALE'
                          ? 'border-pink-300 text-pink-600 bg-pink-50'
                          : 'border-blue-300 text-blue-600 bg-blue-50'}`}>
                        {(owner.gender ?? 'MALE') === 'FEMALE' ? '♀ Femme' : '♂ Homme'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm text-slate-700">
                      {owner.email || <span className="text-slate-300 italic text-xs">Aucun email</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Initiales</p>
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{getInitials(`${owner.firstName} ${owner.lastName}`)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit mode */}
            {mode === 'edit' && form && (
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Prénom</span>
                    <input value={form.firstName} onChange={e => f('firstName', e.target.value)}
                      className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Nom</span>
                    <input value={form.lastName} onChange={e => f('lastName', e.target.value)}
                      className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Email</span>
                  <input type="email" value={form.email ?? ''} onChange={e => f('email', e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </label>

                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Genre</p>
                  <div className="flex gap-2">
                    {(['MALE', 'FEMALE'] as const).map(g => (
                      <button key={g} type="button" onClick={() => f('gender', g)}
                        className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all
                          ${displayed.gender === g
                            ? g === 'MALE' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-pink-400 bg-pink-50 text-pink-700'
                            : 'border-border text-slate-400 hover:border-slate-300'}`}>
                        {g === 'MALE' ? '♂ Homme' : '♀ Femme'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-28 shrink-0">Représentant :</span>
                  <button type="button"
                    onClick={() => f('isPrimary', !form.isPrimary)}
                    className="flex items-center gap-1.5 group">
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                      ${form.isPrimary ? 'border-primary bg-primary' : 'border-slate-300 group-hover:border-primary/50'}`}>
                      {form.isPrimary && <Check size={9} className="text-white" />}
                    </span>
                    <span className={`text-xs font-semibold transition-colors
                      ${form.isPrimary ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                      {form.isPrimary ? 'Principal' : 'Définir comme principal'}
                    </span>
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={cancelEdit}
                    className="flex-1 py-2 rounded-xl border border-border text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    Annuler
                  </button>
                  <button onClick={save} disabled={saving}
                    className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
