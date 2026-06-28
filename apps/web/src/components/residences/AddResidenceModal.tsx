import React, { useState, useCallback } from 'react'
import { toast } from '@/components/toast/useToast'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Building2, MapPin, FileText, Eye, Home, Users,
  X, ChevronRight, ChevronDown, Check, Plus, Trash2,
  Wifi, Car, Shield, Waves, Dumbbell, Trees, Zap, Wind, Lock,
} from 'lucide-react'

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Résidence',     sub: 'Info, statut & équipements', icon: Building2 },
  { id: 2, label: 'Bâtiments',    sub: 'Ajouter les bâtiments',       icon: Home      },
  { id: 3, label: 'Appartements', sub: 'Apparts & propriétaires',     icon: Users     },
  { id: 4, label: 'Aperçu',        sub: 'Vérification finale',         icon: Eye       },
]

// ── Facilities ────────────────────────────────────────────────────────────────

const FACILITIES = [
  { key: 'ELEVATOR',    label: 'Ascenseur',   icon: Zap      },
  { key: 'PARKING',     label: 'Parking',     icon: Car      },
  { key: 'SECURITY',    label: 'Sécurité',    icon: Shield   },
  { key: 'POOL',        label: 'Piscine',     icon: Waves    },
  { key: 'GYM',         label: 'Salle sport', icon: Dumbbell },
  { key: 'GARDEN',      label: 'Jardin',      icon: Trees    },
  { key: 'WIFI',        label: 'Wi-Fi',       icon: Wifi     },
  { key: 'VENTILATION', label: 'Ventilation', icon: Wind     },
]

const STATUS_OPTIONS = [
  { value: 'ACTIVE',      label: 'Actif',   desc: 'En exploitation normale', dot: 'bg-emerald-500' },
  { value: 'MAINTENANCE', label: 'Travaux', desc: 'En cours de rénovation',  dot: 'bg-amber-400'   },
  { value: 'INACTIVE',    label: 'Inactif', desc: 'Hors service',            dot: 'bg-slate-400'   },
]

const UNION_TYPES = [
  { value: 'IMMEUBLE',  label: 'Immeuble'  },
  { value: 'RESIDENCE', label: 'Résidence' },
  { value: 'VILLA',     label: 'Villa'     },
]

// ── Data model ────────────────────────────────────────────────────────────────

type Building  = {
  id: string; name: string; floors: number; unionType: string
  lotNumber: string        // numéro de lot du bâtiment (Loi 18-00)
  quotePart: number | null // millièmes dans la résidence (complexe only)
  areaSqm: number | null   // surface totale du bâtiment en m²
  facilities: string[]     // équipements spécifiques au bâtiment
}
type Owner     = { id: string; firstName: string; lastName: string; email: string; isPrimary: boolean; gender: 'MALE' | 'FEMALE' }
type Apartment = {
  id: string; buildingId: string; number: string; floor: number; owners: Owner[]
  lotNumber: string        // numéro de lot (رقم القطعة) — Loi 18-00
  quotePart: number | null // millièmes dans l'immeuble
  quotePartResidence: number | null // millièmes dans la résidence (complexe only)
  areaSqm: number | null   // surface de l'appartement en m²
}

const makeOwner = (isPrimary = false): Owner => ({
  id: crypto.randomUUID(), firstName: '', lastName: '', email: '', isPrimary, gender: 'MALE',
})

// ── Random mock generator (dev only — remove before production) ───────────────
function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

const MOCK_NAMES   = ['إقامة النور', 'إقامة الياسمين', 'إقامة الأطلس', 'إقامة الفردوس', 'رياض الزيتون', 'إقامة البحيرة']
const MOCK_STREETS = ['12 Rue Ibn Battouta, Hay Riad', '47 Bd Mohamed V', '3 Rue Oued Fès, Agdal', '88 Av Hassan II', '15 Rue Allal Ben Abdellah']
const MOCK_CITIES  = ['Rabat', 'Casablanca', 'Marrakech', 'Fès', 'Tanger', 'Agadir']
const MOCK_DESCS   = [
  'Résidence moderne avec espaces verts et sécurité 24h/24.',
  'Immeuble résidentiel standing avec parking couvert.',
  'Complexe résidentiel au cœur de la ville, proche des commodités.',
  'Résidence de luxe avec piscine et salle de sport.',
]
const MOCK_OWNERS  = [
  { firstName: 'Yahia',   lastName: 'Najm',    email: 'yahia@i9amati.com'   },
  { firstName: 'Ayman',   lastName: 'Benali',  email: 'ayman@i9amati.com'   },
  { firstName: 'Sara',    lastName: 'Idrissi', email: 'sara@i9amati.com'    },
  { firstName: 'Karim',   lastName: 'Tazi',    email: 'karim@i9amati.com'   },
  { firstName: 'Nadia',   lastName: 'Alaoui',  email: 'nadia@i9amati.com'   },
  { firstName: 'Omar',    lastName: 'Sekkaki', email: 'omar@i9amati.com'    },
  { firstName: 'Fatima',  lastName: 'Chraibi', email: 'fatima@i9amati.com'  },
  { firstName: 'Youssef', lastName: 'Mansour', email: 'youssef@i9amati.com' },
]
const ALL_FACILITIES = ['ELEVATOR', 'PARKING', 'SECURITY', 'POOL', 'GYM', 'GARDEN', 'WIFI', 'VENTILATION']
const BLDG_LETTERS   = ['A', 'B', 'C', 'D']

function makeMock(): typeof EMPTY {
  const isComplex   = Math.random() > 0.4
  const bldgCount   = isComplex ? randInt(2, 3) : 1
  const tfNum       = `${randInt(10, 99)}/${randInt(100000, 999999)}`
  const facCount    = randInt(2, 5)
  const facilities  = [...ALL_FACILITIES].sort(() => Math.random() - 0.5).slice(0, facCount)
  const usedOwners  = [...MOCK_OWNERS].sort(() => Math.random() - 0.5)
  let   ownerIdx    = 0

  // distribute 1000 millièmes across buildings
  const bldgShares: number[] = []
  let remaining = 1000
  for (let i = 0; i < bldgCount; i++) {
    const share = i === bldgCount - 1 ? remaining : randInt(200, Math.floor(remaining / (bldgCount - i)))
    bldgShares.push(share)
    remaining -= share
  }

  const buildings: Building[] = Array.from({ length: bldgCount }, (_, i) => ({
    id:         `b${i + 1}`,
    name:       `البناية ${BLDG_LETTERS[i]}`,
    floors:     randInt(3, 7),
    unionType:  'IMMEUBLE',
    lotNumber:  `LOT-0${i + 1}`,
    quotePart:  isComplex ? bldgShares[i] : null,
    areaSqm:    randInt(600, 2000),
    facilities: [],
  }))

  // distribute 1000 millièmes across apartments per building
  const apartments: Apartment[] = []
  buildings.forEach((b) => {
    const aptCount = randInt(2, 4)
    const aptShares: number[] = []
    let rem = 1000
    for (let j = 0; j < aptCount; j++) {
      const s = j === aptCount - 1 ? rem : randInt(80, Math.floor(rem / (aptCount - j)))
      aptShares.push(s)
      rem -= s
    }
    Array.from({ length: aptCount }, (_, j) => {
      const floor  = randInt(1, b.floors)
      const letter = BLDG_LETTERS[Number(b.id.replace('b', '')) - 1]
      const owner  = usedOwners[ownerIdx % usedOwners.length]
      ownerIdx++
      apartments.push({
        id:                 `a${b.id}${j}`,
        buildingId:         b.id,
        number:             `${letter}${floor}0${j + 1}`,
        floor,
        lotNumber:          `${(Number(b.id.replace('b', '')) - 1) * 100 + j + 1}`,
        quotePart:          aptShares[j],
        quotePartResidence: isComplex ? Math.round(aptShares[j] * bldgShares[Number(b.id.replace('b', '')) - 1] / 1000) : null,
        areaSqm:            randInt(55, 140),
        owners:             [{ id: crypto.randomUUID(), ...owner, isPrimary: true, gender: 'MALE' as const }],
      })
    })
  })

  return {
    name:         rand(MOCK_NAMES),
    address:      rand(MOCK_STREETS),
    city:         rand(MOCK_CITIES),
    description:  rand(MOCK_DESCS),
    titreFoncier: tfNum,
    status:       'ACTIVE',
    facilities,
    buildings,
    apartments,
  }
}

const EMPTY = {
  name: '', address: '', city: '', description: '',
  titreFoncier: '', status: 'ACTIVE', facilities: [] as string[],
  buildings:  [] as Building[],
  apartments: [] as Apartment[],
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-6">
      <span className="w-2 h-2 rounded-full shrink-0 bg-primary" />
      <span className="text-[11px] font-bold text-primary uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

// ── Floating label input ──────────────────────────────────────────────────────

function FloatInput({
  label, value = '', onChange, icon: Icon, type = 'text', placeholder = ' ',
}: {
  label: string; value?: string; onChange: (v: string) => void
  icon?: React.ElementType; type?: string; placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  const filled = (value ?? '').length > 0
  return (
    <div className="relative group">
      <div className={`flex items-center gap-3 w-full rounded-xl border-2 bg-slate-50/60 px-4 pt-5 pb-2 transition-all duration-200
        ${focused ? 'border-primary bg-white shadow-[0_0_0_4px_hsl(173_53%_36%/0.08)]' : 'border-slate-200 hover:border-primary/30'}`}>
        {Icon && <Icon size={16} className={`shrink-0 mt-0.5 transition-colors ${focused ? 'text-primary' : 'text-slate-400'}`} />}
        <div className="flex-1 relative">
          <label className={`absolute left-0 transition-all duration-200 pointer-events-none font-medium
            ${focused || filled ? 'text-[10px] top-0 text-primary' : 'text-sm top-1.5 text-slate-400'}`}>
            {label}
          </label>
          <input
            type={type} value={value ?? ''} placeholder={focused ? placeholder : ''}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            className="w-full bg-transparent text-sm text-slate-800 outline-none pt-3 pb-0 placeholder:text-slate-300"
          />
        </div>
      </div>
    </div>
  )
}

function FloatTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0
  const max = 200
  return (
    <div className="relative">
      <div className={`w-full rounded-xl border-2 bg-slate-50/60 px-4 pt-5 pb-2 transition-all duration-200
        ${focused ? 'border-primary bg-white shadow-[0_0_0_4px_hsl(173_53%_36%/0.08)]' : 'border-slate-200 hover:border-primary/30'}`}>
        <label className={`block transition-all duration-200 font-medium pointer-events-none
          ${focused || filled ? 'text-[10px] text-primary mb-1' : 'text-sm text-slate-400 mb-1'}`}>
          {label}
        </label>
        <textarea value={value} onChange={e => onChange(e.target.value.slice(0, max))}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          rows={3} placeholder={focused ? 'Description courte...' : ''}
          className="w-full bg-transparent text-sm text-slate-800 outline-none resize-none placeholder:text-slate-300"
        />
        <p className="text-right text-[10px] text-slate-400 mt-1">{value.length}/{max}</p>
      </div>
    </div>
  )
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

function Step1({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  const toggleFacility = (key: string) => {
    const current: string[] = data.facilities ?? []
    set('facilities', current.includes(key) ? current.filter(k => k !== key) : [...current, key])
  }

  return (
    <div>
      <SectionDivider label="Résidence" />
      <div className="space-y-4">
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

      <SectionDivider label="Titre Foncier & Statut" />
      <div className="space-y-4">
        <FloatInput label="Numéro du titre foncier" value={data.titreFoncier}
          onChange={v => set('titreFoncier', v)} icon={FileText} placeholder="Ex: 38/163500" />
        <div className="grid grid-cols-3 gap-3">
          {STATUS_OPTIONS.map(s => {
            const active = data.status === s.value
            return (
              <button key={s.value} type="button" onClick={() => set('status', s.value)}
                className={`relative p-3 rounded-xl border-2 text-left transition-all duration-150
                  ${active ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/30 hover:bg-primary/[0.02]'}`}>
                {active && (
                  <motion.div layoutId="status-check"
                    className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                    <Check size={9} className="text-white" />
                  </motion.div>
                )}
                <span className={`block w-2 h-2 rounded-full mb-2 ${s.dot}`} />
                <p className={`text-xs font-bold ${active ? 'text-primary' : 'text-slate-700'}`}>{s.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      <SectionDivider label="Équipements de la résidence (communs)" />
      <div className="grid grid-cols-4 gap-3">
        {FACILITIES.map(f => {
          const active = (data.facilities ?? []).includes(f.key)
          return (
            <button key={f.key} type="button" onClick={() => toggleFacility(f.key)}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150
                ${active ? 'border-primary bg-primary/5 shadow-[0_0_0_3px_hsl(173_53%_36%/0.10)]'
                         : 'border-slate-200 bg-slate-50/60 hover:border-primary/30 hover:bg-primary/[0.02]'}`}>
              {active && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary">
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
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-1.5 mt-3">
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

// ── Step 2 ────────────────────────────────────────────────────────────────────

function Step2({ data, set }: { data: any; set: (k: string, v: any) => void }) {
  const buildings: Building[] = data.buildings ?? []
  const isComplex = buildings.length > 1

  const addBuilding = () => {
    set('buildings', [...buildings, {
      id: crypto.randomUUID(), name: '', floors: 1, unionType: 'IMMEUBLE',
      lotNumber: '', quotePart: null, areaSqm: null, facilities: [],
    }])
  }

  const updateBuilding = (id: string, field: keyof Building, value: any) =>
    set('buildings', buildings.map(b => b.id === id ? { ...b, [field]: value } : b))

  const removeBuilding = (id: string) => {
    set('buildings', buildings.filter(b => b.id !== id))
    set('apartments', (data.apartments ?? []).filter((a: Apartment) => a.buildingId !== id))
  }

  return (
    <div>
      <SectionDivider label="Bâtiments" />
      <div className="space-y-4">
        {buildings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
            <Home size={28} strokeWidth={1.5} className="mb-2" />
            <p className="text-sm font-medium">Aucun bâtiment ajouté</p>
            <p className="text-xs mt-0.5">Cliquez sur "Ajouter" pour commencer</p>
          </div>
        )}

        {/* Complex info banner */}
        {isComplex && (
          <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] px-4 py-3">
            <Building2 size={14} className="text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-primary/80 leading-relaxed">
              <span className="font-bold">Complexe résidentiel</span> — chaque bâtiment doit avoir un <span className="font-bold">numéro de lot</span> et une <span className="font-bold">quote-part en millièmes</span> dans la résidence (total = 1 000 ‰). Loi 18-00 / Loi 106-12.
            </p>
          </div>
        )}

        {buildings.map((b, i) => (
          <div key={b.id} className="rounded-xl border-2 border-primary/20 bg-primary/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Bâtiment {i + 1}</span>
              <button type="button" onClick={() => removeBuilding(b.id)}
                className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
            <FloatInput label="Nom du bâtiment" value={b.name}
              onChange={v => updateBuilding(b.id, 'name', v)} icon={Home} placeholder="Ex: البناية A" />

            {/* Legal identifiers row */}
            <div className="grid grid-cols-2 gap-3">
              <FloatInput label="Numéro de lot du bâtiment" value={b.lotNumber}
                onChange={v => updateBuilding(b.id, 'lotNumber', v)} icon={FileText}
                placeholder="Ex: LOT-01" />
              {isComplex && (
                <div className="relative group">
                  <div className="flex items-center gap-3 w-full rounded-xl border-2 bg-slate-50/60 px-4 pt-5 pb-2 border-slate-200 hover:border-primary/30 transition-all duration-200">
                    <FileText size={16} className="shrink-0 mt-0.5 text-slate-400" />
                    <div className="flex-1 relative">
                      <label className="absolute left-0 text-[10px] top-0 text-primary font-medium pointer-events-none">
                        Quote-part résidence (‰)
                      </label>
                      <input type="number" min={0} max={1000} step={1}
                        value={b.quotePart ?? ''}
                        onChange={e => updateBuilding(b.id, 'quotePart', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="Ex: 550"
                        className="w-full bg-transparent text-sm text-slate-800 outline-none pt-3 pb-0 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">Type</p>
                <div className="flex gap-1.5">
                  {UNION_TYPES.map(u => (
                    <button key={u.value} type="button" onClick={() => updateBuilding(b.id, 'unionType', u.value)}
                      className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold transition-all
                        ${b.unionType === u.value ? 'border-primary bg-primary text-white' : 'border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary'}`}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">Étages</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateBuilding(b.id, 'floors', Math.max(1, b.floors - 1))}
                    className="w-8 h-8 rounded-lg border-2 border-primary/30 text-primary hover:border-primary hover:bg-primary/5 transition-colors font-bold">−</button>
                  <span className="flex-1 text-center text-sm font-bold text-primary">{b.floors}</span>
                  <button type="button" onClick={() => updateBuilding(b.id, 'floors', b.floors + 1)}
                    className="w-8 h-8 rounded-lg border-2 border-primary/30 text-primary hover:border-primary hover:bg-primary/5 transition-colors font-bold">+</button>
                </div>
              </div>
              <div className="relative">
                <div className="flex items-center gap-3 w-full rounded-xl border-2 bg-slate-50/60 px-4 pt-5 pb-2 border-slate-200 hover:border-primary/30 transition-all duration-200">
                  <div className="flex-1 relative">
                    <label className="absolute left-0 text-[10px] top-0 text-primary font-medium pointer-events-none">
                      Surface (m²)
                    </label>
                    <input type="number" min={0} step={0.5}
                      value={b.areaSqm ?? ''}
                      onChange={e => updateBuilding(b.id, 'areaSqm', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="Ex: 1200"
                      className="w-full bg-transparent text-sm text-slate-800 outline-none pt-3 pb-0 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Building facilities */}
            <div>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">Équipements du bâtiment</p>
              <div className="grid grid-cols-4 gap-2">
                {FACILITIES.map(f => {
                  const active = (b.facilities ?? []).includes(f.key)
                  return (
                    <button key={f.key} type="button"
                      onClick={() => updateBuilding(b.id, 'facilities',
                        active ? (b.facilities ?? []).filter(k => k !== f.key) : [...(b.facilities ?? []), f.key])}
                      className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border-2 transition-all text-center
                        ${active ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400 hover:border-primary/30 hover:text-primary/60'}`}>
                      <f.icon size={14} strokeWidth={active ? 2.5 : 1.5} />
                      <span className="text-[10px] font-semibold leading-tight">{f.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addBuilding}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all text-sm font-semibold">
          <Plus size={15} /> Ajouter un bâtiment
        </button>
      </div>
    </div>
  )
}

// ── Step 3 ────────────────────────────────────────────────────────────────────

function Step3({ data, set, lockedApt }: { data: any; set: (k: string, v: any) => void; lockedApt?: LockedApartment }) {
  const buildings: Building[]   = data.buildings ?? []
  const apartments: Apartment[] = data.apartments ?? []
  const isComplex = buildings.length > 1
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }))

  const addApartment = (buildingId: string) => {
    set('apartments', [...apartments, {
      id: crypto.randomUUID(), buildingId, number: '', floor: 1,
      lotNumber: '', quotePart: null, quotePartResidence: null, areaSqm: null,
      owners: [makeOwner(true)],
    }])
  }

  const updateApartment = (id: string, field: keyof Apartment, value: any) =>
    set('apartments', apartments.map(a => a.id === id ? { ...a, [field]: value } : a))

  const removeApartment = (id: string) =>
    set('apartments', apartments.filter(a => a.id !== id))

  if (!lockedApt && buildings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Home size={32} strokeWidth={1.5} className="mb-3" />
        <p className="text-sm font-semibold">Aucun bâtiment défini</p>
        <p className="text-xs mt-1">Retournez à l'étape 2 pour ajouter des bâtiments</p>
      </div>
    )
  }

  return (
    <div>
      {/* Parking alert — hidden when just adding owners to existing apt */}
      {!lockedApt && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-2">
          <Car size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700">Convention des étages</p>
            <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
              L'<span className="font-bold">étage 0</span> est réservé au <span className="font-bold">RDC / parking</span> — les appartements commencent à partir de l'<span className="font-bold">étage 1</span>. Si votre bâtiment dispose d'un parking, il est déjà indiqué dans les équipements de la résidence.
            </p>
          </div>
        </div>
      )}

      {buildings.map((b, bi) => {
        const bApts = apartments.filter(a => a.buildingId === b.id)
        return (
          <div key={b.id}>
            {!lockedApt && (
              <button type="button" onClick={() => toggle(b.id)}
                className="flex items-center gap-3 my-6 w-full group">
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest whitespace-nowrap">
                  {b.name || `Bâtiment ${bi + 1}`}
                </span>
                <span className="text-[10px] font-semibold text-white bg-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                  {b.unionType}
                </span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {b.floors} étage{b.floors > 1 ? 's' : ''} · 1 → {b.floors}
                </span>
                {bApts.length > 0 && (
                  <span className="text-[10px] font-semibold text-primary/70 whitespace-nowrap">
                    {bApts.length} appt{bApts.length > 1 ? 's' : ''}
                  </span>
                )}
                <div className="flex-1 h-px bg-slate-200" />
                <motion.div animate={{ rotate: collapsed[b.id] ? -90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                </motion.div>
              </button>
            )}

            <AnimatePresence initial={false}>
              {(lockedApt || !collapsed[b.id]) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden">
                  <div className="space-y-4">
                    {!lockedApt && bApts.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-3">Aucun appartement pour ce bâtiment</p>
                    )}
                    {bApts.map((apt, ai) => {
                      const floorError = !lockedApt && apt.floor > b.floors
                      return (
                        <div key={apt.id} className="rounded-xl border-2 border-primary/20 bg-primary/[0.02] p-4 space-y-3">
                          {!lockedApt && (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Appartement {ai + 1}</span>
                                <button type="button" onClick={() => removeApartment(apt.id)}
                                  className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <FloatInput label="Numéro / Référence" value={apt.number}
                                  onChange={v => updateApartment(apt.id, 'number', v)} placeholder="Ex: A101" />
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Étage</p>
                                    <p className="text-[10px] text-slate-400">1→{b.floors}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button"
                                      onClick={() => updateApartment(apt.id, 'floor', Math.max(1, apt.floor - 1))}
                                      className="w-8 h-8 rounded-lg border-2 border-primary/30 text-primary hover:border-primary hover:bg-primary/5 transition-colors font-bold">−</button>
                                    <span className={`flex-1 text-center text-sm font-bold ${floorError ? 'text-red-500' : 'text-primary'}`}>
                                      {apt.floor}
                                    </span>
                                    <button type="button"
                                      onClick={() => updateApartment(apt.id, 'floor', Math.min(b.floors, apt.floor + 1))}
                                      disabled={apt.floor >= b.floors}
                                      className="w-8 h-8 rounded-lg border-2 border-primary/30 text-primary hover:border-primary hover:bg-primary/5 transition-colors font-bold disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                                  </div>
                                  {floorError && <p className="text-[10px] text-red-500 mt-1">Max {b.floors}</p>}
                                </div>
                                <div className="relative">
                                  <div className="flex items-center gap-3 w-full rounded-xl border-2 bg-slate-50/60 px-4 pt-5 pb-2 border-slate-200 hover:border-primary/30 transition-all duration-200 h-full">
                                    <div className="flex-1 relative">
                                      <label className="absolute left-0 text-[10px] top-0 text-primary font-medium pointer-events-none">Surface (m²)</label>
                                      <input type="number" min={0} step={0.5}
                                        value={apt.areaSqm ?? ''}
                                        onChange={e => updateApartment(apt.id, 'areaSqm', e.target.value === '' ? null : Number(e.target.value))}
                                        placeholder="Ex: 85"
                                        className="w-full bg-transparent text-sm text-slate-800 outline-none pt-3 pb-0 placeholder:text-slate-300"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className={`grid gap-3 ${isComplex ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                <FloatInput label="N° de lot (رقم القطعة)" value={apt.lotNumber}
                                  onChange={v => updateApartment(apt.id, 'lotNumber', v)} icon={FileText} placeholder="Ex: 101" />
                                <div className="relative">
                                  <div className="flex items-center gap-3 w-full rounded-xl border-2 bg-slate-50/60 px-4 pt-5 pb-2 border-slate-200 hover:border-primary/30 transition-all duration-200">
                                    <div className="flex-1 relative">
                                      <label className="absolute left-0 text-[10px] top-0 text-primary font-medium pointer-events-none">Millièmes immeuble (‰)</label>
                                      <input type="number" min={0} max={1000} step={1}
                                        value={apt.quotePart ?? ''}
                                        onChange={e => updateApartment(apt.id, 'quotePart', e.target.value === '' ? null : Number(e.target.value))}
                                        placeholder="Ex: 120"
                                        className="w-full bg-transparent text-sm text-slate-800 outline-none pt-3 pb-0 placeholder:text-slate-300"
                                      />
                                    </div>
                                  </div>
                                </div>
                                {isComplex && (
                                  <div className="relative">
                                    <div className="flex items-center gap-3 w-full rounded-xl border-2 bg-slate-50/60 px-4 pt-5 pb-2 border-slate-200 hover:border-primary/30 transition-all duration-200">
                                      <div className="flex-1 relative">
                                        <label className="absolute left-0 text-[10px] top-0 text-primary font-medium pointer-events-none">Millièmes résidence (‰)</label>
                                        <input type="number" min={0} max={1000} step={1}
                                          value={apt.quotePartResidence ?? ''}
                                          onChange={e => updateApartment(apt.id, 'quotePartResidence', e.target.value === '' ? null : Number(e.target.value))}
                                          placeholder="Ex: 66"
                                          className="w-full bg-transparent text-sm text-slate-800 outline-none pt-3 pb-0 placeholder:text-slate-300"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                          {/* Owners */}
                          <div className="pt-3 border-t border-primary/10 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                Propriétaires ({apt.owners.length})
                              </p>
                              <button type="button"
                                onClick={() => updateApartment(apt.id, 'owners', [...apt.owners, makeOwner(false)])}
                                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/70 transition-colors">
                                <Plus size={10} /> Ajouter
                              </button>
                            </div>

                            {apt.owners.map((owner) => (
                              <div key={owner.id}
                                className={`rounded-lg border-2 p-3 space-y-2 transition-colors
                                  ${owner.isPrimary ? 'border-primary/40 bg-primary/[0.03]' : 'border-slate-200 bg-white'}`}>
                                {/* Header: title + delete */}
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Propriétaire {apt.owners.length > 1 ? apt.owners.indexOf(owner) + 1 : ''}
                                  </p>
                                  {apt.owners.length > 1 && (
                                    <button type="button"
                                      onClick={() => {
                                        const filtered = apt.owners.filter(o => o.id !== owner.id)
                                        const hasRep = filtered.some(o => o.isPrimary)
                                        updateApartment(apt.id, 'owners',
                                          hasRep ? filtered : filtered.map((o, i) => i === 0 ? { ...o, isPrimary: true } : o))
                                      }}
                                      className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors shrink-0">
                                      <Trash2 size={10} />
                                    </button>
                                  )}
                                </div>
                                {/* Name row */}
                                <div className="grid grid-cols-2 gap-2">
                                  <FloatInput label="Prénom" value={owner.firstName}
                                    onChange={v => updateApartment(apt.id, 'owners',
                                      apt.owners.map(o => o.id === owner.id ? { ...o, firstName: v } : o))} />
                                  <FloatInput label="Nom" value={owner.lastName}
                                    onChange={v => updateApartment(apt.id, 'owners',
                                      apt.owners.map(o => o.id === owner.id ? { ...o, lastName: v } : o))} />
                                </div>
                                {/* Email */}
                                <FloatInput label="Email" value={owner.email} type="email"
                                  onChange={v => updateApartment(apt.id, 'owners',
                                    apt.owners.map(o => o.id === owner.id ? { ...o, email: v } : o))}
                                  placeholder={owner.isPrimary ? 'email du compte' : 'email (optionnel)'} />
                                {/* Genre */}
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-24 shrink-0">Genre :</span>
                                  <div className="flex items-center gap-1.5">
                                    <button type="button"
                                      onClick={() => updateApartment(apt.id, 'owners',
                                        apt.owners.map(o => o.id === owner.id ? { ...o, gender: 'MALE' } : o))}
                                      className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-semibold transition-all
                                        ${owner.gender === 'MALE'
                                          ? 'border-blue-400 bg-blue-50 text-blue-600'
                                          : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                      ♂ Homme
                                    </button>
                                    <button type="button"
                                      onClick={() => updateApartment(apt.id, 'owners',
                                        apt.owners.map(o => o.id === owner.id ? { ...o, gender: 'FEMALE' } : o))}
                                      className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-semibold transition-all
                                        ${owner.gender === 'FEMALE'
                                          ? 'border-pink-400 bg-pink-50 text-pink-600'
                                          : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                      ♀ Femme
                                    </button>
                                  </div>
                                </div>
                                {/* Représentant */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide w-24 shrink-0">Représentant :</span>
                                  <button type="button"
                                    onClick={() => updateApartment(apt.id, 'owners',
                                      owner.isPrimary
                                        ? apt.owners.map(o => ({ ...o, isPrimary: false }))
                                        : apt.owners.map(o => ({ ...o, isPrimary: o.id === owner.id })))}
                                    className="flex items-center gap-1.5 group">
                                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                                      ${owner.isPrimary
                                        ? 'border-primary bg-primary'
                                        : 'border-slate-300 group-hover:border-primary/50'}`}>
                                      {owner.isPrimary && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                    <span className={`text-[11px] font-semibold transition-colors
                                      ${owner.isPrimary ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                      {owner.isPrimary ? 'Principal' : 'Définir comme principal'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {!lockedApt && (
                      <button type="button" onClick={() => addApartment(b.id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all text-sm font-semibold">
                        <Plus size={14} /> Ajouter un appartement
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ── Step 4: Aperçu ────────────────────────────────────────────────────────────

function Step4({
  data,
  lockedResidence,
  lockedBuilding,
}: {
  data: any
  set: (k: string, v: any) => void
  lockedResidence?: LockedResidence
  lockedBuilding?: LockedBuilding
}) {
  const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Actif', MAINTENANCE: 'Travaux', INACTIVE: 'Inactif' }
  const buildings: Building[]   = data.buildings ?? []
  const apartments: Apartment[] = data.apartments ?? []
  const facilities: string[]    = data.facilities ?? []

  const resName    = lockedResidence?.name    ?? data.name
  const resAddress = lockedResidence?.address ?? data.address
  const resCity    = lockedResidence?.city    ?? data.city
  const resDesc    = data.description
  const resTf      = data.titreFoncier
  const resStatus  = data.status

  return (
    <div>
      <SectionDivider label="Résidence" />
      <div className={`grid gap-4 ${lockedResidence ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3">
          {[
            { label: 'Nom',         val: resName    },
            { label: 'Adresse',     val: resAddress },
            { label: 'Ville',       val: resCity    },
            { label: 'Description', val: resDesc    },
          ].map(({ label, val }) => (
            <div key={label}>
              <p className="text-[10px] text-primary/60">{label}</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {val || <span className="text-slate-300 font-normal italic">—</span>}
              </p>
            </div>
          ))}
        </div>
        {!lockedResidence && (
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-2">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Titre foncier & Statut</p>
            <div>
              <p className="text-[10px] text-primary/60">Titre foncier</p>
              <p className="text-sm font-semibold text-slate-700">{resTf || <span className="text-slate-300 italic font-normal">—</span>}</p>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
              resStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
              resStatus === 'MAINTENANCE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              {STATUS_LABEL[resStatus] ?? resStatus}
            </span>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-3">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Équipements ({facilities.length})</p>
            {facilities.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {facilities.map(k => {
                  const f = FACILITIES.find(x => x.key === k)
                  return f ? (
                    <span key={k} className="flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <f.icon size={9} /> {f.label}
                    </span>
                  ) : null
                })}
              </div>
            ) : <p className="text-xs text-slate-400 italic">Aucun</p>}
          </div>
        </div>
        )}
      </div>

      <SectionDivider label={`Bâtiments (${buildings.length})`} />
      {buildings.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Aucun bâtiment ajouté</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {buildings.map((b, i) => {
            const bApts = apartments.filter(a => a.buildingId === b.id)
            const isComplex = buildings.length > 1
            return (
              <div key={b.id} className="rounded-xl border border-primary/20 bg-primary/[0.02] p-3 space-y-1.5">
                <p className="text-xs font-bold text-primary">{b.name || `Bâtiment ${i + 1}`}</p>
                <p className="text-[10px] text-slate-400">{b.unionType} · {b.floors} étage{b.floors > 1 ? 's' : ''}{b.areaSqm != null ? ` · ${b.areaSqm} m²` : ''}</p>
                {b.lotNumber && (
                  <p className="text-[10px] text-slate-600">
                    <span className="font-semibold text-primary/60">N° lot :</span> {b.lotNumber}
                  </p>
                )}
                {isComplex && b.quotePart != null && (
                  <p className="text-[10px] text-slate-600">
                    <span className="font-semibold text-primary/60">Quote-part résidence :</span> {b.quotePart} ‰
                  </p>
                )}
                <p className="text-[10px] text-primary/70 font-medium">{bApts.length} appartement{bApts.length !== 1 ? 's' : ''}</p>
              </div>
            )
          })}
        </div>
      )}

      <SectionDivider label={`Appartements & Propriétaires (${apartments.length})`} />
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 mb-3">
        <Car size={12} className="text-amber-500 shrink-0" />
        <p className="text-[10px] text-amber-600">
          Étage <span className="font-bold">0</span> = RDC / parking · Les appartements débutent à l'étage <span className="font-bold">1</span>
        </p>
      </div>
      {apartments.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Aucun appartement ajouté</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {apartments.map((apt, i) => {
            const b = buildings.find(b => b.id === apt.buildingId)
            const isComplex = buildings.length > 1
            const rep = apt.owners?.find(o => o.isPrimary) ?? apt.owners?.[0]
            return (
              <div key={apt.id} className="rounded-xl border border-primary/20 bg-primary/[0.02] p-3 space-y-1">
                <p className="text-xs font-bold text-primary">Appt. {apt.number || i + 1} · Étage {apt.floor}{apt.areaSqm != null ? ` · ${apt.areaSqm} m²` : ''}</p>
                <p className="text-[10px] text-slate-400">{b?.name ?? '—'}</p>
                {apt.lotNumber && (
                  <p className="text-[10px] text-slate-600">
                    <span className="font-semibold text-primary/60">N° lot :</span> {apt.lotNumber}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {apt.quotePart != null && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                      {apt.quotePart} ‰ immeuble
                    </span>
                  )}
                  {isComplex && apt.quotePartResidence != null && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                      {apt.quotePartResidence} ‰ résidence
                    </span>
                  )}
                </div>
                {rep?.firstName || rep?.lastName ? (
                  <div className="pt-0.5">
                    <p className="text-[10px] text-primary font-semibold">{rep.firstName} {rep.lastName}</p>
                    {(apt.owners?.length ?? 0) > 1 && (
                      <p className="text-[10px] text-slate-400">+{apt.owners.length - 1} copropriétaire{apt.owners.length > 2 ? 's' : ''}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Sans propriétaire</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Types for context-aware mode ─────────────────────────────────────────────

type LockedResidence  = { id: string; name: string; address: string; city?: string | null }
type LockedBuilding   = { id: string; name: string; floors: number; union_type?: string | null }
type LockedApartment  = { id: string; unit_code: string; floor?: number | null; area_sqm?: number | null; quote_part?: number | null; lot_number?: string | null }

// ── Main modal ────────────────────────────────────────────────────────────────

export function AddResidenceModal({
  children,
  onSuccess,
  startStep = 1,
  lockedResidence,
  lockedBuilding,
  lockedApartment,
}: {
  children: React.ReactNode
  onSuccess?: () => void
  startStep?: 1 | 2 | 3
  lockedResidence?:  LockedResidence
  lockedBuilding?:   LockedBuilding
  lockedApartment?:  LockedApartment
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<number>(startStep)
  const [data, setData] = useState(makeMock)
  const [dir,  setDir]  = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const set = (k: string, v: any) => setData(d => ({ ...d, [k]: v }))

  const go = (next: number) => { setDir(next > step ? 1 : -1); setStep(next) }

  const canNext = () => {
    if (step === 1) return data.name.trim().length > 0 && data.address.trim().length > 0
    return true
  }

  const railTitle = lockedApartment  ? 'Propriétaire'
                  : startStep === 1  ? 'Résidence'
                  : startStep === 2  ? 'Bâtiment'
                  : 'Appartement'

  const submitLabel = lockedApartment  ? 'Ajouter propriétaire(s)'
                    : startStep === 1  ? 'Créer la résidence'
                    : startStep === 2  ? 'Ajouter bâtiment(s)'
                    : 'Ajouter appartement(s)'

  const handleOpenChange = (o: boolean) => {
    setOpen(o)
    if (o) {
      setStep(startStep)
      setSubmitError(null)
      if (lockedApartment && lockedBuilding) {
        // startStep=3 + lockedApartment: user only adds owners to existing apartment
        const aptId = crypto.randomUUID()
        setData({
          ...EMPTY,
          buildings: [{
            id: lockedBuilding.id, name: lockedBuilding.name,
            floors: lockedBuilding.floors, unionType: lockedBuilding.union_type ?? 'IMMEUBLE',
            lotNumber: '', quotePart: null, areaSqm: null, facilities: [],
          }],
          apartments: [{
            id: aptId, buildingId: lockedBuilding.id,
            number: lockedApartment.unit_code, floor: lockedApartment.floor ?? 1,
            lotNumber: lockedApartment.lot_number ?? '', quotePart: lockedApartment.quote_part ?? null,
            quotePartResidence: null, areaSqm: lockedApartment.area_sqm ?? null,
            owners: [makeOwner(false)],
          }],
        })
      } else if (lockedBuilding) {
        // startStep=3: locked building, user only adds apartments
        setData({
          ...EMPTY,
          buildings: [{
            id:         lockedBuilding.id,
            name:       lockedBuilding.name,
            floors:     lockedBuilding.floors,
            unionType:  lockedBuilding.union_type ?? 'IMMEUBLE',
            lotNumber:  '',
            quotePart:  null,
            areaSqm:    null,
            facilities: [],
          }],
        })
      } else if (startStep >= 2) {
        // startStep=2: user adds new buildings, start clean
        setData({ ...EMPTY })
      } else {
        // startStep=1: full flow, pre-fill with mock for dev convenience
        setData(makeMock())
      }
    }
  }

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setSubmitError(null)
    const label = '[AddResidenceModal]'

    const mapApts = (buildingId: string) =>
      data.apartments
        .filter((a) => a.buildingId === buildingId)
        .map((a) => ({
          number:             a.number,
          floor:              a.floor,
          lotNumber:          a.lotNumber || undefined,
          quotePart:          a.quotePart ?? undefined,
          quotePartResidence: a.quotePartResidence ?? undefined,
          areaSqm:            a.areaSqm ?? undefined,
          owners: a.owners.map((o) => ({
            firstName: o.firstName,
            lastName:  o.lastName,
            email:     o.email,
            isPrimary: o.isPrimary,
            gender:    o.gender,
          })),
        }))

    try {
      let res: Response

      if (startStep === 1) {
        const payload = {
          name:         data.name,
          address:      data.address,
          city:         data.city || undefined,
          description:  data.description || undefined,
          titreFoncier: data.titreFoncier || undefined,
          status:       data.status,
          facilities:   data.facilities,
          buildings:    data.buildings.map((b) => ({
            name:       b.name,
            floors:     b.floors,
            unionType:  b.unionType || undefined,
            lotNumber:  b.lotNumber || undefined,
            quotePart:  b.quotePart ?? undefined,
            areaSqm:    b.areaSqm ?? undefined,
            apartments: mapApts(b.id),
          })),
        }
        console.log(`${label} startStep=1 → POST /api/residences/bulk`, payload)
        res = await fetch('/api/residences/bulk', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })

      } else if (startStep === 2 && lockedResidence) {
        const payload = {
          buildings: data.buildings.map((b) => ({
            name:       b.name,
            floors:     b.floors,
            unionType:  b.unionType || undefined,
            lotNumber:  b.lotNumber || undefined,
            quotePart:  b.quotePart ?? undefined,
            areaSqm:    b.areaSqm ?? undefined,
            apartments: mapApts(b.id),
          })),
        }
        console.log(`${label} startStep=2 → POST /api/residences/${lockedResidence.id}/buildings`, payload)
        res = await fetch(`/api/residences/${lockedResidence.id}/buildings`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })

      } else if (startStep === 3 && lockedApartment) {
        // Add owners to existing apartment — call POST for each owner
        const owners = data.apartments[0]?.owners ?? []
        for (const o of owners) {
          res = await fetch(`/api/apartments/${lockedApartment.id}/shareholders`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: o.firstName, lastName: o.lastName, email: o.email || undefined, isPrimary: o.isPrimary, gender: o.gender }),
          })
          if (!res.ok) break
        }
        res = res!

      } else if (startStep === 3 && lockedBuilding) {
        const payload = { apartments: mapApts(lockedBuilding.id) }
        console.log(`${label} startStep=3 → POST /api/buildings/${lockedBuilding.id}/apartments`, payload)
        res = await fetch(`/api/buildings/${lockedBuilding.id}/apartments`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })

      } else {
        setSubmitError('Configuration invalide')
        setSubmitting(false)
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }))
        console.error(`${label} ❌ Failed (${res.status})`, err)
        setSubmitError(err.message ?? 'Erreur lors de la création')
        toast({ variant: 'error', title: 'Erreur', description: err.message ?? 'Erreur lors de la création' })
        return
      }

      console.log(`${label} ✅ Success`)
      const successMsg =
        lockedApartment ? 'Propriétaire(s) ajouté(s)' :
        lockedBuilding  ? 'Appartement(s) ajouté(s)'  :
        startStep === 2 ? 'Bâtiment(s) ajouté(s)'     :
                          'Résidence créée'
      toast({ variant: 'success', title: successMsg })
      setOpen(false)
      setStep(startStep)
      setData(makeMock())
      onSuccess?.()
    } catch (e) {
      console.error(`${label} ❌ Network error`, e)
      setSubmitError('Erreur réseau — vérifiez votre connexion')
      toast({ variant: 'error', title: 'Erreur réseau', description: 'Vérifiez votre connexion' })
    } finally {
      setSubmitting(false)
    }
  }, [data, startStep, lockedResidence, lockedBuilding, lockedApartment])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[1060px] h-[86vh] overflow-hidden rounded-2xl bg-white shadow-2xl data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 duration-200 flex">

          {/* Left rail */}
          <div className="w-56 shrink-0 bg-slate-900 flex flex-col p-6">
            <div className="mb-8">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nouveau</p>
              <p className="text-white font-bold text-xl leading-tight mt-0.5">{railTitle}</p>
            </div>

            <div className="flex flex-col flex-1">
              {STEPS.map((s, i) => {
                const isLocked  = s.id < startStep
                const done      = !isLocked && step > s.id
                const current   = step === s.id
                const isLast    = i === STEPS.length - 1
                return (
                  <div key={s.id} className="flex flex-col">
                    <button type="button"
                      onClick={() => !isLocked && done && go(s.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                        ${current  ? 'bg-white/10'                    : ''}
                        ${done && !isLocked ? 'hover:bg-white/5 cursor-pointer' : ''}
                        ${!done && !current && !isLocked ? 'opacity-40 cursor-default' : ''}
                        ${isLocked ? 'opacity-30 cursor-default' : ''}`}>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 border-2 transition-all duration-300
                        ${isLocked ? 'border-slate-600 bg-slate-800'  : ''}
                        ${done    && !isLocked ? 'bg-primary border-primary'    : ''}
                        ${current ? 'bg-white border-white'        : ''}
                        ${!done && !current && !isLocked ? 'border-primary/30 bg-transparent' : ''}`}>
                        {isLocked
                          ? <Lock size={11} className="text-slate-500" />
                          : done
                            ? <Check size={13} className="text-white" />
                            : <span className={`text-xs font-bold ${current ? 'text-slate-900' : 'text-slate-400'}`}>{s.id}</span>}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${current ? 'text-white' : done && !isLocked ? 'text-slate-300' : 'text-slate-500'}`}>{s.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{isLocked ? 'Déjà enregistré' : s.sub}</p>
                      </div>
                    </button>
                    {!isLast && (
                      <div className="flex items-start pl-[27px] py-1">
                        <div className={`w-px h-6 border-l-2 border-dashed ${done && !isLocked ? 'border-primary/60' : 'border-primary/20'}`} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-500">Progression</span>
                <span className="text-[10px] font-bold text-slate-400">{step}/{STEPS.length}</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full"
                  animate={{ width: `${(step / STEPS.length) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 24 }} />
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                {(() => { const S = STEPS[step - 1]; return (
                  <>
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10">
                      <S.icon size={13} className="text-primary" />
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{S.label}</span>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{S.sub}</span>
                  </>
                )})()}
              </div>
              <DialogPrimitive.Close className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={15} />
              </DialogPrimitive.Close>
            </div>

            {/* Locked context banners */}
            {startStep >= 2 && lockedResidence && (
              <div className="mx-7 mt-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 shrink-0">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 size={13} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Résidence</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{lockedResidence.name}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{lockedResidence.city ?? lockedResidence.address}</span>
                <Lock size={11} className="text-slate-300 shrink-0" />
              </div>
            )}
            {startStep >= 3 && lockedBuilding && (
              <div className="mx-7 mt-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 shrink-0">
                <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <Home size={13} className="text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Bâtiment</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{lockedBuilding.name}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{lockedBuilding.floors} étages · {lockedBuilding.union_type ?? 'IMMEUBLE'}</span>
                <Lock size={11} className="text-slate-300 shrink-0" />
              </div>
            )}
            {lockedApartment && (
              <div className="mx-7 mt-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 shrink-0">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Users size={13} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Appartement</p>
                  <p className="text-sm font-semibold text-slate-700">{lockedApartment.unit_code}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 shrink-0">
                  {lockedApartment.floor != null && <span>Étage {lockedApartment.floor}</span>}
                  {lockedApartment.area_sqm != null && <span>{lockedApartment.area_sqm} m²</span>}
                  {lockedApartment.quote_part != null && <span>{lockedApartment.quote_part}‰</span>}
                </div>
                <Lock size={11} className="text-slate-300 shrink-0" />
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-7 py-2">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div key={step} custom={dir}
                  initial={{ opacity: 0, x: dir * 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{   opacity: 0, x: dir * -32 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}>
                  {step === 1 && <Step1 data={data} set={set} />}
                  {step === 2 && <Step2 data={data} set={set} />}
                  {step === 3 && <Step3 data={data} set={set} lockedApt={lockedApartment} />}
                  {step === 4 && <Step4 data={data} set={set as any} lockedResidence={lockedResidence} lockedBuilding={lockedBuilding} />}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-2 px-7 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
              {submitError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {submitError}
                </div>
              )}
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => go(step - 1)} disabled={step === startStep || submitting}
                  className="text-sm text-slate-500 hover:text-primary disabled:opacity-0 transition-all">
                  ← Précédent
                </button>
                {step < STEPS.length ? (
                  <button type="button" onClick={() => go(step + 1)} disabled={!canNext()}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-all">
                    Suivant <ChevronRight size={15} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
                    {submitting ? (
                      <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Création...</>
                    ) : (
                      <><Check size={15} /> {submitLabel}</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}
