import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Building2, MapPin, FileText, Image as ImageIcon,
  X, ChevronRight, Check, Eye,
  Wifi, Car, Shield, Waves, Dumbbell, Trees, Zap, Wind,
} from 'lucide-react'

// ── Steps config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Informations',  sub: 'Nom, adresse, ville',      icon: Building2 },
  { id: 2, label: 'Titre Foncier', sub: 'Statut & référence légale', icon: FileText  },
  { id: 3, label: 'Équipements',   sub: 'Commodités disponibles',   icon: Wifi      },
  { id: 4, label: 'Aperçu',        sub: 'Vérification finale',       icon: Eye       },
]

// ── Facilities ────────────────────────────────────────────────────────────────

const FACILITIES = [
  { key: 'ELEVATOR',   label: 'Ascenseur',   icon: Zap    },
  { key: 'PARKING',    label: 'Parking',     icon: Car    },
  { key: 'SECURITY',   label: 'Sécurité',    icon: Shield },
  { key: 'POOL',       label: 'Piscine',     icon: Waves  },
  { key: 'GYM',        label: 'Salle sport', icon: Dumbbell },
  { key: 'GARDEN',     label: 'Jardin',      icon: Trees  },
  { key: 'WIFI',       label: 'Wi-Fi',       icon: Wifi   },
  { key: 'VENTILATION',label: 'Ventilation', icon: Wind   },
]

const STATUS_OPTIONS = [
  { value: 'ACTIVE',      label: 'Actif',     desc: 'En exploitation normale', color: 'emerald' },
  { value: 'MAINTENANCE', label: 'Travaux',   desc: 'En cours de rénovation',  color: 'amber'   },
  { value: 'INACTIVE',    label: 'Inactif',   desc: 'Hors service',            color: 'slate'   },
]

// ── Floating label input ──────────────────────────────────────────────────────

function FloatInput({
  label, value, onChange, icon: Icon, type = 'text', placeholder = ' ',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: React.ElementType
  type?: string
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0

  return (
    <div className="relative group">
      <div className={`
        flex items-center gap-3 w-full rounded-xl border-2 bg-slate-50/60 px-4 pt-5 pb-2 transition-all duration-200
        ${focused ? 'border-primary bg-white shadow-[0_0_0_4px_hsl(221_83%_53%/0.08)]' : 'border-slate-200 hover:border-slate-300'}
      `}>
        {Icon && (
          <Icon
            size={16}
            className={`shrink-0 mt-0.5 transition-colors ${focused ? 'text-primary' : 'text-slate-400'}`}
          />
        )}
        <div className="flex-1 relative">
          <label className={`
            absolute left-0 transition-all duration-200 pointer-events-none font-medium
            ${focused || filled
              ? 'text-[10px] top-0 text-primary'
              : 'text-sm top-1.5 text-slate-400'}
          `}>
            {label}
          </label>
          <input
            type={type}
            value={value}
            placeholder={focused ? placeholder : ''}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent text-sm text-slate-800 outline-none pt-3 pb-0 placeholder:text-slate-300"
          />
        </div>
      </div>
    </div>
  )
}

function FloatTextarea({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0
  const max = 200

  return (
    <div className="relative">
      <div className={`
        w-full rounded-xl border-2 bg-slate-50/60 px-4 pt-5 pb-2 transition-all duration-200
        ${focused ? 'border-primary bg-white shadow-[0_0_0_4px_hsl(221_83%_53%/0.08)]' : 'border-slate-200 hover:border-slate-300'}
      `}>
        <label className={`
          block transition-all duration-200 font-medium pointer-events-none
          ${focused || filled ? 'text-[10px] text-primary mb-1' : 'text-sm text-slate-400 mb-1'}
        `}>
          {label}
        </label>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value.slice(0, max))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={3}
          className="w-full bg-transparent text-sm text-slate-800 outline-none resize-none placeholder:text-slate-300"
          placeholder={focused ? 'Description courte de la résidence...' : ''}
        />
        <p className="text-right text-[10px] text-slate-400 mt-1">{value.length}/{max}</p>
      </div>
    </div>
  )
}

// ── Step panels ───────────────────────────────────────────────────────────────

function Step1({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800">Informations générales</h3>
        <p className="text-xs text-slate-500 mt-0.5">Renseignez les informations de base de votre résidence</p>
      </div>

      <FloatInput label="Nom de la résidence" value={data.name} onChange={v => set('name', v)}
        icon={Building2} placeholder="Ex: إقامة النور" />

      <div className="grid grid-cols-2 gap-3">
        <FloatInput label="Adresse" value={data.address} onChange={v => set('address', v)}
          icon={MapPin} placeholder="Rue, quartier..." />
        <FloatInput label="Ville" value={data.city} onChange={v => set('city', v)}
          placeholder="Casablanca, Rabat..." />
      </div>

      <FloatTextarea label="Description" value={data.description} onChange={v => set('description', v)} />
    </div>
  )
}

function Step2({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-800">Titre foncier & statut</h3>
        <p className="text-xs text-slate-500 mt-0.5">Référence légale et état opérationnel de la résidence</p>
      </div>

      <FloatInput label="Numéro du titre foncier" value={data.titreFoncier}
        onChange={v => set('titreFoncier', v)} icon={FileText} placeholder="Ex: 38/163500" />

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Statut opérationnel</p>
        <div className="grid grid-cols-3 gap-3">
          {STATUS_OPTIONS.map(s => {
            const active = data.status === s.value
            const ring = {
              emerald: active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300',
              amber:   active ? 'border-amber-400  bg-amber-50'   : 'border-slate-200 hover:border-amber-300',
              slate:   active ? 'border-slate-400  bg-slate-100'  : 'border-slate-200 hover:border-slate-300',
            }[s.color]
            const dot = { emerald: 'bg-emerald-500', amber: 'bg-amber-400', slate: 'bg-slate-400' }[s.color]

            return (
              <button
                key={s.value}
                type="button"
                onClick={() => set('status', s.value)}
                className={`relative p-3 rounded-xl border-2 text-left transition-all duration-150 ${ring}`}
              >
                {active && (
                  <motion.div
                    layoutId="status-check"
                    className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 rounded-full bg-primary"
                  >
                    <Check size={9} className="text-white" />
                  </motion.div>
                )}
                <span className={`block w-2 h-2 rounded-full mb-2 ${dot}`} />
                <p className="text-xs font-bold text-slate-700">{s.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Step3({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  const toggle = (key: string) => {
    const current: string[] = data.facilities ?? []
    set('facilities', current.includes(key) ? current.filter(k => k !== key) : [...current, key])
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-800">Équipements & commodités</h3>
        <p className="text-xs text-slate-500 mt-0.5">Sélectionnez les équipements disponibles dans la résidence</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {FACILITIES.map(f => {
          const active = (data.facilities ?? []).includes(f.key)
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggle(f.key)}
              className={`
                relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150
                ${active
                  ? 'border-primary bg-primary/5 shadow-[0_0_0_3px_hsl(221_83%_53%/0.12)]'
                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white'}
              `}
            >
              {active && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary"
                >
                  <Check size={7} className="text-white" />
                </motion.div>
              )}
              <f.icon size={20} className={active ? 'text-primary' : 'text-slate-400'} />
              <span className={`text-[10px] font-semibold text-center leading-tight ${active ? 'text-primary' : 'text-slate-500'}`}>
                {f.label}
              </span>
            </button>
          )
        })}
      </div>

      {(data.facilities ?? []).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-1.5 pt-1"
        >
          {(data.facilities as string[]).map(k => {
            const f = FACILITIES.find(x => x.key === k)
            return f ? (
              <span key={k} className="flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <f.icon size={9} /> {f.label}
              </span>
            ) : null
          })}
        </motion.div>
      )}
    </div>
  )
}

function Step4({ data }: { data: any; set: (k: string, v: any) => void }) {
  const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Actif', MAINTENANCE: 'Travaux', INACTIVE: 'Inactif' }
  const facilitiesSelected = (data.facilities ?? []) as string[]

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-800">Aperçu de la résidence</h3>
        <p className="text-xs text-slate-500 mt-0.5">Vérifiez les informations avant de créer</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Info block */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Informations</p>
          {[
            { label: 'Nom',      val: data.name    },
            { label: 'Adresse',  val: data.address },
            { label: 'Ville',    val: data.city    },
            { label: 'Description', val: data.description },
          ].map(({ label, val }) => (
            <div key={label}>
              <p className="text-[10px] text-slate-400">{label}</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{val || <span className="text-slate-300 font-normal italic">—</span>}</p>
            </div>
          ))}
        </div>

        {/* Legal + status block */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Titre foncier & Statut</p>
            <div>
              <p className="text-[10px] text-slate-400">Titre foncier</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{data.titreFoncier || <span className="text-slate-300 font-normal italic">—</span>}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Statut</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                data.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                data.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'}`}>
                {STATUS_LABEL[data.status] ?? data.status}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Équipements ({facilitiesSelected.length})
            </p>
            {facilitiesSelected.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {facilitiesSelected.map(k => {
                  const f = FACILITIES.find(x => x.key === k)
                  return f ? (
                    <span key={k} className="flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <f.icon size={9} /> {f.label}
                    </span>
                  ) : null
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucun équipement sélectionné</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

const EMPTY = { name: '', address: '', city: '', description: '', titreFoncier: '', status: 'ACTIVE', facilities: [], image: '' }

export function AddResidenceModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen]   = useState(false)
  const [step, setStep]   = useState(1)
  const [data, setData]   = useState({ ...EMPTY })
  const [dir,  setDir]    = useState(1)

  const set = (k: string, v: any) => setData(d => ({ ...d, [k]: v }))

  const go = (next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const canNext = () => {
    if (step === 1) return data.name.trim().length > 0 && data.address.trim().length > 0
    return true
  }

  const handleSubmit = () => {
    console.log('New residence:', data)
    setOpen(false)
    setStep(1)
    setData({ ...EMPTY })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[980px] h-[82vh] overflow-hidden rounded-2xl bg-white shadow-2xl data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 duration-200 flex">

          {/* ── LEFT: steps rail ── */}
          <div className="w-56 shrink-0 bg-slate-900 flex flex-col p-6">
            <div className="mb-8">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nouvelle</p>
              <p className="text-white font-bold text-xl leading-tight mt-0.5">Résidence</p>
            </div>

            <div className="flex flex-col flex-1">
              {STEPS.map((s, i) => {
                const done    = step > s.id
                const current = step === s.id
                const isLast  = i === STEPS.length - 1

                return (
                  <div key={s.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => done && go(s.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${current ? 'bg-white/10' : done ? 'hover:bg-white/5 cursor-pointer' : 'opacity-40 cursor-default'}`}
                    >
                      {/* Circle indicator */}
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full shrink-0 border-2 transition-all duration-300
                        ${done    ? 'bg-primary border-primary'  : ''}
                        ${current ? 'bg-white border-white'      : ''}
                        ${!done && !current ? 'border-slate-600 bg-transparent' : ''}
                      `}>
                        {done
                          ? <Check size={13} className="text-white" />
                          : <span className={`text-xs font-bold ${current ? 'text-slate-900' : 'text-slate-400'}`}>{s.id}</span>
                        }
                      </div>

                      <div>
                        <p className={`text-sm font-semibold ${current ? 'text-white' : done ? 'text-slate-300' : 'text-slate-500'}`}>{s.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.sub}</p>
                      </div>
                    </button>

                    {/* Dashed connector to next step */}
                    {!isLast && (
                      <div className="flex items-start pl-[27px] py-1">
                        <div className="w-px h-6 border-l-2 border-dashed border-slate-700" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Step progress */}
            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-500">Progression</span>
                <span className="text-[10px] font-bold text-slate-400">{step}/{STEPS.length}</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${(step / STEPS.length) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT: form content ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {(() => { const S = STEPS[step - 1]; return <S.icon size={16} className="text-primary" /> })()}
                <span className="text-sm font-semibold text-slate-700">{STEPS[step - 1].label}</span>
              </div>
              <DialogPrimitive.Close className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={15} />
              </DialogPrimitive.Close>
            </div>

            {/* Animated step content */}
            <div className="flex-1 overflow-y-auto px-7 py-6">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{   opacity: 0, x: dir * -32 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                >
                  {step === 1 && <Step1 data={data} set={set} />}
                  {step === 2 && <Step2 data={data} set={set} />}
                  {step === 3 && <Step3 data={data} set={set} />}
                  {step === 4 && <Step4 data={data} set={set as any} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-slate-50/60">
              <button
                type="button"
                onClick={() => go(step - 1)}
                disabled={step === 1}
                className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-0 transition-all"
              >
                ← Précédent
              </button>

              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={() => go(step + 1)}
                  disabled={!canNext()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-all"
                >
                  Suivant <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all"
                >
                  <Check size={15} /> Créer la résidence
                </button>
              )}
            </div>
          </div>

        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}
