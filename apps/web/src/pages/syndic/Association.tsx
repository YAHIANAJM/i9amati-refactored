import { useState } from 'react'
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
  ArrowRight, Hash, Phone, CreditCard,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Building3DViewer } from '@/pages/syndic/tools/Building3DViewer'
import { mockResidences } from '@/data/mock/residences'
import { mockBuildings } from '@/data/mock/buildings'
import { mockApartments, getApartmentsByBuilding } from '@/data/mock/apartments'
import { mockOwners, getOwnersByApartment } from '@/data/mock/owners'
import { cn, getInitials } from '@/lib/utils'
import type { Residence } from '@i9amati/shared'
import type { Building } from '@i9amati/shared'

/* ── constants ──────────────────────────────────────────────── */

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80'
const MALE_AVATAR   = 'https://api.dicebear.com/7.x/avataaars/svg?seed=male&backgroundColor=b6e3f4'
const FEMALE_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=female&backgroundColor=ffd5dc'


const FACILITY_ICONS: Record<string, LucideIcon> = {
  'Elevator':  ArrowUpDown,
  'Security':  Shield,
  'Parking':   Car,
  'Pool':      Waves,
  'Gym':       Dumbbell,
  'Generator': Zap,
  'Garden':    Trees,
}

const residenceStatus = {
  ACTIVE:      { label: 'Actif',   variant: 'success'   as const },
  MAINTENANCE: { label: 'Travaux', variant: 'warning'   as const },
  INACTIVE:    { label: 'Inactif', variant: 'secondary' as const },
}

const aptStatus = {
  OCCUPIED:    { label: 'Occupé',    variant: 'success'   as const },
  VACANT:      { label: 'Vacant',    variant: 'secondary' as const },
  MAINTENANCE: { label: 'Travaux',   variant: 'warning'   as const },
}

/* ── header stat item ────────────────────────────────────────── */

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className={`text-sm font-bold tabular-nums leading-none ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground leading-none">{label}</span>
    </span>
  )
}

/* ── avatar stack helper ────────────────────────────────────── */

const MAX_VISIBLE = 3

function ownerAvatar(gender: 'MALE' | 'FEMALE', profileImage?: string) {
  return profileImage ?? (gender === 'FEMALE' ? FEMALE_AVATAR : MALE_AVATAR)
}

function AvatarStack({ owners }: { owners: { id: string; firstName: string; lastName: string; gender: 'MALE' | 'FEMALE'; profileImage?: string }[] }) {
  const visible = owners.slice(0, MAX_VISIBLE)
  const extra   = owners.length - MAX_VISIBLE

  if (owners.length === 0) {
    return (
      <div className="flex items-center">
        <div className="flex -space-x-2">
          <div className="h-7 w-7 rounded-full border-2 border-white bg-muted shrink-0" />
          <div className="h-7 w-7 rounded-full border-2 border-white bg-muted flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-muted-foreground">+0</span>
          </div>
        </div>
        <span className="ml-2 text-[11px] text-muted-foreground">No owners yet</span>
      </div>
    )
  }

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map(o => (
          <div
            key={o.id}
            className="h-7 w-7 rounded-full border-2 border-white overflow-hidden bg-muted shrink-0"
            title={`${o.firstName} ${o.lastName}`}
          >
            <img
              src={ownerAvatar(o.gender, o.profileImage)}
              alt={`${o.firstName} ${o.lastName}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
        {extra > 0 && (
          <div className="h-7 w-7 rounded-full border-2 border-white bg-muted flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-muted-foreground">+{extra}</span>
          </div>
        )}
      </div>
      <span className="ml-2 text-[11px] text-muted-foreground">
        {owners.length} owner{owners.length !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

/* ── facility pill (expands on hover to reveal label) ───────── */

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
      className="flex items-center gap-1.5 h-6 px-1.5 rounded-md bg-muted overflow-hidden cursor-default select-none"
    >
      {Icon
        ? <Icon size={11} className="text-muted-foreground shrink-0" />
        : <span className="text-[9px] font-medium text-muted-foreground">{name.slice(0, 2)}</span>
      }
      <AnimatePresence>
        {hovered && (
          <motion.span
            key={name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="text-[10px] text-muted-foreground whitespace-nowrap pr-0.5"
          >
            {name}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════
   RESIDENCE OVERVIEW MODAL
══════════════════════════════════════════════════════════════ */

type ModalNav =
  | { level: 'overview' }
  | { level: 'building'; buildingId: string }
  | { level: 'apartment'; buildingId: string; aptId: string }

function ResidenceModal({
  residence, open, onClose, onManage,
}: {
  residence: Residence | null
  open: boolean
  onClose: () => void
  onManage: (r: Residence) => void
}) {
  const [nav, setNav] = useState<ModalNav>({ level: 'overview' })

  const handleClose = () => { onClose(); setNav({ level: 'overview' }) }

  if (!residence) return null

  const buildings  = mockBuildings.filter(b => b.residenceId === residence.id)
  const apartments = mockApartments.filter(a => a.residenceId === residence.id)
  const occupied   = apartments.filter(a => a.status === 'OCCUPIED').length
  const vacant     = apartments.filter(a => a.status === 'VACANT').length
  const isStandalone = buildings.length === 1 && buildings[0]?.unionType === 'IMMEUBLE'

  const activeBuilding = nav.level !== 'overview'
    ? buildings.find(b => b.id === nav.buildingId) ?? null
    : null
  const buildingApts = activeBuilding ? getApartmentsByBuilding(activeBuilding.id) : []
  const activeApt    = nav.level === 'apartment'
    ? buildingApts.find(a => a.id === nav.aptId) ?? null
    : null
  const aptOwners    = activeApt ? getOwnersByApartment(activeApt.id) : []

  const isOverview = nav.level === 'overview'

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="w-[92vw] max-w-7xl h-[88vh] overflow-hidden flex flex-col p-0">
        <DialogTitle className="sr-only">{residence.name}</DialogTitle>

        {/* ══ BODY — switches layout based on nav level ══════════ */}
        <AnimatePresence mode="wait" initial={false}>

          {/* ── OVERVIEW: 2-col (left overview + right 3D) ──────── */}
          {isOverview && (
            <motion.div key="overview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-border"
            >
              {/* LEFT — residence overview */}
              <div className="flex flex-col overflow-hidden">

                {/* ── Hero image ── */}
                <div className="relative h-52 shrink-0 overflow-hidden">
                  <img
                    src={residence.image ?? DEFAULT_IMG}
                    alt={residence.name}
                    className="w-full h-full object-cover"
                  />
                  {/* gradient: dark bottom, subtle top */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                  {/* top row: status badges + facilities */}
                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant={residenceStatus[residence.status].variant} className="text-[10px] shadow-sm">
                        {residenceStatus[residence.status].label}
                      </Badge>
                      <Badge variant={isStandalone ? 'secondary' : 'info'} className="text-[10px] shadow-sm">
                        {isStandalone ? 'Standalone' : 'Complex'}
                      </Badge>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {(residence.facilities ?? []).slice(0, 3).map(f => (
                        <span key={f} className="text-[9px] font-semibold bg-white/15 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/20">
                          {f}
                        </span>
                      ))}
                      {(residence.facilities ?? []).length > 3 && (
                        <span className="text-[9px] font-semibold bg-white/15 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/20">
                          +{(residence.facilities ?? []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* bottom: residence name prominent */}
                  <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.15em] mb-1">
                      {isStandalone ? 'Standalone Building' : `Residence Complex · ${buildings.length} buildings`}
                    </p>
                    <h2 className="text-2xl font-extrabold text-white leading-tight tracking-tight">
                      {residence.name}
                    </h2>
                    <p className="text-white/55 text-xs flex items-center gap-1.5 mt-1.5">
                      <MapPin size={10} />
                      {residence.city ?? residence.address}
                    </p>
                  </div>

                  {/* Manage button — top-right of hero acts as primary action */}
                  <button
                    onClick={() => { handleClose(); onManage(residence) }}
                    className="absolute top-4 right-4 hidden"
                  />
                </div>

                {/* ── Stats row ── */}
                <div className="flex shrink-0 border-b">
                  {[
                    { label: 'Units',    value: apartments.length, color: 'text-violet-600'  },
                    { label: 'Occupied', value: occupied,          color: 'text-emerald-600' },
                    { label: 'Vacant',   value: vacant,            color: 'text-slate-400'   },
                    { label: 'Owners',   value: mockOwners.filter(o => apartments.some(a => a.id === o.apartmentId)).length, color: 'text-blue-600' },
                  ].map((s, i) => (
                    <div key={s.label} className={cn(
                      'flex-1 flex flex-col items-center py-3',
                      i > 0 && 'border-l border-border/60'
                    )}>
                      <span className={`text-base font-bold tabular-nums leading-none ${s.color}`}>{s.value}</span>
                      <span className="text-[10px] text-muted-foreground mt-1">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* ── Buildings list ── */}
                <div className="flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      Buildings
                    </p>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2">
                      <Plus size={10} /> Add
                    </Button>
                  </div>

                  <div className="px-4 pb-4 space-y-2.5">
                    {buildings.map((b, idx) => {
                      const bApts     = getApartmentsByBuilding(b.id)
                      const bOccupied = bApts.filter(a => a.status === 'OCCUPIED').length
                      const bVacant   = bApts.filter(a => a.status === 'VACANT').length
                      const pct       = bApts.length > 0 ? Math.round((bOccupied / bApts.length) * 100) : 0
                      const BADGE_COLORS = [
                        'bg-blue-100 text-blue-700',
                        'bg-violet-100 text-violet-700',
                        'bg-emerald-100 text-emerald-700',
                        'bg-amber-100 text-amber-700',
                      ]
                      const badgeColor = BADGE_COLORS[idx % BADGE_COLORS.length]
                      const letter = (b.name.replace(/[^\w]/g, '').match(/[A-Za-z0-9]/)?.[0] ?? '#').toUpperCase()

                      return (
                        <button
                          key={b.id}
                          onClick={() => setNav({ level: 'building', buildingId: b.id })}
                          className="w-full p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all text-left group"
                        >
                          {/* Row 1: badge + name + arrow */}
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'h-10 w-10 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 transition-colors',
                              badgeColor,
                              'group-hover:bg-primary group-hover:text-white'
                            )}>
                              {letter}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{b.name}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {b.numberOfFloors ?? '?'} floors · {bApts.length} units
                              </p>
                            </div>
                            <div className="h-7 w-7 rounded-lg bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-colors shrink-0">
                              <ChevronRight size={13} className="text-primary group-hover:text-white transition-colors" />
                            </div>
                          </div>

                          {/* Row 2: occupancy bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] text-muted-foreground">
                                {bOccupied} occupied · {bVacant} vacant
                              </span>
                              <span className="text-[10px] font-semibold text-muted-foreground">{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Row 3: amenity chips */}
                          {(b.hasElevator || b.hasGarage || b.hasSharedParts) && (
                            <div className="flex items-center gap-1 mt-2.5">
                              {b.hasElevator    && <span className="text-[9px] bg-blue-50   text-blue-600   px-2 py-0.5 rounded-full font-medium border border-blue-100">Elevator</span>}
                              {b.hasGarage      && <span className="text-[9px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium border border-violet-100">Parking</span>}
                              {b.hasSharedParts && <span className="text-[9px] bg-slate-50  text-slate-500  px-2 py-0.5 rounded-full font-medium border border-slate-200">Shared</span>}
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
                </div>
              </div>

              {/* RIGHT — 3D viewer (full bleed, no header) */}
              <div className="overflow-hidden bg-[#F0F2F5]">
                {buildings.length > 0 ? (() => {
                  const b = buildings[0]
                  const aptsPerSide = Math.max(1, Math.min(5, Math.round((b.totalUnits ?? 6) / ((b.numberOfFloors ?? 3) * 2))))
                  return (
                    <Building3DViewer
                      viewOnly showControls
                      label={residence.name}
                      initialCfg={{ floors: b.numberOfFloors ?? 3, apts: aptsPerSide }}
                    />
                  )
                })() : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 select-none">
                    <Building2 size={40} strokeWidth={1} />
                    <p className="text-xs mt-2">No buildings</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── BUILDING DETAIL: full width ──────────────────────── */}
          {nav.level === 'building' && activeBuilding && (
            <motion.div key="building"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              {/* inner nav bar */}
              <div className="flex items-center gap-2 px-5 py-2.5 border-b shrink-0">
                <button
                  onClick={() => setNav({ level: 'overview' })}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <ChevronLeft size={12} /> Back
                </button>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <button onClick={() => setNav({ level: 'overview' })} className="hover:text-foreground transition-colors">
                    {residence.name}
                  </button>
                  <ChevronRight size={11} className="text-muted-foreground/30" />
                  <span className="font-semibold text-foreground">{activeBuilding.name}</span>
                </div>
                <Button size="sm" className="gap-1 text-xs h-7 px-3 ml-auto"
                  onClick={() => { handleClose(); onManage(residence) }}>
                  Manage <ArrowRight size={12} />
                </Button>
              </div>

              {/* two-col body */}
              <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-border">
              {/* LEFT — building info */}
              <div className="flex flex-col overflow-y-auto">
                <div className="px-5 py-3 border-b shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Building Info</p>
                </div>
                <div className="p-5 space-y-4">
                  {/* Key metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Floors',      value: activeBuilding.numberOfFloors ?? '—', color: 'text-blue-600'   },
                      { label: 'Total Units', value: activeBuilding.totalUnits ?? '—',    color: 'text-violet-600' },
                      { label: 'Apartments',  value: buildingApts.length,                 color: 'text-emerald-600'},
                    ].map(s => (
                      <div key={s.label} className="flex flex-col items-center py-3 rounded-xl bg-muted/40">
                        <span className={`text-xl font-bold tabular-nums leading-none ${s.color}`}>{s.value}</span>
                        <span className="text-[10px] text-muted-foreground mt-1">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Details grid */}
                  <div className="rounded-xl border border-border/60 p-4 grid grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      { label: 'Union Type',  value: activeBuilding.unionType },
                      { label: 'Plan Number', value: activeBuilding.propertyPlanNumber },
                      { label: 'Address',     value: activeBuilding.address },
                      { label: 'Created',     value: new Date(activeBuilding.createdAt).toLocaleDateString('en-GB') },
                    ].map(r => (
                      <div key={r.label}>
                        <p className="text-[10px] text-muted-foreground">{r.label}</p>
                        <p className="text-xs font-semibold mt-0.5 truncate">{r.value ?? '—'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Amenities */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeBuilding.hasElevator    && <span className="text-[11px] bg-blue-50   text-blue-700   px-2.5 py-1 rounded-full font-medium">Elevator</span>}
                      {activeBuilding.hasGarage      && <span className="text-[11px] bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full font-medium">Parking</span>}
                      {activeBuilding.hasSharedParts && <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">Shared Parts</span>}
                      {!activeBuilding.hasElevator && !activeBuilding.hasGarage && !activeBuilding.hasSharedParts && (
                        <span className="text-xs text-muted-foreground/40">None listed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT — apartments in this building */}
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Apartments
                    <span className="ml-1.5 normal-case tracking-normal font-normal text-muted-foreground/60">
                      ({buildingApts.length})
                    </span>
                  </p>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2.5">
                    <Plus size={11} /> Add
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {buildingApts.map(apt => {
                    const owners = getOwnersByApartment(apt.id)
                    return (
                      <button
                        key={apt.id}
                        onClick={() => setNav({ level: 'apartment', buildingId: activeBuilding.id, aptId: apt.id })}
                        className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/[0.03] transition-all text-left group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {apt.floor ?? '—'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold">{apt.unitCode}</span>
                            <Badge variant={aptStatus[apt.status].variant} className="text-[9px] px-1.5 py-0">
                              {aptStatus[apt.status].label}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {apt.areaSqm ? `${apt.areaSqm} m²` : '—'}
                            {apt.percentageOfApartment ? ` · ${apt.percentageOfApartment}%` : ''}
                          </p>
                        </div>
                        {owners.length > 0 && (
                          <div className="flex -space-x-1.5 shrink-0">
                            {owners.slice(0, 3).map(o => (
                              <img key={o.id} src={ownerAvatar(o.gender, o.profileImage)}
                                className="h-6 w-6 rounded-full border-2 border-white object-cover" alt="" />
                            ))}
                            {owners.length > 3 && (
                              <div className="h-6 w-6 rounded-full border-2 border-white bg-muted flex items-center justify-center">
                                <span className="text-[9px] font-semibold text-muted-foreground">+{owners.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {owners.length === 0 && (
                          <span className="text-[10px] text-muted-foreground/40 shrink-0">No owner</span>
                        )}
                        <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                      </button>
                    )
                  })}
                  {buildingApts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30">
                      <Home size={32} strokeWidth={1} />
                      <p className="text-xs mt-2">No apartments yet</p>
                    </div>
                  )}
                </div>
              </div>
              </div>{/* end two-col body */}
            </motion.div>
          )}

          {/* ── APARTMENT DETAIL: full width ─────────────────────── */}
          {nav.level === 'apartment' && activeApt && (
            <motion.div key="apartment"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              {/* inner nav bar */}
              <div className="flex items-center gap-2 px-5 py-2.5 border-b shrink-0">
                <button
                  onClick={() => setNav({ level: 'building', buildingId: nav.buildingId })}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <ChevronLeft size={12} /> Back
                </button>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <button onClick={() => setNav({ level: 'overview' })} className="hover:text-foreground transition-colors">
                    {residence.name}
                  </button>
                  <ChevronRight size={11} className="text-muted-foreground/30" />
                  <button onClick={() => setNav({ level: 'building', buildingId: nav.buildingId })} className="hover:text-foreground transition-colors">
                    {activeBuilding?.name}
                  </button>
                  <ChevronRight size={11} className="text-muted-foreground/30" />
                  <span className="font-semibold text-foreground">{activeApt.unitCode}</span>
                </div>
                <Button size="sm" className="gap-1 text-xs h-7 px-3 ml-auto"
                  onClick={() => { handleClose(); onManage(residence) }}>
                  Manage <ArrowRight size={12} />
                </Button>
              </div>

              {/* two-col body */}
              <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-border">
              {/* LEFT — apartment info */}
              <div className="flex flex-col overflow-y-auto">
                <div className="px-5 py-3 border-b shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Apartment Info</p>
                </div>
                <div className="p-5 space-y-4">
                  {/* Identity row */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
                      {activeApt.floor ?? '—'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold">{activeApt.unitCode}</span>
                        <Badge variant={aptStatus[activeApt.status].variant}>
                          {aptStatus[activeApt.status].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{activeBuilding?.name}</p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="rounded-xl border border-border/60 p-4 grid grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      { label: 'Floor',       value: activeApt.floor },
                      { label: 'Area',        value: activeApt.areaSqm ? `${activeApt.areaSqm} m²` : undefined },
                      { label: 'Share %',     value: activeApt.percentageOfApartment ? `${activeApt.percentageOfApartment}%` : undefined },
                      { label: 'Usage',       value: activeApt.usageType },
                      { label: 'Main plot',      value: activeApt.mainPlotNumber },
                      { label: 'Residence %',   value: activeApt.percentageOfResidence ? `${activeApt.percentageOfResidence}%` : undefined },
                    ].map(r => (
                      <div key={r.label}>
                        <p className="text-[10px] text-muted-foreground">{r.label}</p>
                        <p className="text-xs font-semibold mt-0.5">{r.value ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT — owners */}
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Owners
                    <span className="ml-1.5 normal-case tracking-normal font-normal text-muted-foreground/60">
                      ({aptOwners.length})
                    </span>
                  </p>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2.5">
                    <Plus size={11} /> Add owner
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {aptOwners.length > 0 ? aptOwners.map(o => (
                    <div key={o.id} className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card">
                      <img src={ownerAvatar(o.gender, o.profileImage)}
                        className="h-11 w-11 rounded-full border-2 border-white object-cover shrink-0" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-sm font-semibold">{o.firstName} {o.lastName}</span>
                          {o.isRepresentative && (
                            <Badge variant="info" className="text-[9px] px-1.5 py-0 shrink-0">Rep</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {o.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone size={10} className="text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground truncate">{o.phone}</span>
                            </div>
                          )}
                          {o.nationalId && (
                            <div className="flex items-center gap-1.5">
                              <CreditCard size={10} className="text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground font-mono">{o.nationalId}</span>
                            </div>
                          )}
                          {activeApt.percentageOfApartment != null && (
                            <div className="flex items-center gap-1.5">
                              <Hash size={10} className="text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground">{activeApt.percentageOfApartment}% share</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Eye size={13} />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <button className="w-full flex items-center justify-center gap-1.5 py-10 rounded-xl border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary">
                      <Plus size={13} />
                      <span className="text-xs">Add first owner</span>
                    </button>
                  )}
                </div>
              </div>
              </div>{/* end two-col body */}
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

/* ── types ──────────────────────────────────────────────────── */

type View = 'residences' | 'buildings' | 'apartments'

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */

export function Association() {
  const [view,               setView]               = useState<View>('residences')
  const [selectedResidence,  setSelectedResidence]  = useState<Residence | null>(null)
  const [selectedBuilding,   setSelectedBuilding]   = useState<Building  | null>(null)
  const [expandedApt,        setExpandedApt]        = useState<string | null>(null)
  const [modalResidence,     setModalResidence]     = useState<Residence | null>(null)

  /* ── navigation helpers ── */
  const drillToBuildings = (r: Residence) => { setSelectedResidence(r); setSelectedBuilding(null); setView('buildings') }
  const openModal  = (r: Residence) => setModalResidence(r)
  const closeModal = () => setModalResidence(null)
  const drillToApartments = (b: Building) => { setSelectedBuilding(b); setExpandedApt(null); setView('apartments') }
  const goBack = () => {
    if (view === 'apartments') { setView('buildings'); setExpandedApt(null) }
    else if (view === 'buildings') { setView('residences'); setSelectedResidence(null) }
  }

  /* ── breadcrumb ── */
  const Breadcrumb = () => (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <button
        onClick={() => { setView('residences'); setSelectedResidence(null); setSelectedBuilding(null) }}
        className={cn('hover:text-primary transition-colors', view === 'residences' && 'text-foreground font-medium pointer-events-none')}
      >
        Owners' Association
      </button>
      {selectedResidence && (
        <>
          <ChevronRight size={12} />
          <button
            onClick={() => { setView('buildings'); setSelectedBuilding(null) }}
            className={cn('hover:text-primary transition-colors', view === 'buildings' && 'text-foreground font-medium pointer-events-none')}
          >
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

  /* ── header subtitle ── */
  const totalUnits    = mockApartments.length
  const totalOccupied = mockApartments.filter(a => a.status === 'OCCUPIED').length

  const dot = <span className="text-muted-foreground/30 text-xs mx-0.5">·</span>

  const HeaderSubtitle = () => {
    if (view === 'residences') return (
      <div className="flex items-center flex-row gap-1 mt-0.5">
        <StatItem value={mockResidences.length} label="Residences" color="text-blue-600" />
        {dot}
        <StatItem value={totalUnits} label="Units" color="text-violet-600" />
        {dot}
        <StatItem value={totalOccupied} label="Occupied" color="text-emerald-600" />
        {dot}
        <StatItem value={totalUnits - totalOccupied} label="Vacant" color="text-slate-400" />
      </div>
    )
    if (view === 'buildings' && selectedResidence) {
      const bCount = mockBuildings.filter(b => b.residenceId === selectedResidence.id).length
      const aCount = mockApartments.filter(a => a.residenceId === selectedResidence.id).length
      return (
        <div className="flex items-center flex-row gap-1 mt-0.5">
          <StatItem value={bCount} label={bCount === 1 ? 'Building' : 'Buildings'} color="text-blue-600" />
          {dot}
          <StatItem value={aCount} label="Units" color="text-violet-600" />
          {dot}
          <span className="text-xs text-muted-foreground">{selectedResidence.name}</span>
        </div>
      )
    }
    if (view === 'apartments' && selectedBuilding) {
      const apts  = getApartmentsByBuilding(selectedBuilding.id)
      const occ   = apts.filter(a => a.status === 'OCCUPIED').length
      return (
        <div className="flex items-center flex-row gap-1 mt-0.5">
          <StatItem value={apts.length} label="Apartments" color="text-violet-600" />
          {dot}
          <StatItem value={occ} label="Occupied" color="text-emerald-600" />
          {dot}
          <span className="text-xs text-muted-foreground">{selectedBuilding.name}</span>
        </div>
      )
    }
    return null
  }

  /* ── top actions ── */
  const Actions = () => (
    <Button size="sm" className="gap-1.5 text-xs">
      <Plus size={13} />
      {view === 'residences' ? 'Ajouter résidence' : view === 'buildings' ? 'Ajouter bâtiment' : 'Ajouter appartement'}
    </Button>
  )

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Owners' Association" subtitle={<HeaderSubtitle />} actions={<Actions />} />

      {/* Residence overview modal */}
      <ResidenceModal
        residence={modalResidence}
        open={modalResidence !== null}
        onClose={closeModal}
        onManage={(r) => { closeModal(); drillToBuildings(r) }}
      />

      <div className="flex-1 p-6 animate-fade-in space-y-4">

        {/* Breadcrumb + back */}
        {view !== 'residences' && (
          <div className="flex items-center justify-between">
            <Breadcrumb />
            <button onClick={goBack} className="text-xs text-muted-foreground hover:text-primary transition-colors">
              ← Retour
            </button>
          </div>
        )}

        {/* ══ VIEW: RESIDENCES ══════════════════════════════════ */}
        {view === 'residences' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockResidences.map(r => {
              const buildings  = mockBuildings.filter(b => b.residenceId === r.id)
              const apartments = mockApartments.filter(a => a.residenceId === r.id)
              const occupied   = apartments.filter(a => a.status === 'OCCUPIED').length
              const isStandalone = buildings.length === 1 && buildings[0]?.unionType === 'IMMEUBLE'
              const resOwners  = mockOwners.filter(o => apartments.some(a => a.id === o.apartmentId))

              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer group" onClick={() => openModal(r)}>
                  {/* Image */}
                  <div className="relative h-56 w-full overflow-hidden bg-muted">
                    <img src={r.image ?? DEFAULT_IMG} alt={r.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2 right-2">
                      <Badge variant={isStandalone ? 'secondary' : 'info'} className="text-[10px]">
                        {isStandalone ? 'Standalone' : 'Complex'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="px-4 pt-2.5 pb-3">
                    {/* Name + status */}
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-sm">{r.name}</h3>
                      <Badge variant={residenceStatus[r.status].variant} className="text-[10px]">
                        {residenceStatus[r.status].label}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin size={10} />{r.city ?? r.address}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[
                        { value: buildings.length,  label: 'Buildings', Icon: Building2 },
                        { value: apartments.length, label: 'Units',     Icon: Home      },
                        { value: occupied,          label: 'Occupied',  Icon: Users     },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-muted/40">
                          <s.Icon size={14} strokeWidth={1.5} className="text-foreground" />
                          <p className="text-sm font-bold leading-none">{s.value}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* ── Card footer ── */}
                    <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-border/60">
                      <AvatarStack owners={resOwners} />

                      <div className="flex items-center gap-1 shrink-0">
                        {(r.facilities ?? []).slice(0, 3).map(f => (
                          <FacilityPill key={f} name={f} />
                        ))}
                        {(r.facilities?.length ?? 0) > 3 && (
                          <span className="text-[10px] text-muted-foreground font-medium px-0.5">
                            +{r.facilities!.length - 3}
                          </span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); openModal(r) }}
                          className="ml-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary hover:bg-primary/90 transition-colors"
                        >
                          <ChevronRight size={13} className="text-white" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Add new */}
            <button className="flex flex-col items-center justify-center min-h-[260px] rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors group">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 mb-2 transition-colors">
                <Plus size={20} className="text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">Ajouter</p>
            </button>
          </div>
        )}

        {/* ══ VIEW: BUILDINGS ═══════════════════════════════════ */}
        {view === 'buildings' && selectedResidence && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockBuildings
              .filter(b => b.residenceId === selectedResidence.id)
              .map(b => {
                const apartments = getApartmentsByBuilding(b.id)
                const occupied   = apartments.filter(a => a.status === 'OCCUPIED').length
                const bldOwners  = mockOwners.filter(o => apartments.some(a => a.id === o.apartmentId))

                return (
                  <Card key={b.id} className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer group" onClick={() => drillToApartments(b)}>
                    <div className="relative h-28 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      {b.image
                        ? <img src={b.image} alt={b.name} className="h-full w-full object-cover" />
                        : <Building2 size={48} className="text-primary/30" />
                      }
                      <div className="absolute top-2 right-2">
                        <Badge variant={b.unionType === 'IMMEUBLE' ? 'secondary' : 'info'} className="text-[10px]">
                          {b.unionType === 'IMMEUBLE' ? 'Standalone' : 'Complex'}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-1">{b.name}</h3>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <MapPin size={10} />{b.address}
                      </p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { value: b.numberOfFloors ?? '—', label: 'Étages' },
                          { value: apartments.length,        label: 'Unités' },
                          { value: occupied,                 label: 'Occupés' },
                        ].map(s => (
                          <div key={s.label} className="text-center p-1.5 rounded-lg bg-muted/50">
                            <p className="text-sm font-bold">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground mb-3">
                        {b.hasElevator && <span className="bg-muted px-1.5 py-0.5 rounded">Elevator</span>}
                        {b.hasGarage   && <span className="bg-muted px-1.5 py-0.5 rounded">Garage</span>}
                        {b.propertyPlanNumber && <span className="bg-muted px-1.5 py-0.5 rounded font-mono">{b.propertyPlanNumber}</span>}
                      </div>
                      <AvatarStack owners={bldOwners} />
                    </CardContent>
                  </Card>
                )
              })}

            <button className="flex flex-col items-center justify-center min-h-[220px] rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors group">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 mb-2 transition-colors">
                <Plus size={20} className="text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">Ajouter bâtiment</p>
            </button>
          </div>
        )}

        {/* ══ VIEW: APARTMENTS ══════════════════════════════════ */}
        {view === 'apartments' && selectedBuilding && (
          <div className="rounded-xl border overflow-hidden bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  {['Unité', 'Étage', 'Surface', 'Type', '% Copro', 'Statut', 'Propriétaire(s)', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getApartmentsByBuilding(selectedBuilding.id).map((apt, i) => {
                  const owners    = getOwnersByApartment(apt.id)
                  const rep       = owners.find(o => o.isRepresentative)
                  const repName   = rep ? `${rep.firstName} ${rep.lastName}` : null
                  const repAvatar = rep?.profileImage ?? (rep?.gender === 'FEMALE' ? FEMALE_AVATAR : MALE_AVATAR)
                  const isOpen    = expandedApt === apt.id

                  return (
                    <>
                      <tr
                        key={apt.id}
                        className={cn(
                          'border-b transition-colors cursor-pointer',
                          i % 2 !== 0 && 'bg-muted/10',
                          isOpen ? 'bg-primary/5' : 'hover:bg-muted/30'
                        )}
                        onClick={() => setExpandedApt(isOpen ? null : apt.id)}
                      >
                        {/* Unit code */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                              {apt.unitCode.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{apt.unitCode}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{apt.mainPlotNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{apt.floor ?? '—'}</td>
                        <td className="px-4 py-3 text-sm">{apt.areaSqm ? `${apt.areaSqm} m²` : '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {apt.usageType === 'RESIDENTIAL' ? 'Résidentiel' : apt.usageType === 'COMMERCIAL' ? 'Commercial' : 'Mixte'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{apt.percentageOfApartment ?? '—'}%</td>
                        <td className="px-4 py-3">
                          <Badge variant={aptStatus[apt.status].variant}>{aptStatus[apt.status].label}</Badge>
                        </td>
                        {/* Representative owner preview */}
                        <td className="px-4 py-3">
                          {repName ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={repAvatar} />
                                <AvatarFallback className="text-[9px]">{getInitials(repName)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{repName}</span>
                              {owners.length > 1 && (
                                <span className="text-[10px] text-muted-foreground">+{owners.length - 1}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-muted-foreground hover:text-primary transition-colors">
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {/* ── Expanded owners panel ── */}
                      {isOpen && (
                        <tr key={`${apt.id}-owners`} className="bg-primary/5 border-b">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                Propriétaires — {apt.unitCode}
                              </p>
                              <div className="flex flex-wrap gap-3">
                                {owners.map(o => {
                                  const name   = `${o.firstName} ${o.lastName}`
                                  const avatar = o.profileImage ?? (o.gender === 'FEMALE' ? FEMALE_AVATAR : MALE_AVATAR)
                                  return (
                                    <div key={o.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border shadow-sm min-w-[220px]">
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage src={avatar} />
                                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <p className="text-sm font-medium truncate">{name}</p>
                                          {o.isRepresentative && (
                                            <Badge variant="info" className="text-[9px] px-1 py-0">ممثل</Badge>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">{o.phone ?? '—'}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">{o.nationalId}</p>
                                      </div>
                                      <div className="flex gap-1">
                                        <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                                          <Eye size={13} />
                                        </button>
                                        <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                                          <Pencil size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}

                                {/* Add owner button */}
                                <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors min-w-[160px] text-muted-foreground hover:text-primary">
                                  <Plus size={16} />
                                  <span className="text-xs font-medium">Ajouter propriétaire</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>

            {getApartmentsByBuilding(selectedBuilding.id).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Home size={36} className="mb-3 opacity-30" />
                <p className="text-sm">Aucun appartement dans ce bâtiment</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
