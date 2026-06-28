import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'

type Gender = 'MALE' | 'FEMALE'

const EMPTY = { firstName: '', lastName: '', email: '', gender: 'MALE' as Gender, isPrimary: false }

export function AddShareholderModal({
  children,
  apartmentId,
  apartmentCode,
  isFirstOwner,
  onSuccess,
}: {
  children: React.ReactNode
  apartmentId: string
  apartmentCode: string
  isFirstOwner?: boolean
  onSuccess?: () => void
}) {
  const [open, setOpen]           = useState(false)
  const [form, setForm]           = useState({ ...EMPTY, isPrimary: isFirstOwner ?? false })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const set = (k: keyof typeof EMPTY, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleOpen = (v: boolean) => {
    setOpen(v)
    if (v) setForm({ ...EMPTY, isPrimary: isFirstOwner ?? false })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Prénom et nom sont obligatoires')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/apartments/${apartmentId}/shareholders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          email:     form.email.trim() || undefined,
          isPrimary: form.isPrimary,
          gender:    form.gender,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Erreur serveur')
      }
      setOpen(false)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message ?? 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <span onClick={() => handleOpen(true)} className="contents">{children}</span>
      <DialogContent className="w-full max-w-sm p-0 overflow-hidden">
        <DialogTitle className="sr-only">Ajouter propriétaire — {apartmentCode}</DialogTitle>

        <div className="px-6 pt-6 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">
            Appartement {apartmentCode}
          </p>
          <h2 className="text-base font-bold text-foreground">Ajouter un propriétaire</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Gender toggle */}
          <div className="flex gap-2">
            {(['MALE', 'FEMALE'] as Gender[]).map(g => (
              <button key={g} type="button"
                onClick={() => set('gender', g)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 text-sm font-semibold transition-all
                  ${form.gender === g
                    ? g === 'MALE'
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-pink-400 bg-pink-50 text-pink-700'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}>
                <span className="text-base">{g === 'MALE' ? '♂' : '♀'}</span>
                {g === 'MALE' ? 'Homme' : 'Femme'}
              </button>
            ))}
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Prénom *</span>
              <input
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                placeholder="Yahia"
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Nom *</span>
              <input
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                placeholder="Najm"
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>

          {/* Email */}
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="email@exemple.com (optionnel)"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          {/* isPrimary toggle */}
          <button type="button"
            onClick={() => set('isPrimary', !form.isPrimary)}
            className={`w-full flex items-center gap-2 py-2 px-3 rounded-xl border-2 text-sm font-semibold transition-all
              ${form.isPrimary
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${form.isPrimary ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            {form.isPrimary ? 'Représentant principal' : 'Définir comme représentant'}
          </button>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1 gap-1.5" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
