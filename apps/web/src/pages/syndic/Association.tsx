import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  ChevronRight, ChevronLeft, Plus, MapPin, Building2, Home,
  Users, ChevronDown, ChevronUp, Eye, Pencil,
  ArrowUpDown, Shield, Car, Waves, Dumbbell, Zap, Trees,
  ArrowRight, Hash, Phone, CreditCard, X, Loader2, Wifi, Wind,
  SlidersHorizontal, RotateCcw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AddResidenceModal } from '@/components/residences/AddResidenceModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn, getInitials } from '@/lib/utils'

const FACILITIES = [
  { key: 'ELEVATOR',    label: 'Ascenseur',   icon: Zap      },
  { key: 'PARKING',     label: 'Parking',     icon: Car      },
  { key: 'SECURITY',    label: 'Sécurité',    icon: Shield   },
  { key: 'POOL',        label: 'Piscine',     icon: Waves    },
  { key: 'GYM',         label: 'Salle sport', icon: Dumbbell },
  { key: 'GARDEN',      label: 'Jardin',      icon: Trees    },
  { key: 'WIFI',        label: 'Wi-Fi',       icon: Wifi     },
  { key: 'VENTILATION', label: 'Ventilation', icon: Wind     },
] as const

/* â”€â”€ API types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export type ApiResidence = {
  id: string
  name: string
  address: string
  city: string | null
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'
  facilities: string[] | null
  image: string | null
  building_count: number
  apartment_count: number
  occupied_count: number
  created_at: string
}

export type ApiBuilding = {
  id: string
  name: string
  floors: number
  union_type: string | null
  lot_number: string | null
  quote_part: number | null
  area_sqm: number | null
  has_elevator: boolean
  has_garage: boolean | null
  has_shared_parts: boolean | null
  facilities: string[] | null
  address: string | null
  property_plan_number: string | null
  shared_with_title_deed: string | null
  image: string | null
  residence_id: string
  apartment_count: number
  occupied_count: number
  created_at: string
  updated_at: string
}

export type ApiShareholder = { firstName: string; lastName: string; email: string | null; isPrimary: boolean; gender?: 'MALE' | 'FEMALE' }

export type ApiApartment = {
  id: string
  unit_code: string
  lot_number: string | null
  floor: number | null
  area_sqm: number | null
  quote_part: number | null
  quote_part_residence: number | null
  building_id: string
  owner_profile_id: string | null
  shareholders: ApiShareholder[] | null
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'
  usage_type: 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED'
  created_at: string
  updated_at: string
}

/* â”€â”€ constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const PAGE_SIZE = 4
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80'

const FEMALE_FIRST_NAMES = new Set([
  'sara','sarah','fatima','fatma','layla','leila','nadia','amira','hind','zineb',
  'khadija','maryam','mariam','yasmine','samia','sofia','soukaina','imane','salma',
  'ghita','houda','hasnaa','loubna','hanane','najat','bouchra','naima','rachida',
  'aicha','asma','basma','chaima','dounia','ikram','jihane','karima','lamia','mona',
  'noura','rania','rim','safaa','siham','soumaya','wafae','yousra','zahra','zainab',
  'nora','lina','dina','rina','hana','maha','reem','lama','amal','iman','rima',
  'warda','souad','nawal','bahija','jamila','malak','manal','nour','aya','sana',
])

function detectGender(firstName: string): 'MALE' | 'FEMALE' {
  return FEMALE_FIRST_NAMES.has(firstName.toLowerCase().trim()) ? 'FEMALE' : 'MALE'
}

function shareholderAvatar(s: { firstName: string; lastName: string; gender?: 'MALE' | 'FEMALE' }): string {
  const gender = s.gender ?? detectGender(s.firstName)
  const seed = encodeURIComponent(`${s.firstName}-${s.lastName}`)
  return gender === 'FEMALE'
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffd5dc,ffdfbf&top=longHairBigHair,longHairBob,longHairBun,longHairCurly,longHairCurvy,longHairStraight,longHairFroBand&facialHairChance=0`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede&top=shortHairDreads01,shortHairShortFlat,shortHairShortCurly,shortHairShortRound,shortHairShortWaved,shortHairSides`
}

const FLOOR_PLAN_PHOTOS = [
  'photo-1522708323590-d24dbb6b0267','photo-1560448204-e02f11c3d0e2',
  'photo-1502005097973-6a7082348e28','photo-1484154218962-a197022b5858',
  'photo-1493809842364-78817add7ffb','photo-1556909114-f6e7ad7d3136',
  'photo-1512917774080-9991f1c4c750','photo-1505691938895-1758d7feb511',
  'photo-1554995207-c18c203602cb','photo-1565182999561-18d7dc61c393',
  'photo-1540518614846-7eded433c457','photo-1571508601891-ca5e7a713859',
  'photo-1600585154340-be6161a56a0c','photo-1600210492493-0946911123ea',
  'photo-1600607688969-a5bfcd646154','photo-1618221195710-dd6b41faaea6',
  'photo-1631679706909-1844bbd07221','photo-1617806118233-18e1de247200',
  'photo-1598928506311-c55ded91a20c','photo-1583847268964-b28dc8f51f92',
]

function getFloorPlanImage(residenceId: string) {
  const hash = residenceId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const photoId = FLOOR_PLAN_PHOTOS[hash % FLOOR_PLAN_PHOTOS.length]
  return `https://images.unsplash.com/${photoId}?w=700&h=420&fit=crop&q=80`
}

const FACILITY_ICONS: Record<string, LucideIcon> = {
  ELEVATOR:    ArrowUpDown,
  SECURITY:    Shield,
  PARKING:     Car,
  POOL:        Waves,
  GYM:         Dumbbell,
  GARDEN:      Trees,
  WIFI:        Zap,
  VENTILATION: Zap,
}

const STATUS_CLS = 'inline-flex items-center rounded-md px-2 py-0.5 font-semibold border'

const residenceStatus = {
  ACTIVE:      { label: 'Actif',   cls: `${STATUS_CLS} bg-[#5A8F76]/[0.12] text-[#5A8F76] border-[#5A8F76]/30` },
  MAINTENANCE: { label: 'Travaux', cls: `${STATUS_CLS} bg-amber-50 text-amber-600 border-amber-200` },
  INACTIVE:    { label: 'Inactif', cls: `${STATUS_CLS} bg-[#8F5C64]/[0.12] text-[#8F5C64] border-[#8F5C64]/30` },
}

const aptStatus = {
  OCCUPIED:    { label: 'Occupé',  cls: `${STATUS_CLS} bg-[#5A8F76]/[0.12] text-[#5A8F76] border-[#5A8F76]/30` },
  VACANT:      { label: 'Vacant',  cls: `${STATUS_CLS} bg-[#33091B]/[0.08] text-[#33091B] border-[#33091B]/20` },
  MAINTENANCE: { label: 'Travaux', cls: `${STATUS_CLS} bg-amber-50 text-amber-600 border-amber-200` },
}

/* â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className={`text-sm font-bold tabular-nums leading-none ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground leading-none">{label}</span>
    </span>
  )
}

const EASE_OUT_QUART: [number, number, number, number] = [0.25, 1, 0.5, 1]

function FacilityPill({ name }: { name: string }) {
  const [hovered, setHovered] = useState(false)
  const Icon = FACILITY_ICONS[name]

  return (
    <motion.div
      layout
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
      className="flex items-center gap-1.5 h-6 px-1.5 rounded-md bg-[#8F5C64]/[0.10] overflow-hidden cursor-default select-none"
    >
      {Icon
        ? <Icon size={11} className="text-[#8F5C64] shrink-0" />
        : <span className="text-[9px] font-medium text-[#8F5C64]">{name.slice(0, 2)}</span>
      }
      <AnimatePresence>
        {hovered && (
          <motion.span key={name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
            className="text-[10px] text-[#8F5C64] whitespace-nowrap pr-0.5"
          >
            {name}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function NavBar({ onBack, crumbs, onManage, onClose }: {
  onBack: () => void
  crumbs: { label: string; onClick?: () => void }[]
  onManage: () => void
  onClose: () => void
}) {
  return (
    <div className="flex items-center gap-0 h-11 border-b bg-muted/20 shrink-0">
      <button onClick={onBack} className="group flex items-center gap-2 h-full px-4 border-r border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0">
        <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-xs font-medium">Back</span>
      </button>
      <nav className="flex items-center gap-1 px-4 flex-1 min-w-0 overflow-hidden">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <span className="text-muted-foreground/30 text-sm shrink-0">/</span>}
            {c.onClick
              ? <button onClick={c.onClick} className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-[140px]">{c.label}</button>
              : <span className="text-xs font-semibold text-foreground truncate max-w-[160px]">{c.label}</span>
            }
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-1.5 pr-3 shrink-0">
        <button onClick={onManage} className="flex items-center gap-1.5 h-7 px-3.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
          Manage <ArrowRight size={12} />
        </button>
        <button onClick={onClose} className="flex items-center justify-center h-7 w-7 rounded-lg border border-border/60 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

function StickyTickets({ buildings, currentBuildingId, buildingApts, currentAptId, onSelectBuilding, onSelectApt }: {
  buildings: { id: string; name: string }[]
  currentBuildingId: string
  buildingApts: { id: string; unit_code: string; status: 'OCCUPIED' | 'VACANT' | 'MAINTENANCE' }[]
  currentAptId?: string
  onSelectBuilding: (id: string) => void
  onSelectApt: (id: string) => void
}) {
  const statusDot: Record<string, string> = {
    OCCUPIED: 'bg-[#5A8F76]', VACANT: 'bg-[#9ABCAB]', MAINTENANCE: 'bg-amber-400',
  }

  return (
    <div className="fixed flex flex-col items-start gap-2 pointer-events-none"
      style={{ left: 'calc(50vw + min(46vw, 40rem))', top: 'calc(6vh + 2.75rem)', zIndex: 60 }}>
      <div className="flex flex-col items-start gap-1">
        {buildings.map(b => {
          const isActive = b.id === currentBuildingId
          return (
            <button key={b.id} onClick={() => onSelectBuilding(b.id)} title={b.name}
              className={cn(
                'pointer-events-auto flex items-center gap-1.5 h-7 px-3 rounded-r-lg text-[11px] font-semibold transition-all shadow-md',
                isActive ? 'bg-slate-800 text-white shadow-slate-900/30' : 'bg-white/90 border border-border text-slate-500 hover:text-slate-800 hover:bg-white',
              )}>
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />}
              <span className="truncate max-w-[80px]">{b.name}</span>
            </button>
          )
        })}
      </div>
      {currentAptId && buildingApts.length > 0 && (
        <div className="pointer-events-auto rounded-r-xl bg-white/95 border border-border shadow-xl overflow-hidden" style={{ minWidth: 110 }}>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border-b border-slate-700">
            <Home size={10} className="text-slate-300 shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Apartments</span>
          </div>
          <div className="flex flex-col divide-y divide-border/50">
            {buildingApts.map(apt => {
              const isActive = apt.id === currentAptId
              return (
                <button key={apt.id} onClick={() => onSelectApt(apt.id)}
                  className={cn('flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-colors text-left w-full',
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}>
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? 'bg-white/70' : statusDot[apt.status])} />
                  <span>{apt.unit_code}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   RESIDENCE OVERVIEW MODAL
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

type ModalNav =
  | { level: 'overview' }
  | { level: 'building'; buildingId: string }
  | { level: 'apartment'; buildingId: string; aptId: string }

function ResidenceModal({ residence, open, onClose, onManage, initialNav }: {
  residence: ApiResidence | null
  open: boolean
  onClose: () => void
  onManage: (r: ApiResidence) => void
  initialNav?: ModalNav
}) {
  const [nav, setNav] = useState<ModalNav>(initialNav ?? { level: 'overview' })
  const [selectedOwnerIdx, setSelectedOwnerIdx] = useState<number | null>(null)
  const [ownerEditMode,    setOwnerEditMode]    = useState(false)
  const [ownerForm,        setOwnerForm]        = useState<ApiShareholder | null>(null)
  const [ownerSaving,      setOwnerSaving]      = useState(false)

  type EditSection = null | 'residence' | 'building-info' | 'building-facilities' | 'apt-info'
  const [editSection, setEditSection] = useState<EditSection>(null)
  const [editForm,    setEditForm]    = useState<Record<string, any>>({})
  const [editSaving,  setEditSaving]  = useState(false)

  const modalQueryClient = useQueryClient()

  // Reset to initialNav each time the modal opens
  useEffect(() => {
    if (open) { setNav(initialNav ?? { level: 'overview' }); setSelectedOwnerIdx(null); setOwnerEditMode(false); setOwnerForm(null) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset owner panel when apartment changes
  useEffect(() => { setSelectedOwnerIdx(null); setOwnerEditMode(false); setOwnerForm(null) }, [(nav as any).aptId])
  // Reset edit section when navigation changes
  useEffect(() => { setEditSection(null); setEditForm({}) }, [nav.level, (nav as any).buildingId, (nav as any).aptId])

  const startEdit = (section: Exclude<EditSection, null>, form: Record<string, any>) => { setEditSection(section); setEditForm(form) }
  const cancelEdit = () => { setEditSection(null); setEditForm({}) }

  const saveEdit = async () => {
    if (!editSection) return
    setEditSaving(true)
    try {
      if (editSection === 'residence') {
        const res = await fetch(`/api/residences/${residence!.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Erreur')
        await modalQueryClient.invalidateQueries({ queryKey: ['residences'] })
      } else if (editSection === 'building-info' || editSection === 'building-facilities') {
        const res = await fetch(`/api/buildings/${activeBuilding!.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Erreur')
        await modalQueryClient.invalidateQueries({ queryKey: ['residence-buildings', residence!.id] })
      } else if (editSection === 'apt-info') {
        const { lotNumber, areaSqm, quotePart, quotePartResidence, floor } = editForm
        const body: Record<string, any> = {}
        if (floor               != null && floor !== '')              body.floor                = Number(floor)
        if (lotNumber           != null && lotNumber !== '')          body.lot_number           = lotNumber
        if (areaSqm             != null && areaSqm !== '')            body.area_sqm             = Number(areaSqm)
        if (quotePart           != null && quotePart !== '')          body.quote_part           = Number(quotePart)
        if (quotePartResidence  != null && quotePartResidence !== '') body.quote_part_residence = Number(quotePartResidence)
        const res = await fetch(`/api/apartments/${activeApt!.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Erreur')
        await modalQueryClient.invalidateQueries({ queryKey: ['building-apartments', activeBuildingId] })
      }
      setEditSection(null); setEditForm({})
    } catch (e: any) { alert(e.message) }
    finally { setEditSaving(false) }
  }

  const handleClose = () => { onClose(); setNav({ level: 'overview' }) }

  // Lazy-fetch buildings only when modal is open
  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['residence-buildings', residence?.id],
    queryFn: () => fetch(`/api/residences/${residence!.id}/buildings`).then(r => r.json()) as Promise<ApiBuilding[]>,
    enabled: open && !!residence,
    staleTime: 60_000,
  })

  // Lazy-fetch apartments when a building is selected inside the modal
  const activeBuildingId = nav.level !== 'overview' ? (nav as any).buildingId as string : null
  const { data: buildingApts = [], isLoading: aptsLoading } = useQuery({
    queryKey: ['building-apartments', activeBuildingId],
    queryFn: () => fetch(`/api/buildings/${activeBuildingId}/apartments`).then(r => r.json()) as Promise<ApiApartment[]>,
    enabled: !!activeBuildingId,
    staleTime: 60_000,
  })

  if (!residence) return null

  const totalApts     = buildings.reduce((s, b) => s + b.apartment_count, 0)
  const totalOccupied = buildings.reduce((s, b) => s + b.occupied_count, 0)
  const totalVacant   = totalApts - totalOccupied
  const isStandalone  = buildings.length === 1 && buildings[0]?.union_type === 'IMMEUBLE'

  const activeBuilding = nav.level !== 'overview'
    ? buildings.find(b => b.id === (nav as any).buildingId) ?? null
    : null
  const activeApt = nav.level === 'apartment'
    ? buildingApts.find(a => a.id === (nav as any).aptId) ?? null
    : null
  const aptShareholders = activeApt?.shareholders ?? []

  const isOverview = nav.level === 'overview'

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="w-[92vw] max-w-7xl h-[88vh] overflow-hidden flex flex-col p-0" showClose={false}>
        <DialogTitle className="sr-only">{residence.name}</DialogTitle>

        <AnimatePresence mode="wait" initial={false}>

          {/* â”€â”€ OVERVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {isOverview && (
            <motion.div key="overview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-border"
            >
              {/* LEFT */}
              <div className="flex flex-col overflow-hidden">
                {editSection === 'residence' ? (
                  /* ── Residence edit form ── */
                  <div className="flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
                      <p className="text-sm font-extrabold">Modifier la résidence</p>
                      <button onClick={cancelEdit} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">Annuler</button>
                    </div>
                    <div className="p-5 space-y-4">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Nom de la résidence</span>
                        <input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Adresse</span>
                        <input value={editForm.address ?? ''} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Ville</span>
                        <input value={editForm.city ?? ''} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </label>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">Statut</p>
                        <div className="flex gap-2">
                          {([['ACTIVE','Actif','bg-emerald-500'],['MAINTENANCE','Travaux','bg-amber-400'],['INACTIVE','Inactif','bg-slate-400']] as const).map(([val, label, dot]) => (
                            <button key={val} type="button" onClick={() => setEditForm(f => ({ ...f, status: val }))}
                              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all
                                ${editForm.status === val ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}>
                              <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />{label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">Équipements communs</p>
                        <div className="grid grid-cols-4 gap-2">
                          {FACILITIES.map(f => {
                            const active = (editForm.facilities ?? []).includes(f.key)
                            return (
                              <button key={f.key} type="button"
                                onClick={() => setEditForm(fm => ({ ...fm, facilities: active ? (fm.facilities ?? []).filter((k: string) => k !== f.key) : [...(fm.facilities ?? []), f.key] }))}
                                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-center
                                  ${active ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/30'}`}>
                                <f.icon size={15} strokeWidth={active ? 2.5 : 1.5} />
                                <span className="text-[9px] font-semibold leading-tight">{f.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <button onClick={saveEdit} disabled={editSaving}
                        className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                        {editSaving && <Loader2 size={14} className="animate-spin" />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                <>
                <div className="relative h-72 shrink-0 overflow-hidden">
                  <img src={residence.image ?? DEFAULT_IMG} alt={residence.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={cn(residenceStatus[residence.status].cls, 'text-[10px]')}>
                        {residenceStatus[residence.status].label}
                      </span>
                      <Badge variant={isStandalone ? 'secondary' : 'info'} className="text-[10px] shadow-sm">
                        {buildingsLoading ? '…' : isStandalone ? 'Standalone' : 'Complex'}
                      </Badge>
                    </div>
                    <button
                      onClick={() => startEdit('residence', { name: residence.name, address: residence.address, city: residence.city ?? '', status: residence.status, facilities: residence.facilities ?? [] })}
                      className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-colors">
                      <Pencil size={12} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.15em] mb-1">
                      {buildingsLoading ? '…' : isStandalone ? 'Standalone Building' : `Residence Complex · ${buildings.length} buildings`}
                    </p>
                    <h2 className="text-2xl font-extrabold text-white leading-tight tracking-tight">{residence.name}</h2>
                    <p className="text-white/55 text-xs flex items-center gap-1.5 mt-1.5">
                      <MapPin size={10} />{residence.city ?? residence.address}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex shrink-0 border-b">
                  {[
                    { label: 'Units',    value: totalApts,     color: 'text-[#203B37]' },
                    { label: 'Occupied', value: totalOccupied, color: 'text-[#5A8F76]' },
                    { label: 'Vacant',   value: totalVacant,   color: 'text-[#9ABCAB]' },
                    { label: 'Owners',   value: 0,             color: 'text-[#8F5C64]' },
                  ].map((s, i) => (
                    <div key={s.label} className={cn('flex-1 flex flex-col items-center py-3', i > 0 && 'border-l border-border/60')}>
                      <span className={`text-base font-bold tabular-nums leading-none ${s.color}`}>{s.value}</span>
                      <span className={`text-[10px] font-medium mt-1 ${s.color} opacity-70`}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Buildings list */}
                <div className="flex-1 overflow-y-auto">
                  <div className="flex items-center px-5 pt-4 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Buildings</p>
                  </div>

                  {buildingsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={20} className="animate-spin text-muted-foreground/40" />
                    </div>
                  ) : (
                    <div className="px-4 pb-4 space-y-2.5">
                      {buildings.map((b, idx) => {
                        const bOccupied = b.occupied_count
                        const bVacant = b.apartment_count - bOccupied
                        const pct = b.apartment_count > 0 ? Math.round((bOccupied / b.apartment_count) * 100) : 0
                        const BADGE_COLORS = [
                          'bg-[#C18D52]/[0.15] text-[#C18D52]','bg-[#203B37]/[0.12] text-[#203B37]',
                          'bg-[#5A8F76]/[0.15] text-[#5A8F76]','bg-[#8F5C64]/[0.15] text-[#8F5C64]',
                        ]
                        const badgeColor = BADGE_COLORS[idx % BADGE_COLORS.length]
                        const letter = (b.name.replace(/[^\w]/g, '').match(/[A-Za-z0-9]/)?.[0] ?? '#').toUpperCase()

                        return (
                          <button key={b.id} onClick={() => setNav({ level: 'building', buildingId: b.id })}
                            className="w-full p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all text-left group">
                            <div className="flex items-center gap-3">
                              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 transition-colors', badgeColor, 'group-hover:bg-primary group-hover:text-white')}>
                                {letter}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{b.name}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {b.floors} floors · {b.apartment_count} units
                                </p>
                              </div>
                              <div className="h-7 w-7 rounded-lg bg-[#203B37]/[0.12] group-hover:bg-[#203B37] flex items-center justify-center transition-colors shrink-0">
                                <ChevronRight size={13} className="text-[#203B37] group-hover:text-white transition-colors" />
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] text-muted-foreground">{bOccupied} occupied · {bVacant} vacant</span>
                                <span className="text-[10px] font-semibold text-muted-foreground">{pct}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-[#5A8F76] transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            {(b.has_elevator || b.has_garage || b.has_shared_parts) && (
                              <div className="flex items-center gap-1 mt-2.5">
                                {b.has_elevator && <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-100">Elevator</span>}
                                {b.has_garage   && <span className="text-[9px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium border border-violet-100">Parking</span>}
                                {b.has_shared_parts && <span className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-medium border border-slate-200">Shared</span>}
                              </div>
                            )}
                          </button>
                        )
                      })}
                      {buildings.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/30">
                          <Building2 size={32} strokeWidth={1} />
                          <p className="text-xs mt-2">No buildings yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                </>
                )}
              </div>

              {/* RIGHT â€” coming soon */}
              <div className="relative flex flex-col items-center justify-center gap-3 bg-muted/30 select-none">
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button onClick={() => { handleClose(); onManage(residence) }}
                    className="flex items-center gap-1.5 h-7 px-3.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
                    Manage <ArrowRight size={12} />
                  </button>
                  <button onClick={handleClose}
                    className="flex items-center justify-center h-7 w-7 rounded-lg border border-border/60 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                    <X size={13} />
                  </button>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Building2 size={26} className="text-muted-foreground/40" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-muted-foreground/50">Coming Soon</p>
                  <p className="text-xs text-muted-foreground/35 mt-1">3D building view</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* â”€â”€ BUILDING DETAIL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {nav.level === 'building' && activeBuilding && (
            <motion.div key="building"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="flex-1 overflow-hidden flex flex-col relative"
            >
              <NavBar
                onBack={() => setNav({ level: 'overview' })}
                crumbs={[
                  { label: residence.name, onClick: () => setNav({ level: 'overview' }) },
                  { label: activeBuilding.name },
                ]}
                onManage={() => { handleClose(); onManage(residence) }}
                onClose={handleClose}
              />

              <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-border">
                {/* LEFT - building info */}
                <div className="flex flex-col overflow-y-auto">
                  <div className="relative h-36 shrink-0 overflow-hidden">
                    <img src={activeBuilding.image ?? residence.image ?? DEFAULT_IMG} alt={activeBuilding.name}
                      className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                      <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.15em] mb-0.5">
                        {activeBuilding.union_type === 'IMMEUBLE' ? 'Standalone Building' : 'Part of Complex'}
                      </p>
                      <h3 className="text-lg font-extrabold text-white leading-tight">{activeBuilding.name}</h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Étages',      value: activeBuilding.floors,          color: 'text-[#C18D52]' },
                        { label: 'Unités',      value: activeBuilding.apartment_count,  color: 'text-[#203B37]' },
                        { label: 'Chargés',     value: buildingApts.length,             color: 'text-[#5A8F76]' },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center py-3.5 rounded-xl bg-muted/40">
                          <span className={`text-2xl font-extrabold tabular-nums leading-none ${s.color}`}>{s.value}</span>
                          <span className={`text-[10px] font-medium mt-1.5 ${s.color} opacity-70`}>{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {(() => {
                      const occ = activeBuilding.occupied_count
                      const tot = activeBuilding.apartment_count || 1
                      const vac = tot - occ
                      const mnt = 0
                      const pct = Math.round((occ / tot) * 100)
                      return (
                        <div className="rounded-xl border border-border/60 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Occupancy</p>
                            <span className="text-xs font-bold text-[#5A8F76]">{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
                            <div className="bg-[#5A8F76] rounded-full transition-all" style={{ width: `${(occ / tot) * 100}%` }} />
                            <div className="bg-slate-200 rounded-full transition-all flex-1" />
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#5A8F76] shrink-0" />Occupied <strong className="text-foreground">{occ}</strong></span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />Maintenance <strong className="text-foreground">{mnt}</strong></span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#9ABCAB] shrink-0" />Vacant <strong className="text-foreground">{vac}</strong></span>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Détails section */}
                    <div className="rounded-xl border border-border/60 divide-y divide-border/50">
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Détails</p>
                        {editSection === 'building-info' ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={cancelEdit} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md hover:bg-muted transition-colors">Annuler</button>
                            <button onClick={saveEdit} disabled={editSaving}
                              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 px-2 py-0.5 rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50">
                              {editSaving && <Loader2 size={10} className="animate-spin" />}Enregistrer
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit('building-info', { name: activeBuilding.name, floors: activeBuilding.floors, lotNumber: activeBuilding.lot_number ?? '', areaSqm: activeBuilding.area_sqm ?? '' })}
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground/40 hover:text-[#C18D52] transition-colors">
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>
                      {editSection === 'building-info' ? (
                        <div className="p-4 space-y-3">
                          <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Nom</span>
                            <input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                              className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Étages</span>
                              <input type="number" min={1} value={editForm.floors ?? ''} onChange={e => setEditForm(f => ({ ...f, floors: Number(e.target.value) }))}
                                className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Surface (m²)</span>
                              <input type="number" min={0} value={editForm.areaSqm ?? ''} onChange={e => setEditForm(f => ({ ...f, areaSqm: Number(e.target.value) }))}
                                className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </label>
                          </div>
                          <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Titre Foncier</span>
                            <input value={editForm.lotNumber ?? ''} onChange={e => setEditForm(f => ({ ...f, lotNumber: e.target.value }))}
                              className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </label>
                        </div>
                      ) : (
                        [
                          { label: 'Titre Foncier', value: activeBuilding.lot_number },
                          { label: 'Plan Number',   value: activeBuilding.property_plan_number },
                          { label: 'Créé le',       value: new Date(activeBuilding.created_at).toLocaleDateString('fr-FR') },
                          { label: 'Modifié le',    value: new Date(activeBuilding.updated_at).toLocaleDateString('fr-FR') },
                        ].filter(r => r.value != null && r.value !== '').map(r => (
                          <div key={r.label} className="flex items-center justify-between px-4 py-3">
                            <span className="text-xs text-muted-foreground">{r.label}</span>
                            <span className="text-xs font-semibold truncate max-w-[55%] text-right">{r.value}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Équipements section */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Équipements</p>
                          {editSection !== 'building-facilities' && (
                            <button onClick={() => startEdit('building-facilities', { facilities: [...(activeBuilding.facilities ?? [])] })}
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground/40 hover:text-[#C18D52] transition-colors">
                              <Pencil size={11} />
                            </button>
                          )}
                        </div>
                        {editSection === 'building-facilities' ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={cancelEdit} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md hover:bg-muted transition-colors">Annuler</button>
                            <button onClick={saveEdit} disabled={editSaving}
                              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 px-2 py-0.5 rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50">
                              {editSaving && <Loader2 size={10} className="animate-spin" />}Enregistrer
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {editSection === 'building-facilities' ? (
                        <div className="grid grid-cols-4 gap-2">
                          {FACILITIES.map(f => {
                            const active = (editForm.facilities ?? []).includes(f.key)
                            return (
                              <button key={f.key} type="button"
                                onClick={() => setEditForm(fm => ({ ...fm, facilities: active ? (fm.facilities ?? []).filter((k: string) => k !== f.key) : [...(fm.facilities ?? []), f.key] }))}
                                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-center
                                  ${active ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/30'}`}>
                                <f.icon size={14} strokeWidth={active ? 2.5 : 1.5} />
                                <span className="text-[9px] font-semibold leading-tight">{f.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      ) : (activeBuilding.facilities ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(activeBuilding.facilities ?? []).map(key => {
                            const f = FACILITIES.find(x => x.key === key)
                            if (!f) return null
                            return (
                              <span key={key} className="flex items-center gap-1.5 text-[11px] bg-[#5A8F76]/[0.12] text-[#5A8F76] px-2.5 py-1 rounded-lg font-medium border border-[#5A8F76]/25">
                                <f.icon size={11} strokeWidth={2} />
                                {f.label}
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40 italic">Aucun équipement</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT - apartments list (mock, shows empty for real building IDs) */}
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Apartments</p>
                      <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#5A8F76]/[0.15] text-[#5A8F76] text-[10px] font-bold flex items-center justify-center tabular-nums">
                        {aptsLoading ? '…' : buildingApts.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {aptsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 size={18} className="animate-spin text-muted-foreground/40" />
                      </div>
                    ) : buildingApts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/30">
                        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                          <Home size={26} strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">No apartments yet</p>
                          <p className="text-xs mt-0.5">Use "Ajouter apt." to add apartments</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {(() => {
                          const byFloor = new Map<number | null, ApiApartment[]>()
                          buildingApts.forEach(apt => {
                            const f = apt.floor ?? null
                            if (!byFloor.has(f)) byFloor.set(f, [])
                            byFloor.get(f)!.push(apt)
                          })
                          const sorted = [...byFloor.entries()].sort(([a], [b]) => {
                            if (a === null) return 1; if (b === null) return -1; return a - b
                          })
                          return sorted.map(([floor, apts]) => (
                            <div key={floor ?? 'no-floor'}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-5 w-5 rounded-md bg-muted border border-border/60 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{floor ?? '?'}</div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Floor {floor ?? '-'}</span>
                                <div className="flex-1 h-px bg-border/40" />
                                <span className="text-[10px] text-muted-foreground/40">{apts.length} unit{apts.length !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="space-y-1.5 pl-1">
                                {apts.map(apt => {
                                  const shareholders = apt.shareholders ?? []
                                  const statusColors = {
                                    OCCUPIED:    { bar: 'bg-[#5A8F76]', dot: 'bg-[#5A8F76]', ring: 'border-[#5A8F76]/20 hover:border-[#5A8F76]/50' },
                                    VACANT:      { bar: 'bg-[#9ABCAB]', dot: 'bg-[#9ABCAB]', ring: 'border-border/60 hover:border-[#9ABCAB]/60' },
                                    MAINTENANCE: { bar: 'bg-amber-400',  dot: 'bg-amber-400',  ring: 'border-amber-200 hover:border-amber-400' },
                                  }
                                  const sc = statusColors[apt.status]
                                  return (
                                    <button key={apt.id} onClick={() => setNav({ level: 'apartment', buildingId: activeBuilding.id, aptId: apt.id })}
                                      className={cn('w-full text-left rounded-xl border bg-card transition-all group overflow-hidden', sc.ring)}>
                                      <div className={cn('h-0.5 w-full', sc.bar)} />
                                      <div className="px-3.5 pt-3 pb-2.5">
                                        <div className="flex items-center justify-between mb-2.5">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-extrabold tracking-tight">{apt.unit_code}</span>
                                            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', sc.dot)} />
                                            <span className="text-[11px] font-medium text-muted-foreground">{aptStatus[apt.status].label}</span>
                                          </div>
                                          <span className={cn(aptStatus[apt.status].cls, 'text-[9px]')}>
                                            {apt.usage_type === 'RESIDENTIAL' ? 'Residential' : apt.usage_type === 'COMMERCIAL' ? 'Commercial' : 'Mixed'}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                                          <div className="flex flex-col bg-muted/40 rounded-lg px-2.5 py-2">
                                            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide leading-none mb-0.5">Area</span>
                                            <span className="text-xs font-bold text-foreground">{apt.area_sqm ? `${apt.area_sqm} m²` : '-'}</span>
                                          </div>
                                          <div className="flex flex-col bg-muted/40 rounded-lg px-2.5 py-2">
                                            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide leading-none mb-0.5">Floor</span>
                                            <span className="text-xs font-bold text-foreground">{apt.floor ?? '-'}</span>
                                          </div>
                                          <div className="flex flex-col bg-muted/40 rounded-lg px-2.5 py-2">
                                            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide leading-none mb-0.5">Share</span>
                                            <span className="text-xs font-bold text-foreground">{apt.quote_part != null ? `${apt.quote_part}‰` : '-'}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                          <span className="font-mono">{apt.lot_number ?? '-'}</span>
                                          {apt.quote_part_residence != null && (
                                            <span className="text-muted-foreground/60">Résidence {apt.quote_part_residence}‰</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between px-3.5 py-2 border-t border-border/40 bg-muted/20">
                                        {shareholders.length > 0 ? (
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <div className="flex -space-x-1.5 shrink-0">
                                              {shareholders.slice(0, 3).map((o, i) => (
                                                <img key={i}
                                                  src={shareholderAvatar(o)}
                                                  style={{ height: 20, width: 20 }}
                                                  className="rounded-full border-2 border-white object-cover" alt="" />
                                              ))}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground truncate">{shareholders.map(o => o.firstName).join(', ')}</span>
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground/40 italic">No owner assigned</span>
                                        )}
                                        <div className="flex items-center justify-center h-6 w-6 rounded-md bg-[#5A8F76]/[0.15] group-hover:bg-[#5A8F76] transition-colors shrink-0 ml-2">
                                          <ChevronRight size={12} className="text-[#5A8F76] group-hover:text-white transition-colors" />
                                        </div>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <StickyTickets
                buildings={buildings}
                currentBuildingId={activeBuilding.id}
                buildingApts={buildingApts}
                onSelectBuilding={id => setNav({ level: 'building', buildingId: id })}
                onSelectApt={() => {}}
              />
            </motion.div>
          )}

          {/* â”€â”€ APARTMENT DETAIL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {nav.level === 'apartment' && activeApt && (
            <motion.div key="apartment"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="flex-1 overflow-hidden flex flex-col relative"
            >
              <NavBar
                onBack={() => setNav({ level: 'building', buildingId: (nav as any).buildingId })}
                crumbs={[
                  { label: residence.name, onClick: () => setNav({ level: 'overview' }) },
                  { label: activeBuilding?.name ?? '…', onClick: () => setNav({ level: 'building', buildingId: (nav as any).buildingId }) },
                  { label: activeApt.unit_code },
                ]}
                onManage={() => { handleClose(); onManage(residence) }}
                onClose={handleClose}
              />

              <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-border">
                <div className="flex flex-col overflow-y-auto">
                  <div className="relative shrink-0 overflow-hidden bg-muted/30" style={{ height: 220 }}>
                    <img src={getFloorPlanImage(residence.id)} alt="Floor plan" className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <span className="text-white text-xs font-semibold drop-shadow">Floor plan · {activeApt.unit_code}</span>
                      <span className={cn(aptStatus[activeApt.status].cls, 'text-[9px]')}>
                        {aptStatus[activeApt.status].label}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-[#203B37]/[0.12] flex items-center justify-center text-sm font-extrabold text-[#203B37] shrink-0">
                        {activeApt.floor ?? '-'}
                      </div>
                      <div>
                        <span className="text-base font-extrabold">{activeApt.unit_code}</span>
                        <p className="text-xs text-muted-foreground">{activeBuilding?.name} · {residence.name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Floor',  value: activeApt.floor ?? '-',                          color: 'text-[#C18D52]' },
                        { label: 'Area',   value: activeApt.area_sqm ? `${activeApt.area_sqm}m²` : '-', color: 'text-[#8F5C64]' },
                        { label: 'Usage',  value: activeApt.usage_type === 'RESIDENTIAL' ? 'Res.' : activeApt.usage_type === 'COMMERCIAL' ? 'Com.' : 'Mix', color: 'text-[#5A8F76]' },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center py-3 rounded-xl bg-muted/40">
                          <span className={`text-lg font-extrabold tabular-nums leading-none ${s.color}`}>{s.value}</span>
                          <span className={`text-[10px] font-medium mt-1 ${s.color} opacity-70`}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-border/60 divide-y divide-border/50">
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Détails</p>
                        {editSection === 'apt-info' ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={cancelEdit} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md hover:bg-muted transition-colors">Annuler</button>
                            <button onClick={saveEdit} disabled={editSaving}
                              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 px-2 py-0.5 rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50">
                              {editSaving && <Loader2 size={10} className="animate-spin" />}Enregistrer
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit('apt-info', { lotNumber: activeApt.lot_number ?? '', floor: activeApt.floor ?? 0, areaSqm: activeApt.area_sqm ?? '', quotePart: activeApt.quote_part ?? '', quotePartResidence: activeApt.quote_part_residence ?? '' })}
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground/40 hover:text-[#C18D52] transition-colors">
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>
                      {editSection === 'apt-info' ? (
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Étage</span>
                              <input type="number" min={0} value={editForm.floor ?? ''} onChange={e => setEditForm(f => ({ ...f, floor: Number(e.target.value) }))}
                                className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Surface (m²)</span>
                              <input type="number" min={0} value={editForm.areaSqm ?? ''} onChange={e => setEditForm(f => ({ ...f, areaSqm: Number(e.target.value) }))}
                                className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </label>
                          </div>
                          <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">N° de lot</span>
                            <input value={editForm.lotNumber ?? ''} onChange={e => setEditForm(f => ({ ...f, lotNumber: e.target.value }))}
                              className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Quote-part bât. (‰)</span>
                              <input type="number" min={0} value={editForm.quotePart ?? ''} onChange={e => setEditForm(f => ({ ...f, quotePart: Number(e.target.value) }))}
                                className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Quote-part rés. (‰)</span>
                              <input type="number" min={0} value={editForm.quotePartResidence ?? ''} onChange={e => setEditForm(f => ({ ...f, quotePartResidence: Number(e.target.value) }))}
                                className="h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </label>
                          </div>
                        </div>
                      ) : (
                        [
                          { label: 'N° de lot',    value: activeApt.lot_number },
                          { label: 'Quote-part bât.', value: activeApt.quote_part           != null ? `${activeApt.quote_part}‰`           : undefined },
                          { label: 'Quote-part rés.', value: activeApt.quote_part_residence  != null ? `${activeApt.quote_part_residence}‰`  : undefined },
                          { label: 'Créé le',      value: new Date(activeApt.created_at).toLocaleDateString('fr-FR') },
                        ].filter(r => r.value != null).map(r => (
                          <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-xs text-muted-foreground">{r.label}</span>
                            <span className="text-xs font-semibold font-mono">{r.value}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col overflow-hidden">
                  {/* ── header ── */}
                  <div className="px-5 py-3 border-b shrink-0 bg-muted/20 flex items-center justify-between">
                    {selectedOwnerIdx !== null ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedOwnerIdx(null); setOwnerEditMode(false); setOwnerForm(null) }}
                          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <ChevronLeft size={15} />
                        </button>
                        <p className="text-xs font-bold text-muted-foreground">
                          {ownerEditMode ? 'Modifier' : 'Fiche propriétaire'}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-[#5A8F76]/[0.15] flex items-center justify-center shrink-0">
                          <Home size={13} className="text-[#5A8F76]" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold leading-none">{activeApt.unit_code}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Apartment · {activeBuilding?.name}</p>
                        </div>
                      </div>
                    )}
                    {selectedOwnerIdx !== null ? (
                      ownerEditMode ? (
                        <button onClick={() => { setOwnerEditMode(false); setOwnerForm(null) }}
                          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted">
                          Annuler
                        </button>
                      ) : (
                        <button onClick={() => { setOwnerForm({ ...aptShareholders[selectedOwnerIdx] }); setOwnerEditMode(true) }}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-[#C18D52] transition-colors">
                          <Pencil size={13} />
                        </button>
                      )
                    ) : (
                      <span className={cn(aptStatus[activeApt.status].cls, 'text-[10px]')}>
                        {aptStatus[activeApt.status].label}
                      </span>
                    )}
                  </div>

                  {/* ── owners list OR owner detail ── */}
                  {selectedOwnerIdx === null ? (
                    <>
                      <div className="flex items-center gap-2 px-5 py-2.5 border-b shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Copropriétaires</p>
                        <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#8F5C64]/[0.15] text-[#8F5C64] text-[10px] font-bold flex items-center justify-center">
                          {aptShareholders.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {aptShareholders.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2.5 py-14 text-muted-foreground/40">
                            <Users size={28} strokeWidth={1.3} />
                            <p className="text-sm font-semibold">Aucun propriétaire</p>
                          </div>
                        ) : aptShareholders.map((o, i) => (
                          <button key={i} onClick={() => { setSelectedOwnerIdx(i); setOwnerEditMode(false); setOwnerForm(null) }}
                            className="w-full rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left overflow-hidden group">
                            <div className="flex items-center gap-3 p-4">
                              <img src={shareholderAvatar(o)} className="h-12 w-12 rounded-full border-2 border-white object-cover shrink-0 shadow-sm" alt="" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm font-bold">{o.firstName} {o.lastName}</span>
                                  {o.isPrimary && <Badge variant="info" className="text-[9px] px-1.5 py-0 shrink-0">Principal</Badge>}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{o.email ?? 'Aucun email'}</p>
                              </div>
                              <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-[#C18D52] transition-colors shrink-0" />
                            </div>
                            {activeApt.quote_part != null && (
                              <div className="border-t border-border/40 flex items-center gap-2.5 px-4 py-2.5">
                                <Hash size={11} className="text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground">{activeApt.quote_part}‰ quote-part bâtiment</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (() => {
                    const o    = ownerEditMode && ownerForm ? ownerForm : aptShareholders[selectedOwnerIdx]
                    const fset = (k: keyof ApiShareholder, v: any) => setOwnerForm(prev => ({ ...prev!, [k]: v }))
                    const save = async () => {
                      if (!ownerForm) return
                      setOwnerSaving(true)
                      try {
                        const updated = aptShareholders.map((s, idx) => {
                          if (idx === selectedOwnerIdx) return { ...ownerForm, email: ownerForm.email || null }
                          return ownerForm.isPrimary ? { ...s, isPrimary: false } : s
                        })
                        const res = await fetch(`/api/apartments/${activeApt.id}/shareholders`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ shareholders: updated }),
                        })
                        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Erreur')
                        setOwnerEditMode(false); setOwnerForm(null)
                        modalQueryClient.invalidateQueries({ queryKey: ['building-apartments', activeBuildingId] })
                      } catch (e: any) {
                        alert(e.message)
                      } finally { setOwnerSaving(false) }
                    }
                    return (
                      <div className="flex-1 overflow-y-auto">
                        {/* avatar + name hero */}
                        <div className="flex flex-col items-center gap-3 pt-7 pb-5 px-6 border-b border-border/50">
                          <img src={shareholderAvatar(aptShareholders[selectedOwnerIdx])} alt=""
                            className="h-20 w-20 rounded-2xl object-cover bg-muted shadow-md ring-4 ring-white" />
                          <div className="text-center">
                            <p className="text-base font-extrabold">{aptShareholders[selectedOwnerIdx].firstName} {aptShareholders[selectedOwnerIdx].lastName}</p>
                            <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                              {aptShareholders[selectedOwnerIdx].isPrimary && (
                                <Badge variant="info" className="text-[10px] px-2 py-0.5">★ Représentant</Badge>
                              )}
                              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold
                                ${(aptShareholders[selectedOwnerIdx].gender ?? 'MALE') === 'FEMALE'
                                  ? 'border-pink-300 text-pink-600 bg-pink-50'
                                  : 'border-blue-300 text-blue-600 bg-blue-50'}`}>
                                {(aptShareholders[selectedOwnerIdx].gender ?? 'MALE') === 'FEMALE' ? '♀ Femme' : '♂ Homme'}
                              </span>
                            </div>
                          </div>
                          {/* sibling switcher */}
                          {aptShareholders.length > 1 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {aptShareholders.map((s, idx) => (
                                <button key={idx} onClick={() => { setSelectedOwnerIdx(idx); setOwnerEditMode(false); setOwnerForm(null) }}
                                  className={`h-7 w-7 rounded-full overflow-hidden border-2 transition-all
                                    ${idx === selectedOwnerIdx ? 'border-primary scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                                  <img src={shareholderAvatar(s)} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {ownerEditMode && ownerForm ? (
                          <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Prénom</span>
                                <input value={ownerForm.firstName} onChange={e => fset('firstName', e.target.value)}
                                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                              </label>
                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Nom</span>
                                <input value={ownerForm.lastName} onChange={e => fset('lastName', e.target.value)}
                                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                              </label>
                            </div>
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">Email</span>
                              <input type="email" value={ownerForm.email ?? ''} onChange={e => fset('email', e.target.value)}
                                className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </label>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-1.5">Genre</p>
                              <div className="flex gap-2">
                                {(['MALE', 'FEMALE'] as const).map(g => (
                                  <button key={g} type="button" onClick={() => fset('gender', g)}
                                    className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all
                                      ${ownerForm.gender === g
                                        ? g === 'MALE' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-pink-400 bg-pink-50 text-pink-700'
                                        : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}>
                                    {g === 'MALE' ? '♂ Homme' : '♀ Femme'}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide w-28 shrink-0">Représentant :</span>
                              <button type="button" onClick={() => fset('isPrimary', !ownerForm.isPrimary)} className="flex items-center gap-1.5 group">
                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                                  ${ownerForm.isPrimary ? 'border-primary bg-primary' : 'border-muted-foreground/30 group-hover:border-primary/50'}`}>
                                  {ownerForm.isPrimary && <span className="text-white text-[8px] font-bold">✓</span>}
                                </span>
                                <span className={`text-xs font-semibold transition-colors ${ownerForm.isPrimary ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-muted-foreground'}`}>
                                  {ownerForm.isPrimary ? 'Principal' : 'Définir comme principal'}
                                </span>
                              </button>
                            </div>
                            <button onClick={save} disabled={ownerSaving}
                              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors">
                              {ownerSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                              Enregistrer
                            </button>
                          </div>
                        ) : (
                          <div className="p-5 space-y-4">
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide mb-1">Email</p>
                              <p className="text-sm text-foreground">{o.email || <span className="text-muted-foreground/40 italic text-xs">Aucun email</span>}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide mb-1">Initiales</p>
                              <div className="h-9 w-9 rounded-xl bg-[#8F5C64]/[0.15] flex items-center justify-center">
                                <span className="text-xs font-bold text-[#8F5C64]">{getInitials(`${o.firstName} ${o.lastName}`)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>

              <StickyTickets
                buildings={buildings}
                currentBuildingId={(nav as any).buildingId}
                buildingApts={buildingApts}
                currentAptId={activeApt.id}
                onSelectBuilding={id => setNav({ level: 'building', buildingId: id })}
                onSelectApt={id => setNav({ level: 'apartment', buildingId: (nav as any).buildingId, aptId: id })}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>

  )
}

/* â”€â”€ types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type View = 'residences' | 'buildings' | 'apartments'

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function Association() {
  const queryClient = useQueryClient()
  const [view, setView]                         = useState<View>('residences')
  const [selectedResidence, setSelectedResidence] = useState<ApiResidence | null>(null)
  const [selectedBuilding,  setSelectedBuilding]  = useState<ApiBuilding  | null>(null)
  const [expandedApt,       setExpandedApt]       = useState<string | null>(null)
  const [modalResidence,    setModalResidence]    = useState<ApiResidence | null>(null)
  const [modalInitialNav, setModalInitialNav] = useState<ModalNav | undefined>(undefined)

  // â”€â”€ Pagination state â”€â”€
  const [items,        setItems]        = useState<ApiResidence[]>([])
  const [totalCount,   setTotalCount]   = useState(0)
  const [currentPage,  setCurrentPage]  = useState(1)
  const [firstLoading, setFirstLoading] = useState(true)
  const [moreLoading,  setMoreLoading]  = useState(false)
  const hasMore = items.length < totalCount

  const loadPage = useCallback(async (page: number) => {
    if (page === 1) setFirstLoading(true); else setMoreLoading(true)
    try {
      const r   = await fetch(`/api/residences?page=${page}&limit=${PAGE_SIZE}`)
      const json = await r.json()
      setItems(prev => page === 1 ? json.data : [...prev, ...json.data])
      setTotalCount(json.total)
      setCurrentPage(page)
    } finally {
      if (page === 1) setFirstLoading(false); else setMoreLoading(false)
    }
  }, [])

  useEffect(() => { loadPage(1) }, [loadPage])

  const refresh = () => loadPage(1)

  // â”€â”€ Buildings for selected residence (lazy) â”€â”€
  const { data: selectedBuildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['residence-buildings', selectedResidence?.id],
    queryFn: () => fetch(`/api/residences/${selectedResidence!.id}/buildings`).then(r => r.json()) as Promise<ApiBuilding[]>,
    enabled: !!selectedResidence,
    staleTime: 60_000,
  })

  const { data: selectedBuildingApts = [], isLoading: buildingAptsLoading } = useQuery({
    queryKey: ['building-apartments', selectedBuilding?.id],
    queryFn: () => fetch(`/api/buildings/${selectedBuilding!.id}/apartments`).then(r => r.json()) as Promise<ApiApartment[]>,
    enabled: view === 'apartments' && !!selectedBuilding,
    staleTime: 60_000,
  })

  // ── Filter state ──
  type Filters = {
    // residences
    resSearch: string; resStatus: string[]; resCity: string
    resFacilities: string[]; resMinBuildings: string; resMinApts: string
    // buildings
    bldSearch: string; bldMinFloors: string; bldMaxFloors: string
    bldFacilities: string[]; bldMinApts: string
    // apartments
    aptOwner: string; aptStatus: string[]; aptFloor: string
    aptUsage: string; aptMinArea: string; aptMaxArea: string
  }
  const EMPTY_FILTERS: Filters = {
    resSearch: '', resStatus: [], resCity: '',
    resFacilities: [], resMinBuildings: '', resMinApts: '',
    bldSearch: '', bldMinFloors: '', bldMaxFloors: '',
    bldFacilities: [], bldMinApts: '',
    aptOwner: '', aptStatus: [], aptFloor: '',
    aptUsage: '', aptMinArea: '', aptMaxArea: '',
  }
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const setF = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters(f => ({ ...f, [k]: v }))
  const toggleStatus  = (key: 'resStatus' | 'aptStatus', val: string) =>
    setFilters(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(s => s !== val) : [...f[key], val] }))
  const toggleFacility = (key: 'resFacilities' | 'bldFacilities', val: string) =>
    setFilters(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(s => s !== val) : [...f[key], val] }))

  // TopBar search binding per view
  const topBarSearch = view === 'residences' ? filters.resSearch : view === 'buildings' ? filters.bldSearch : filters.aptOwner
  const topBarPlaceholder = view === 'residences' ? 'Rechercher une résidence…' : view === 'buildings' ? 'Rechercher un bâtiment…' : 'Rechercher un propriétaire…'
  const onTopBarSearch = (v: string) => view === 'residences' ? setF('resSearch', v) : view === 'buildings' ? setF('bldSearch', v) : setF('aptOwner', v)

  // Per-category chip color palette
  const CHIP_CLASSES: Record<string, string> = {
    '#33091B': 'bg-[#33091B]/[0.12] text-[#33091B] border-[#33091B]/30',
    '#D97172': 'bg-[#D97172]/[0.12] text-[#D97172] border-[#D97172]/30',
    '#8F5C64': 'bg-[#8F5C64]/[0.12] text-[#8F5C64] border-[#8F5C64]/30',
    '#C18D52': 'bg-[#C18D52]/[0.12] text-[#C18D52] border-[#C18D52]/30',
    '#203B37': 'bg-[#203B37]/[0.12] text-[#203B37] border-[#203B37]/30',
  }

  // Active chips — computed per view
  const activeChips: { label: string; remove: () => void; color: string }[] = []
  if (view === 'residences') {
    if (filters.resSearch) activeChips.push({ label: `”${filters.resSearch}”`, remove: () => setF('resSearch', ''), color: '#33091B' })
    if (filters.resCity) activeChips.push({ label: `Ville: ${filters.resCity}`, remove: () => setF('resCity', ''), color: '#C18D52' })
    filters.resStatus.forEach(s => {
      const map: Record<string,string> = { ACTIVE: 'Actif', MAINTENANCE: 'Travaux', INACTIVE: 'Inactif' }
      activeChips.push({ label: `Statut: ${map[s] ?? s}`, remove: () => toggleStatus('resStatus', s), color: '#D97172' })
    })
    filters.resFacilities.forEach(f => {
      const fac = FACILITIES.find(x => x.key === f)
      activeChips.push({ label: fac?.label ?? f, remove: () => toggleFacility('resFacilities', f), color: '#8F5C64' })
    })
    if (filters.resMinBuildings) activeChips.push({ label: `≥${filters.resMinBuildings} bâtiments`, remove: () => setF('resMinBuildings', ''), color: '#203B37' })
    if (filters.resMinApts) activeChips.push({ label: `≥${filters.resMinApts} appts`, remove: () => setF('resMinApts', ''), color: '#203B37' })
  } else if (view === 'buildings') {
    if (filters.bldSearch) activeChips.push({ label: `”${filters.bldSearch}”`, remove: () => setF('bldSearch', ''), color: '#33091B' })
    if (filters.bldMinFloors) activeChips.push({ label: `≥${filters.bldMinFloors} étages`, remove: () => setF('bldMinFloors', ''), color: '#203B37' })
    if (filters.bldMaxFloors) activeChips.push({ label: `≤${filters.bldMaxFloors} étages`, remove: () => setF('bldMaxFloors', ''), color: '#203B37' })
    filters.bldFacilities.forEach(f => {
      const fac = FACILITIES.find(x => x.key === f)
      activeChips.push({ label: fac?.label ?? f, remove: () => toggleFacility('bldFacilities', f), color: '#8F5C64' })
    })
    if (filters.bldMinApts) activeChips.push({ label: `≥${filters.bldMinApts} appts`, remove: () => setF('bldMinApts', ''), color: '#203B37' })
  } else if (view === 'apartments') {
    if (filters.aptOwner) activeChips.push({ label: `”${filters.aptOwner}”`, remove: () => setF('aptOwner', ''), color: '#33091B' })
    if (filters.aptFloor) activeChips.push({ label: `Étage ${filters.aptFloor}`, remove: () => setF('aptFloor', ''), color: '#203B37' })
    if (filters.aptUsage) activeChips.push({ label: filters.aptUsage === 'RESIDENTIAL' ? 'Résidentiel' : filters.aptUsage === 'COMMERCIAL' ? 'Commercial' : 'Mixte', remove: () => setF('aptUsage', ''), color: '#D97172' })
    if (filters.aptMinArea) activeChips.push({ label: `≥${filters.aptMinArea}m²`, remove: () => setF('aptMinArea', ''), color: '#203B37' })
    if (filters.aptMaxArea) activeChips.push({ label: `≤${filters.aptMaxArea}m²`, remove: () => setF('aptMaxArea', ''), color: '#203B37' })
    filters.aptStatus.forEach(s => {
      const map: Record<string,string> = { VACANT: 'Vacant', OCCUPIED: 'Occupé', MAINTENANCE: 'Travaux' }
      activeChips.push({ label: map[s] ?? s, remove: () => toggleStatus('aptStatus', s), color: '#D97172' })
    })
  }

  // Derived filtered lists
  const filteredItems = items.filter(r => {
    if (filters.resSearch) {
      const q = filters.resSearch.toLowerCase()
      if (!r.name.toLowerCase().includes(q) && !(r.city ?? r.address)?.toLowerCase().includes(q)) return false
    }
    if (filters.resStatus.length && !filters.resStatus.includes(r.status)) return false
    if (filters.resCity) {
      if (!(r.city ?? '').toLowerCase().includes(filters.resCity.toLowerCase())) return false
    }
    if (filters.resFacilities.length) {
      const facList: string[] = Array.isArray(r.facilities) ? r.facilities : []
      if (!filters.resFacilities.every(f => facList.includes(f))) return false
    }
    if (filters.resMinBuildings && r.building_count < Number(filters.resMinBuildings)) return false
    if (filters.resMinApts && r.apartment_count < Number(filters.resMinApts)) return false
    return true
  })
  const filteredBuildings = selectedBuildings.filter(b => {
    if (filters.bldSearch && !b.name.toLowerCase().includes(filters.bldSearch.toLowerCase())) return false
    if (filters.bldMinFloors && b.floors < Number(filters.bldMinFloors)) return false
    if (filters.bldMaxFloors && b.floors > Number(filters.bldMaxFloors)) return false
    if (filters.bldFacilities.length) {
      const facList: string[] = Array.isArray(b.facilities) ? b.facilities : []
      if (!filters.bldFacilities.every(f => facList.includes(f))) return false
    }
    if (filters.bldMinApts && b.apartment_count < Number(filters.bldMinApts)) return false
    return true
  })
  const filteredApts = selectedBuildingApts.filter(a => {
    if (filters.aptStatus.length && !filters.aptStatus.includes(a.status)) return false
    if (filters.aptFloor !== '' && a.floor !== Number(filters.aptFloor)) return false
    if (filters.aptUsage && a.usage_type !== filters.aptUsage) return false
    if (filters.aptMinArea && (a.area_sqm ?? 0) < Number(filters.aptMinArea)) return false
    if (filters.aptMaxArea && (a.area_sqm ?? Infinity) > Number(filters.aptMaxArea)) return false
    if (filters.aptOwner) {
      const q = filters.aptOwner.toLowerCase()
      const sh: ApiShareholder[] = Array.isArray(a.shareholders) ? a.shareholders : []
      if (!sh.some(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q))) return false
    }
    return true
  })

  /* â”€â”€ navigation helpers â”€â”€ */
  const drillToBuildings  = (r: ApiResidence) => { setSelectedResidence(r); setSelectedBuilding(null); setView('buildings') }
  const openModal         = (r: ApiResidence, nav?: ModalNav) => { setModalInitialNav(nav); setModalResidence(r) }
  const closeModal        = () => { setModalResidence(null); setModalInitialNav(undefined) }
  const drillToApartments = (b: ApiBuilding) => {
    setSelectedBuilding(b)
    setExpandedApt(null)
    setView('apartments')
  }
  const goBack = () => {
    if (view === 'apartments') { setView('buildings'); setSelectedBuilding(null); setExpandedApt(null) }
    else if (view === 'buildings') { setView('residences'); setSelectedResidence(null) }
  }

  /* â”€â”€ breadcrumb â”€â”€ */
  const Breadcrumb = () => (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <button onClick={() => { setView('residences'); setSelectedResidence(null); setSelectedBuilding(null) }}
        className={cn('hover:text-[#C18D52] transition-colors', view === 'residences' && 'text-foreground font-medium pointer-events-none')}>
        Owners' Association
      </button>
      {selectedResidence && (
        <>
          <ChevronRight size={12} />
          <button onClick={() => { setView('buildings'); setSelectedBuilding(null) }}
            className={cn('hover:text-[#C18D52] transition-colors', view === 'buildings' && 'text-foreground font-medium pointer-events-none')}>
            {selectedResidence.name}
          </button>
        </>
      )}
      {selectedBuilding && (
        <>
          <ChevronRight size={12} />
          <span className="text-foreground font-medium">{selectedBuilding.name}</span>
        </>
      )}
    </div>
  )

  /* â”€â”€ header subtitle â”€â”€ */
  const totalUnits    = items.reduce((s, r) => s + r.apartment_count, 0)
  const totalOccupied = items.reduce((s, r) => s + r.occupied_count,  0)
  const dot = <span className="text-muted-foreground/30 text-xs mx-0.5">·</span>

  const HeaderSubtitle = () => {
    if (view === 'residences') return (
      <div className="flex items-center flex-row gap-1 mt-0.5">
        <StatItem value={totalCount}                 label="Residences" color="text-[#C18D52]" />
        {dot}
        <StatItem value={totalUnits}                 label="Units"      color="text-[#33091B]" />
        {dot}
        <StatItem value={totalOccupied}              label="Occupied"   color="text-[#D97172]" />
        {dot}
        <StatItem value={totalUnits - totalOccupied} label="Vacant"     color="text-[#9ABCAB]" />
      </div>
    )
    if (view === 'buildings' && selectedResidence) return (
      <div className="flex items-center flex-row gap-1 mt-0.5">
        <StatItem value={selectedResidence.building_count}  label={selectedResidence.building_count === 1 ? 'Building' : 'Buildings'} color="text-[#33091B]" />
        {dot}
        <StatItem value={selectedResidence.apartment_count} label="Units"    color="text-[#203B37]" />
        {dot}
        <StatItem value={selectedResidence.occupied_count}  label="Occupied" color="text-[#D97172]" />
        {dot}
        <span className="text-xs text-muted-foreground">{selectedResidence.name}</span>
      </div>
    )
    if (view === 'apartments' && selectedBuilding) {
      return (
        <div className="flex items-center flex-row gap-1 mt-0.5">
          <StatItem value={selectedBuilding.apartment_count} label="Apartments" color="text-[#203B37]" />
          {dot}
          <StatItem value={selectedBuilding.occupied_count}  label="Occupied"   color="text-[#D97172]" />
          {dot}
          <span className="text-xs text-muted-foreground">{selectedBuilding.name}</span>
        </div>
      )
    }
    return null
  }

  const menuLabel = view === 'residences' ? 'Ajouter résidence'
                  : view === 'buildings'  ? 'Ajouter bâtiment'
                  : 'Ajouter appartement'

  const addButton = view === 'residences' ? (
    <AddResidenceModal onSuccess={refresh}>
      <Button size="sm" className="gap-1.5 text-xs"><Plus size={13} />{menuLabel}</Button>
    </AddResidenceModal>
  ) : view === 'buildings' && selectedResidence ? (
    <AddResidenceModal startStep={2} lockedResidence={selectedResidence} onSuccess={refresh}>
      <Button size="sm" className="gap-1.5 text-xs"><Plus size={13} />{menuLabel}</Button>
    </AddResidenceModal>
  ) : view === 'apartments' && selectedBuilding && selectedResidence ? (
    <AddResidenceModal startStep={3} lockedResidence={selectedResidence} lockedBuilding={selectedBuilding} onSuccess={refresh}>
      <Button size="sm" className="gap-1.5 text-xs"><Plus size={13} />{menuLabel}</Button>
    </AddResidenceModal>
  ) : (
    <Button size="sm" className="gap-1.5 text-xs"><Plus size={13} />{menuLabel}</Button>
  )

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Owners' Association"
        subtitle={<HeaderSubtitle />}
        searchValue={topBarSearch}
        onSearchChange={onTopBarSearch}
        searchPlaceholder={topBarPlaceholder}
        searchTextColor="#33091B"
        actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setFilterOpen(v => !v)}
              className={cn(
                'relative flex items-center justify-center h-8 w-8 rounded-lg border transition-all',
                filterOpen || activeChips.length > 0
                  ? 'border-[#C18D52] bg-[#C18D52] text-white'
                  : 'border-[#C18D52]/30 bg-[#C18D52]/[0.06] text-[#C18D52] hover:bg-[#C18D52]/[0.14] hover:border-[#C18D52]/60'
              )}>
              <SlidersHorizontal size={14} />
              {activeChips.length > 0 && !filterOpen && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C18D52] text-[9px] font-bold text-white">
                  {activeChips.length}
                </span>
              )}
            </button>

            {/* Filter dropdown — anchored below the icon button */}
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border bg-white shadow-2xl overflow-hidden flex flex-col"
                  style={{ maxHeight: 'calc(100vh - 100px)' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal size={13} className="text-[#C18D52]" />
                        <span className="text-sm font-bold">Filtres</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 font-medium mt-0.5 ml-5">
                        {view === 'residences' ? 'Résidences' : view === 'buildings' ? (selectedResidence?.name ?? 'Bâtiments') : (selectedBuilding?.name ?? 'Appartements')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setFilters(EMPTY_FILTERS)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-[#C18D52] transition-colors px-1.5 py-1 rounded-md hover:bg-muted">
                        <RotateCcw size={10} />Réinitialiser
                      </button>
                      <button onClick={() => setFilterOpen(false)}
                        className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 p-4 space-y-5">

                    {/* ── RESIDENCES ── */}
                    {view === 'residences' && (<>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#D97172]/60 mb-2">Statut</p>
                        <div className="flex gap-2">
                          {([['ACTIVE','Actif','bg-[#5A8F76]'],['MAINTENANCE','Travaux','bg-amber-400'],['INACTIVE','Inactif','bg-slate-400']] as const).map(([val, label, dot]) => (
                            <button key={val} onClick={() => toggleStatus('resStatus', val)}
                              className={cn('flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all',
                                filters.resStatus.includes(val)
                                  ? 'border-[#D97172] bg-[#D97172]/[0.10] text-[#D97172]'
                                  : 'border-[#D97172]/30 text-[#D97172]/60 hover:border-[#D97172]/60 hover:text-[#D97172]')}>
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />{label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#C18D52]/60 mb-2">Ville</p>
                        <input value={filters.resCity} onChange={e => setF('resCity', e.target.value)}
                          placeholder="ex. Casablanca"
                          className="w-full h-8 rounded-lg border border-[#C18D52]/35 bg-background px-3 text-xs text-[#C18D52] focus:outline-none focus:ring-2 focus:ring-[#C18D52]/30 placeholder:text-[#C18D52]/30" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8F5C64]/60 mb-2">Équipements requis</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {FACILITIES.map(({ key, label, icon: Icon }) => (
                            <button key={key} onClick={() => toggleFacility('resFacilities', key)}
                              className={cn('flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all',
                                filters.resFacilities.includes(key)
                                  ? 'border-[#8F5C64] bg-[#8F5C64]/[0.10] text-[#8F5C64]'
                                  : 'border-[#8F5C64]/30 text-[#8F5C64]/60 hover:border-[#8F5C64]/60 hover:text-[#8F5C64]')}>
                              <Icon size={11} />{label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#203B37]/60 mb-2">Min bâtiments</p>
                          <input type="number" min={1} value={filters.resMinBuildings} onChange={e => setF('resMinBuildings', e.target.value)}
                            placeholder="ex. 2"
                            className="w-full h-8 rounded-lg border border-[#203B37]/35 bg-background px-3 text-xs text-[#203B37] focus:outline-none focus:ring-2 focus:ring-[#203B37]/30 placeholder:text-[#203B37]/30" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#203B37]/60 mb-2">Min appartements</p>
                          <input type="number" min={1} value={filters.resMinApts} onChange={e => setF('resMinApts', e.target.value)}
                            placeholder="ex. 10"
                            className="w-full h-8 rounded-lg border border-[#203B37]/35 bg-background px-3 text-xs text-[#203B37] focus:outline-none focus:ring-2 focus:ring-[#203B37]/30 placeholder:text-[#203B37]/30" />
                        </div>
                      </div>
                    </>)}

                    {/* ── BUILDINGS ── */}
                    {view === 'buildings' && (<>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#203B37]/60 mb-2">Nombre d'étages</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#203B37]/40 font-bold">MIN</span>
                            <input type="number" min={1} value={filters.bldMinFloors} onChange={e => setF('bldMinFloors', e.target.value)}
                              placeholder="1"
                              className="w-full h-8 rounded-lg border border-[#203B37]/35 bg-background pl-9 pr-2 text-xs text-[#203B37] focus:outline-none focus:ring-2 focus:ring-[#203B37]/30 placeholder:text-[#203B37]/30" />
                          </div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#203B37]/40 font-bold">MAX</span>
                            <input type="number" min={1} value={filters.bldMaxFloors} onChange={e => setF('bldMaxFloors', e.target.value)}
                              placeholder="∞"
                              className="w-full h-8 rounded-lg border border-[#203B37]/35 bg-background pl-9 pr-2 text-xs text-[#203B37] focus:outline-none focus:ring-2 focus:ring-[#203B37]/30 placeholder:text-[#203B37]/30" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8F5C64]/60 mb-2">Équipements requis</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {FACILITIES.map(({ key, label, icon: Icon }) => (
                            <button key={key} onClick={() => toggleFacility('bldFacilities', key)}
                              className={cn('flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all',
                                filters.bldFacilities.includes(key)
                                  ? 'border-[#8F5C64] bg-[#8F5C64]/[0.10] text-[#8F5C64]'
                                  : 'border-[#8F5C64]/30 text-[#8F5C64]/60 hover:border-[#8F5C64]/60 hover:text-[#8F5C64]')}>
                              <Icon size={11} />{label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#203B37]/60 mb-2">Min appartements</p>
                        <input type="number" min={1} value={filters.bldMinApts} onChange={e => setF('bldMinApts', e.target.value)}
                          placeholder="ex. 5"
                          className="w-full h-8 rounded-lg border border-[#203B37]/35 bg-background px-3 text-xs text-[#203B37] focus:outline-none focus:ring-2 focus:ring-[#203B37]/30 placeholder:text-[#203B37]/30" />
                      </div>
                    </>)}

                    {/* ── APARTMENTS ── */}
                    {view === 'apartments' && (<>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#D97172]/60 mb-2">Statut</p>
                        <div className="flex gap-2">
                          {([['VACANT','Vacant','bg-[#9ABCAB]'],['OCCUPIED','Occupé','bg-[#5A8F76]'],['MAINTENANCE','Travaux','bg-amber-400']] as const).map(([val, label, dot]) => (
                            <button key={val} onClick={() => toggleStatus('aptStatus', val)}
                              className={cn('flex-1 flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-all',
                                filters.aptStatus.includes(val)
                                  ? 'border-[#D97172] bg-[#D97172]/[0.10] text-[#D97172]'
                                  : 'border-[#D97172]/30 text-[#D97172]/60 hover:border-[#D97172]/60 hover:text-[#D97172]')}>
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />{label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#203B37]/60 mb-2">Étage</p>
                          <input type="number" min={0} value={filters.aptFloor} onChange={e => setF('aptFloor', e.target.value)}
                            placeholder="ex. 2"
                            className="w-full h-8 rounded-lg border border-[#203B37]/35 bg-background px-3 text-xs text-[#203B37] focus:outline-none focus:ring-2 focus:ring-[#203B37]/30 placeholder:text-[#203B37]/30" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#D97172]/60 mb-2">Usage</p>
                          <select value={filters.aptUsage} onChange={e => setF('aptUsage', e.target.value)}
                            className="w-full h-8 rounded-lg border border-[#D97172]/35 bg-background px-2 text-xs text-[#D97172]/70 focus:outline-none focus:ring-2 focus:ring-[#D97172]/30">
                            <option value="">Tous</option>
                            <option value="RESIDENTIAL">Résidentiel</option>
                            <option value="COMMERCIAL">Commercial</option>
                            <option value="MIXED">Mixte</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#203B37]/60 mb-2">Surface (m²)</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#203B37]/40 font-bold">MIN</span>
                            <input type="number" min={0} value={filters.aptMinArea} onChange={e => setF('aptMinArea', e.target.value)}
                              placeholder="0"
                              className="w-full h-8 rounded-lg border border-[#203B37]/35 bg-background pl-9 pr-2 text-xs text-[#203B37] focus:outline-none focus:ring-2 focus:ring-[#203B37]/30 placeholder:text-[#203B37]/30" />
                          </div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#203B37]/40 font-bold">MAX</span>
                            <input type="number" min={0} value={filters.aptMaxArea} onChange={e => setF('aptMaxArea', e.target.value)}
                              placeholder="∞"
                              className="w-full h-8 rounded-lg border border-[#203B37]/35 bg-background pl-9 pr-2 text-xs text-[#203B37] focus:outline-none focus:ring-2 focus:ring-[#203B37]/30 placeholder:text-[#203B37]/30" />
                          </div>
                        </div>
                      </div>
                    </>)}
                  </div>

                  <div className="px-4 py-3 border-t shrink-0">
                    <button onClick={() => setFilterOpen(false)}
                      className="w-full py-2 rounded-xl bg-[#203B37] text-white text-xs font-semibold hover:bg-[#203B37]/85 transition-colors">
                      Appliquer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          {addButton}
        </div>
      } />

      <ResidenceModal
        residence={modalResidence}
        open={modalResidence !== null}
        onClose={closeModal}
        onManage={(r) => { closeModal(); drillToBuildings(r) }}
        initialNav={modalInitialNav}
      />

      <div className="flex-1 p-6 animate-fade-in space-y-4">

        {view !== 'residences' && (
          <div className="flex items-center justify-between">
            <Breadcrumb />
            <button onClick={goBack} className="text-xs text-muted-foreground hover:text-[#C18D52] transition-colors">← Retour</button>
          </div>
        )}

        {/* Active filter chips — z-50 keeps them above the filter backdrop so clicks aren't swallowed */}
        {activeChips.length > 0 && (
          <div className="relative z-50 flex items-center gap-2 flex-wrap -mt-1">
            {activeChips.map((chip, i) => (
              <span key={i} className={cn('inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border select-none', CHIP_CLASSES[chip.color])}>
                {chip.label}
                <button onClick={chip.remove} className="flex items-center justify-center rounded-full transition-colors p-0.5 opacity-70 hover:opacity-100">
                  <X size={11} />
                </button>
              </span>
            ))}
            <button onClick={() => setFilters(EMPTY_FILTERS)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8F5C64] hover:text-[#8F5C64]/70 transition-colors px-3 py-1.5 rounded-full border border-transparent hover:border-[#8F5C64]/20 hover:bg-[#8F5C64]/5">
              <RotateCcw size={11} />Tout effacer
            </button>
          </div>
        )}

        {/*â•â• VIEW: RESIDENCES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {view === 'residences' && (
          <>
            {firstLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-muted-foreground/40" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredItems.map(r => {
                    const isStandalone = r.building_count === 1
                    return (
                      <Card key={r.id} className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer group" onClick={() => openModal(r)}>
                        <div className="relative h-56 w-full overflow-hidden bg-muted">
                          <img src={r.image ?? DEFAULT_IMG} alt={r.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute top-2 right-2">
                            <Badge variant={isStandalone ? 'secondary' : 'info'} className="text-[10px]">
                              {isStandalone ? 'Standalone' : 'Complex'}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="px-4 pt-2.5 pb-3">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="font-semibold text-sm">{r.name}</h3>
                            <span className={cn(residenceStatus[r.status].cls, 'text-[10px]')}>
                              {residenceStatus[r.status].label}
                            </span>
                          </div>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <MapPin size={10} />{r.city ?? r.address}
                          </p>

                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {[
                              { value: r.building_count,  label: 'Buildings', Icon: Building2, color: 'text-[#C18D52]', bg: 'bg-[#C18D52]/[0.12]' },
                              { value: r.apartment_count, label: 'Units',     Icon: Home,      color: 'text-[#33091B]', bg: 'bg-[#33091B]/[0.10]' },
                              { value: r.occupied_count,  label: 'Occupied',  Icon: Users,     color: 'text-[#D97172]', bg: 'bg-[#D97172]/[0.10]' },
                            ].map(s => (
                              <div key={s.label} className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg ${s.bg}`}>
                                <s.Icon size={14} strokeWidth={1.5} className={s.color} />
                                <p className={`text-sm font-bold leading-none ${s.color}`}>{s.value}</p>
                                <p className={`text-[10px] font-medium ${s.color} opacity-70`}>{s.label}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-border/60">
                            {r.occupied_count > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex -space-x-2">
                                  {Array.from({ length: Math.min(r.occupied_count, 3) }).map((_, i) => (
                                    <img key={i}
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.id}-${i}&backgroundColor=b6e3f4,ffd5dc,c0aede`}
                                      className="h-7 w-7 rounded-full border-2 border-white object-cover shrink-0"
                                      alt=""
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] text-[#8F5C64]">
                                  {r.occupied_count} propriétaire{r.occupied_count > 1 ? 's' : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/40 italic">Aucun propriétaire</span>
                            )}
                            <div className="flex items-center gap-1 shrink-0">
                              {(r.facilities ?? []).slice(0, 3).map(f => (
                                <FacilityPill key={f} name={f} />
                              ))}
                              {(r.facilities?.length ?? 0) > 3 && (
                                <span className="text-[10px] text-muted-foreground font-medium px-0.5">
                                  +{r.facilities!.length - 3}
                                </span>
                              )}
                              <button onClick={e => { e.stopPropagation(); drillToBuildings(r) }}
                                className="ml-1.5 flex items-center gap-1.5 h-7 px-3 rounded-lg bg-primary hover:bg-primary/90 transition-colors">
                                <span className="text-white text-xs font-medium">Manage</span>
                                <ArrowRight size={12} className="text-white" strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {/* Add new card — hidden while filters are active with no results */}
                  {filteredItems.length > 0 && (
                    <AddResidenceModal onSuccess={refresh}>
                      <button className="flex flex-col items-center justify-center min-h-[260px] rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 mb-2 transition-colors">
                          <Plus size={20} className="text-muted-foreground group-hover:text-primary" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">Ajouter</p>
                      </button>
                    </AddResidenceModal>
                  )}
                </div>

                {filteredItems.length === 0 && items.length > 0 && (
                  <EmptyState
                    title="Aucune résidence trouvée"
                    description="Aucune résidence ne correspond aux critères que vous avez sélectionnés. Essayez d'ajuster les filtres ou d'effacer votre recherche."
                  />
                )}

                {/* Load More */}
                {hasMore && (
                  <button
                    onClick={() => loadPage(currentPage + 1)}
                    disabled={moreLoading}
                    className="w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
                  >
                    {moreLoading ? (
                      <><Loader2 size={14} className="animate-spin" /> Chargement…</>
                    ) : (
                      <>Charger plus <span className="text-muted-foreground/50">({totalCount - items.length} restants)</span></>
                    )}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* â•â• VIEW: BUILDINGS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {view === 'buildings' && selectedResidence && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {buildingsLoading ? (
              <div className="col-span-3 flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-muted-foreground/40" />
              </div>
            ) : filteredBuildings.map(b => {
              const visibleOwners = Math.min(b.occupied_count, 3)
              return (
                <Card key={b.id} className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer group" onClick={() => selectedResidence && openModal(selectedResidence, { level: 'building', buildingId: b.id })}>
                  <div className="relative h-28 bg-gradient-to-br from-[#203B37]/15 via-[#203B37]/8 to-[#5A8F76]/10 flex items-center justify-center">
                    {b.image
                      ? <img src={b.image} alt={b.name} className="h-full w-full object-cover" />
                      : <Building2 size={48} className="text-[#203B37]/25" />
                    }
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{b.name}</h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin size={10} />{b.address ?? selectedResidence.address}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { value: b.floors,           label: 'Étages',  color: 'text-[#C18D52]', bg: 'bg-[#C18D52]/[0.12]' },
                        { value: b.apartment_count,  label: 'Unités',  color: 'text-[#33091B]', bg: 'bg-[#33091B]/[0.10]' },
                        { value: b.occupied_count,   label: 'Occupés', color: 'text-[#D97172]', bg: 'bg-[#D97172]/[0.10]' },
                      ].map(s => (
                        <div key={s.label} className={`text-center p-1.5 rounded-lg ${s.bg}`}>
                          <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                          <p className={`text-[10px] font-medium ${s.color} opacity-70`}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 text-[10px] mb-3">
                      {b.has_elevator         && <span className="bg-[#8F5C64]/[0.10] text-[#8F5C64] font-medium px-1.5 py-0.5 rounded">Ascenseur</span>}
                      {b.has_garage           && <span className="bg-[#8F5C64]/[0.10] text-[#8F5C64] font-medium px-1.5 py-0.5 rounded">Garage</span>}
                      {b.property_plan_number && <span className="bg-[#203B37]/[0.08] text-[#203B37] font-mono px-1.5 py-0.5 rounded">{b.property_plan_number}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      {b.occupied_count === 0 ? (
                        <div className="flex items-center">
                          <div className="flex -space-x-2">
                            <div className="h-7 w-7 rounded-full border-2 border-white bg-muted shrink-0" />
                            <div className="h-7 w-7 rounded-full border-2 border-white bg-muted flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-semibold text-muted-foreground">+0</span>
                            </div>
                          </div>
                          <span className="ml-2 text-[11px] text-[#8F5C64]/60">No owners yet</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="flex -space-x-2">
                            {Array.from({ length: visibleOwners }).map((_, i) => (
                              <div key={i} className="h-7 w-7 rounded-full border-2 border-white overflow-hidden bg-muted shrink-0">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${b.id}-${i}&backgroundColor=b6e3f4,ffd5dc,c0aede`}
                                  alt="owner"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                            {b.occupied_count > 3 && (
                              <div className="h-7 w-7 rounded-full border-2 border-white bg-muted flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-semibold text-muted-foreground">+{b.occupied_count - 3}</span>
                              </div>
                            )}
                          </div>
                          <span className="ml-2 text-[11px] text-[#8F5C64]">
                            {b.occupied_count} propriétaire{b.occupied_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <AddResidenceModal
                          startStep={3}
                          lockedResidence={selectedResidence}
                          lockedBuilding={b}
                          onSuccess={() => refresh()}
                        >
                          <button className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all text-xs font-medium">
                            <Plus size={12} />Ajouter apt.
                          </button>
                        </AddResidenceModal>
                        <button onClick={() => drillToApartments(b)}
                          className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-primary hover:bg-primary/90 transition-colors">
                          <span className="text-white text-xs font-medium">Manage</span>
                          <ArrowRight size={12} className="text-white" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {!buildingsLoading && filteredBuildings.length === 0 && selectedBuildings.length > 0 && (
              <div className="col-span-3">
                <EmptyState
                  title="Aucun bâtiment trouvé"
                  description="Aucun bâtiment ne correspond aux filtres que vous avez appliqués. Modifiez les critères ou réinitialisez les filtres pour voir tous les bâtiments."
                />
              </div>
            )}

            {!buildingsLoading && filteredBuildings.length > 0 && (
              <AddResidenceModal startStep={2} lockedResidence={selectedResidence} onSuccess={() => refresh()}>
                <button className="flex flex-col items-center justify-center min-h-[220px] rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 mb-2 transition-colors">
                    <Plus size={20} className="text-muted-foreground group-hover:text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">Ajouter bâtiment</p>
                </button>
              </AddResidenceModal>
            )}
          </div>
        )}

        {/* VIEW: APARTMENTS */}
        {view === 'apartments' && selectedBuilding && (
          <div className="rounded-xl border overflow-hidden bg-card">
            {buildingAptsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-muted-foreground/40" />
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {['Unité', 'Étage', 'Surface', 'Type', '‰ Copro', 'Statut', 'Propriétaire(s)', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApts.map((apt, i) => {
                      const shareholders = apt.shareholders ?? []
                      const primary = shareholders.find(s => s.isPrimary) ?? shareholders[0] ?? null
                      const primaryName = primary ? `${primary.firstName} ${primary.lastName}` : null
                      const primaryAvatar = primary ? shareholderAvatar(primary) : null
                      const isOpen = expandedApt === apt.id

                      return (
                        <React.Fragment key={apt.id}>
                          <tr
                            className={cn('border-b transition-colors cursor-pointer', i % 2 !== 0 && 'bg-[#EEE8B2]/20', isOpen ? 'bg-[#5A8F76]/5' : 'hover:bg-[#203B37]/5')}
                            onClick={() => selectedResidence && selectedBuilding && openModal(selectedResidence, { level: 'apartment', buildingId: selectedBuilding.id, aptId: apt.id })}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#203B37]/[0.12] text-[#203B37] text-xs font-bold shrink-0">
                                  {apt.unit_code.slice(0, 2)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{apt.unit_code}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{apt.lot_number ?? '-'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{apt.floor ?? '-'}</td>
                            <td className="px-4 py-3 text-sm">{apt.area_sqm ? `${apt.area_sqm} m²` : '-'}</td>
                            <td className="px-4 py-3 text-xs font-medium">
                              <span className={cn('px-2 py-0.5 rounded-md',
                                apt.usage_type === 'RESIDENTIAL' ? 'bg-[#203B37]/[0.10] text-[#203B37]'
                                : apt.usage_type === 'COMMERCIAL' ? 'bg-[#D97172]/[0.10] text-[#D97172]'
                                : 'bg-[#C18D52]/[0.10] text-[#C18D52]'
                              )}>
                                {apt.usage_type === 'RESIDENTIAL' ? 'Résidentiel' : apt.usage_type === 'COMMERCIAL' ? 'Commercial' : 'Mixte'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{apt.quote_part != null ? `${apt.quote_part}‰` : '-'}</td>
                            <td className="px-4 py-3"><span className={cn(aptStatus[apt.status].cls, 'text-[10px]')}>{aptStatus[apt.status].label}</span></td>
                            <td className="px-4 py-3">
                              {primaryName ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={primaryAvatar!} />
                                    <AvatarFallback className="text-[9px]">{getInitials(primaryName)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs">{primaryName}</span>
                                  {shareholders.length > 1 && <span className="text-[10px] text-muted-foreground">+{shareholders.length - 1}</span>}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button className="text-[#C18D52]/50 hover:text-[#C18D52] transition-colors" onClick={e => { e.stopPropagation(); setExpandedApt(isOpen ? null : apt.id) }}>
                                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr className="bg-[#5A8F76]/5 border-b">
                              <td colSpan={8} className="px-6 py-4">
                                <p className="text-xs font-semibold text-[#8F5C64] uppercase tracking-wide mb-3">
                                  Propriétaires — {apt.unit_code}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  {shareholders.map((o, idx) => {
                                    const name = `${o.firstName} ${o.lastName}`
                                    const avatar = shareholderAvatar(o)
                                    return (
                                      <div key={idx} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border shadow-sm min-w-[220px]">
                                        <Avatar className="h-10 w-10">
                                          <AvatarImage src={avatar} />
                                          <AvatarFallback>{getInitials(name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium truncate">{name}</p>
                                            {o.isPrimary && <Badge variant="info" className="text-[9px] px-1 py-0">Principal</Badge>}
                                          </div>
                                          <p className="text-[11px] text-muted-foreground">{o.email ?? 'Aucun email'}</p>
                                        </div>
                                        <div className="flex gap-1">
                                          <button onClick={() => selectedResidence && selectedBuilding && openModal(selectedResidence, { level: 'apartment', buildingId: selectedBuilding.id, aptId: apt.id })}
                                            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary"><Eye size={13} /></button>
                                          <button onClick={() => selectedResidence && selectedBuilding && openModal(selectedResidence, { level: 'apartment', buildingId: selectedBuilding.id, aptId: apt.id })}
                                            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary"><Pencil size={13} /></button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                  {shareholders.length === 0 && (
                                    <p className="text-xs text-muted-foreground">Aucun propriétaire enregistré</p>
                                  )}
                                  <AddResidenceModal
                                    startStep={3}
                                    lockedResidence={selectedResidence ?? undefined}
                                    lockedBuilding={selectedBuilding ?? undefined}
                                    lockedApartment={apt}
                                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['building-apartments', selectedBuilding?.id] })}
                                  >
                                    <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors min-w-[160px] text-muted-foreground hover:text-primary">
                                      <Plus size={16} />
                                      <span className="text-xs font-medium">Ajouter propriétaire</span>
                                    </button>
                                  </AddResidenceModal>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>

                {selectedBuildingApts.length === 0 && (
                  <EmptyState
                    title="Aucun appartement dans ce bâtiment"
                    description="Ce bâtiment n'a pas encore d'appartements enregistrés. Ajoutez-en un pour commencer."
                  />
                )}

                {filteredApts.length === 0 && selectedBuildingApts.length > 0 && (
                  <EmptyState
                    title="Aucun appartement trouvé"
                    description="Aucun appartement ne correspond aux filtres que vous avez sélectionnés. Essayez d'ajuster l'étage, le statut ou la surface recherchée."
                  />
                )}
              </>
            )}
          </div>
        )}

      </div>


    </div>
  )
}

