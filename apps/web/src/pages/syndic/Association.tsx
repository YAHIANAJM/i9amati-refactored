import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import {
  ChevronRight, ChevronLeft, Plus, MapPin, Building2, Home,
  Users, ChevronDown, ChevronUp, Eye, Pencil,
  ArrowUpDown, Shield, Car, Waves, Dumbbell, Zap, Trees,
  ArrowRight, Hash, Phone, CreditCard, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { mockResidences } from '@/data/mock/residences'
import { mockBuildings } from '@/data/mock/buildings'
import { mockApartments, getApartmentsByBuilding } from '@/data/mock/apartments'
import { mockOwners, getOwnersByApartment } from '@/data/mock/owners'
import { cn, getInitials } from '@/lib/utils'
import type { Residence } from '@i9amati/shared'
import type { Building } from '@i9amati/shared'

/* ── constants ──────────────────────────────────────────────── */

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80'
const MALE_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=male&backgroundColor=b6e3f4'
const FEMALE_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=female&backgroundColor=ffd5dc'

/* 20 curated Unsplash apartment interior photos - one per residence, stable URLs */
const FLOOR_PLAN_PHOTOS = [
  'photo-1522708323590-d24dbb6b0267',
  'photo-1560448204-e02f11c3d0e2',
  'photo-1502005097973-6a7082348e28',
  'photo-1484154218962-a197022b5858',
  'photo-1493809842364-78817add7ffb',
  'photo-1556909114-f6e7ad7d3136',
  'photo-1512917774080-9991f1c4c750',
  'photo-1505691938895-1758d7feb511',
  'photo-1554995207-c18c203602cb',
  'photo-1565182999561-18d7dc61c393',
  'photo-1540518614846-7eded433c457',
  'photo-1571508601891-ca5e7a713859',
  'photo-1600585154340-be6161a56a0c',
  'photo-1600210492493-0946911123ea',
  'photo-1600607688969-a5bfcd646154',
  'photo-1618221195710-dd6b41faaea6',
  'photo-1631679706909-1844bbd07221',
  'photo-1617806118233-18e1de247200',
  'photo-1598928506311-c55ded91a20c',
  'photo-1583847268964-b28dc8f51f92',
]

function getFloorPlanImage(residenceId: string) {
  const hash = residenceId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const photoId = FLOOR_PLAN_PHOTOS[hash % FLOOR_PLAN_PHOTOS.length]
  return `https://images.unsplash.com/${photoId}?w=700&h=420&fit=crop&q=80`
}


const FACILITY_ICONS: Record<string, LucideIcon> = {
  'Elevator': ArrowUpDown,
  'Security': Shield,
  'Parking': Car,
  'Pool': Waves,
  'Gym': Dumbbell,
  'Generator': Zap,
  'Garden': Trees,
}

const residenceStatus = {
  ACTIVE: { label: 'Actif', variant: 'success' as const },
  MAINTENANCE: { label: 'Travaux', variant: 'warning' as const },
  INACTIVE: { label: 'Inactif', variant: 'secondary' as const },
}

const aptStatus = {
  OCCUPIED: { label: 'Occupé', variant: 'success' as const },
  VACANT: { label: 'Vacant', variant: 'secondary' as const },
  MAINTENANCE: { label: 'Travaux', variant: 'warning' as const },
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
  const extra = owners.length - MAX_VISIBLE

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

/* ── NavBar - shared inner navigation for deep modal levels ── */
function NavBar({
  onBack, crumbs, onManage, onClose,
}: {
  onBack: () => void
  crumbs: { label: string; onClick?: () => void }[]
  onManage: () => void
  onClose: () => void
}) {
  return (
    <div className="flex items-center gap-0 h-11 border-b bg-muted/20 shrink-0">
      {/* Back button */}
      <button
        onClick={onBack}
        className="group flex items-center gap-2 h-full px-4 border-r border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
      >
        <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-xs font-medium">Back</span>
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 px-4 flex-1 min-w-0 overflow-hidden">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <span className="text-muted-foreground/30 text-sm shrink-0">/</span>}
            {c.onClick ? (
              <button
                onClick={c.onClick}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-[140px]"
              >
                {c.label}
              </button>
            ) : (
              <span className="text-xs font-semibold text-foreground truncate max-w-[160px]">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Manage + Close */}
      <div className="flex items-center gap-1.5 pr-3 shrink-0">
        <button
          onClick={onManage}
          className="flex items-center gap-1.5 h-7 px-3.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          Manage <ArrowRight size={12} />
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center h-7 w-7 rounded-lg border border-border/60 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

/* ── StickyTickets - tabs that stick to the right edge of the modal ── */
function StickyTickets({
  buildings,
  currentBuildingId,
  buildingApts,
  currentAptId,
  onSelectBuilding,
  onSelectApt,
}: {
  buildings: { id: string; name: string }[]
  currentBuildingId: string
  buildingApts: { id: string; unitCode: string; status: 'OCCUPIED' | 'VACANT' | 'MAINTENANCE' }[]
  currentAptId?: string
  onSelectBuilding: (id: string) => void
  onSelectApt: (id: string) => void
}) {
  const statusDot: Record<string, string> = {
    OCCUPIED: 'bg-emerald-500',
    VACANT: 'bg-slate-300',
    MAINTENANCE: 'bg-amber-400',
  }

  return (
    <div className="absolute right-3 top-14 flex flex-col items-end gap-1 z-20 pointer-events-none">

      {/* Building tickets */}
      {buildings.map(b => {
        const isActive = b.id === currentBuildingId
        return (
          <button
            key={b.id}
            onClick={() => onSelectBuilding(b.id)}
            title={b.name}
            className={cn(
              'pointer-events-auto flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold transition-all shadow-lg ring-1',
              isActive
                ? 'bg-primary text-white ring-primary/30'
                : 'bg-background ring-border text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <span className="truncate max-w-[80px]">{b.name}</span>
            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />}
          </button>
        )
      })}

      {/* Divider between buildings + apartments */}
      {currentAptId && buildingApts.length > 0 && (
        <div className="w-16 h-px bg-border/60 mr-0 my-0.5" />
      )}

      {/* Apartment tickets */}
      {currentAptId && buildingApts.map(apt => {
        const isActive = apt.id === currentAptId
        return (
          <button
            key={apt.id}
            onClick={() => onSelectApt(apt.id)}
            title={apt.unitCode}
            className={cn(
              'pointer-events-auto flex items-center gap-1.5 h-6 px-2.5 rounded-lg text-[10px] font-medium transition-all shadow-md ring-1',
              isActive
                ? 'bg-primary text-white ring-primary/30'
                : 'bg-background ring-border text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? 'bg-white/70' : statusDot[apt.status])} />
            <span>{apt.unitCode}</span>
          </button>
        )
      })}
    </div>
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

  const buildings = mockBuildings.filter(b => b.residenceId === residence.id)
  const apartments = mockApartments.filter(a => a.residenceId === residence.id)
  const occupied = apartments.filter(a => a.status === 'OCCUPIED').length
  const vacant = apartments.filter(a => a.status === 'VACANT').length
  const isStandalone = buildings.length === 1 && buildings[0]?.unionType === 'IMMEUBLE'

  const activeBuilding = nav.level !== 'overview'
    ? buildings.find(b => b.id === nav.buildingId) ?? null
    : null
  const buildingApts = activeBuilding ? getApartmentsByBuilding(activeBuilding.id) : []
  const activeApt = nav.level === 'apartment'
    ? buildingApts.find(a => a.id === nav.aptId) ?? null
    : null
  const aptOwners = activeApt ? getOwnersByApartment(activeApt.id) : []

  const isOverview = nav.level === 'overview'

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="w-[92vw] max-w-7xl h-[88vh] overflow-hidden flex flex-col p-0" showClose={false}>
        <DialogTitle className="sr-only">{residence.name}</DialogTitle>

        {/* ══ BODY - switches layout based on nav level ══════════ */}
        <AnimatePresence mode="wait" initial={false}>

          {/* ── OVERVIEW: 2-col (left overview + right 3D) ──────── */}
          {isOverview && (
            <motion.div key="overview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-border"
            >
              {/* LEFT - residence overview */}
              <div className="flex flex-col overflow-hidden">

                {/* ── Hero image ── */}
                <div className="relative h-72 shrink-0 overflow-hidden">
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

                  {/* Manage button - top-right of hero acts as primary action */}
                  <button
                    onClick={() => { handleClose(); onManage(residence) }}
                    className="absolute top-4 right-4 hidden"
                  />
                </div>

                {/* ── Stats row ── */}
                <div className="flex shrink-0 border-b">
                  {[
                    { label: 'Units', value: apartments.length, color: 'text-violet-600' },
                    { label: 'Occupied', value: occupied, color: 'text-emerald-600' },
                    { label: 'Vacant', value: vacant, color: 'text-slate-400' },
                    { label: 'Owners', value: mockOwners.filter(o => apartments.some(a => a.id === o.apartmentId)).length, color: 'text-blue-600' },
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
                  <div className="flex items-center px-5 pt-4 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      Buildings
                    </p>
                  </div>

                  <div className="px-4 pb-4 space-y-2.5">
                    {buildings.map((b, idx) => {
                      const bApts = getApartmentsByBuilding(b.id)
                      const bOccupied = bApts.filter(a => a.status === 'OCCUPIED').length
                      const bVacant = bApts.filter(a => a.status === 'VACANT').length
                      const pct = bApts.length > 0 ? Math.round((bOccupied / bApts.length) * 100) : 0
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
                              {b.hasElevator && <span className="text-[9px] bg-blue-50   text-blue-600   px-2 py-0.5 rounded-full font-medium border border-blue-100">Elevator</span>}
                              {b.hasGarage && <span className="text-[9px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium border border-violet-100">Parking</span>}
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

              {/* RIGHT - coming soon */}
              <div className="relative flex flex-col items-center justify-center gap-3 bg-muted/30 select-none">
                {/* close + manage row */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={() => { handleClose(); onManage(residence) }}
                    className="flex items-center gap-1.5 h-7 px-3.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Manage <ArrowRight size={12} />
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex items-center justify-center h-7 w-7 rounded-lg border border-border/60 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
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

          {/* ── BUILDING DETAIL: full width ──────────────────────── */}
          {nav.level === 'building' && activeBuilding && (
            <motion.div key="building"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="flex-1 overflow-hidden flex flex-col relative"
            >
              {/* ── inner nav ── */}
              <NavBar
                onBack={() => setNav({ level: 'overview' })}
                crumbs={[
                  { label: residence.name, onClick: () => setNav({ level: 'overview' }) },
                  { label: activeBuilding.name },
                ]}
                onManage={() => { handleClose(); onManage(residence) }}
                onClose={handleClose}
              />

              {/* body */}
              <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-border">
                {/* LEFT - building info */}
                <div className="flex flex-col overflow-y-auto">

                  {/* Mini hero */}
                  <div className="relative h-36 shrink-0 overflow-hidden">
                    <img
                      src={activeBuilding.image ?? residence.image ?? DEFAULT_IMG}
                      alt={activeBuilding.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                      <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.15em] mb-0.5">
                        {activeBuilding.unionType === 'IMMEUBLE' ? 'Standalone Building' : 'Part of Complex'}
                      </p>
                      <h3 className="text-lg font-extrabold text-white leading-tight">{activeBuilding.name}</h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">

                    {/* Key metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Floors', value: activeBuilding.numberOfFloors ?? '-', color: 'text-blue-600' },
                        { label: 'Total Units', value: activeBuilding.totalUnits ?? '-', color: 'text-violet-600' },
                        { label: 'Apartments', value: buildingApts.length, color: 'text-emerald-600' },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center py-3.5 rounded-xl bg-muted/40">
                          <span className={`text-2xl font-extrabold tabular-nums leading-none ${s.color}`}>{s.value}</span>
                          <span className="text-[10px] text-muted-foreground mt-1.5">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Occupancy breakdown */}
                    {(() => {
                      const occ = buildingApts.filter(a => a.status === 'OCCUPIED').length
                      const vac = buildingApts.filter(a => a.status === 'VACANT').length
                      const mnt = buildingApts.filter(a => a.status === 'MAINTENANCE').length
                      const tot = buildingApts.length || 1
                      const pct = Math.round((occ / tot) * 100)
                      return (
                        <div className="rounded-xl border border-border/60 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Occupancy</p>
                            <span className="text-xs font-bold text-emerald-600">{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
                            <div className="bg-emerald-500 rounded-full transition-all" style={{ width: `${(occ / tot) * 100}%` }} />
                            <div className="bg-amber-400 rounded-full transition-all" style={{ width: `${(mnt / tot) * 100}%` }} />
                            <div className="bg-slate-200 rounded-full transition-all flex-1" />
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />Occupied <strong className="text-foreground">{occ}</strong></span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />Maintenance <strong className="text-foreground">{mnt}</strong></span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />Vacant <strong className="text-foreground">{vac}</strong></span>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Details */}
                    <div className="rounded-xl border border-border/60 divide-y divide-border/50">
                      {[
                        { label: 'Plan Number', value: activeBuilding.propertyPlanNumber },
                        { label: 'Address', value: activeBuilding.address },
                        { label: 'Shared Deed', value: activeBuilding.sharedWithTitleDeed },
                        { label: 'Created', value: new Date(activeBuilding.createdAt).toLocaleDateString('en-GB') },
                        { label: 'Last Updated', value: new Date(activeBuilding.updatedAt).toLocaleDateString('en-GB') },
                      ].filter(r => r.value != null && r.value !== '').map(r => (
                        <div key={r.label} className="flex items-center justify-between px-4 py-3">
                          <span className="text-xs text-muted-foreground">{r.label}</span>
                          <span className="text-xs font-semibold truncate max-w-[55%] text-right">{r.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Amenities + Shared Parts */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Amenities</p>
                        {/* Shared parts status - right side, scalable for future building ref */}
                        {activeBuilding.hasSharedParts ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                            <span className="text-[10px] font-semibold text-teal-700">Shared Parts</span>
                            {activeBuilding.sharedWithTitleDeed && (
                              <span className="text-[10px] font-mono text-teal-600 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
                                {activeBuilding.sharedWithTitleDeed}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span className="text-[10px] text-muted-foreground/50">Independent</span>
                          </div>
                        )}
                      </div>
                      {(activeBuilding.hasElevator || activeBuilding.hasGarage) ? (
                        <div className="flex flex-wrap gap-1.5">
                          {activeBuilding.hasElevator && <span className="text-[11px] bg-blue-50   text-blue-700   px-3 py-1.5 rounded-xl font-medium border border-blue-100">Elevator</span>}
                          {activeBuilding.hasGarage && <span className="text-[11px] bg-violet-50 text-violet-700 px-3 py-1.5 rounded-xl font-medium border border-violet-100">Parking</span>}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40 italic">No amenities listed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT - apartments in this building */}
                <div className="flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Apartments</p>
                      <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center tabular-nums">
                        {buildingApts.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* quick status pills */}
                      {(() => {
                        const occ = buildingApts.filter(a => a.status === 'OCCUPIED').length
                        const vac = buildingApts.filter(a => a.status === 'VACANT').length
                        const mnt = buildingApts.filter(a => a.status === 'MAINTENANCE').length
                        return (
                          <div className="flex items-center gap-1.5">
                            {occ > 0 && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{occ} occ.</span>}
                            {vac > 0 && <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">{vac} vac.</span>}
                            {mnt > 0 && <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{mnt} mnt.</span>}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* List - grouped by floor */}
                  <div className="flex-1 overflow-y-auto">
                    {buildingApts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/30">
                        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                          <Home size={26} strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">No apartments yet</p>
                          <p className="text-xs mt-0.5">Add the first unit to this building</p>
                        </div>
                        <p className="text-xs text-muted-foreground/40">Click Manage to add apartments</p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {(() => {
                          // group by floor, nulls at end
                          const byFloor = new Map<number | null, typeof buildingApts>()
                          buildingApts.forEach(apt => {
                            const f = apt.floor ?? null
                            if (!byFloor.has(f)) byFloor.set(f, [])
                            byFloor.get(f)!.push(apt)
                          })
                          const sorted = [...byFloor.entries()].sort(([a], [b]) => {
                            if (a === null) return 1
                            if (b === null) return -1
                            return a - b
                          })
                          return sorted.map(([floor, apts]) => (
                            <div key={floor ?? 'no-floor'}>
                              {/* Floor label */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-5 w-5 rounded-md bg-muted border border-border/60 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                                  {floor ?? '?'}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                  Floor {floor ?? '-'}
                                </span>
                                <div className="flex-1 h-px bg-border/40" />
                                <span className="text-[10px] text-muted-foreground/40">{apts.length} unit{apts.length !== 1 ? 's' : ''}</span>
                              </div>

                              {/* Apartment cards */}
                              <div className="space-y-1.5 pl-1">
                                {apts.map(apt => {
                                  const owners = getOwnersByApartment(apt.id)
                                  const statusColors = {
                                    OCCUPIED: { bar: 'bg-emerald-500', dot: 'bg-emerald-500', ring: 'border-emerald-200 hover:border-emerald-400' },
                                    VACANT: { bar: 'bg-slate-300', dot: 'bg-slate-400', ring: 'border-border/60 hover:border-slate-400' },
                                    MAINTENANCE: { bar: 'bg-amber-400', dot: 'bg-amber-400', ring: 'border-amber-200 hover:border-amber-400' },
                                  }
                                  const sc = statusColors[apt.status]
                                  return (
                                    <button
                                      key={apt.id}
                                      onClick={() => setNav({ level: 'apartment', buildingId: activeBuilding.id, aptId: apt.id })}
                                      className={cn(
                                        'w-full text-left rounded-xl border bg-card transition-all group overflow-hidden',
                                        sc.ring,
                                      )}
                                    >
                                      {/* status bar top */}
                                      <div className={cn('h-0.5 w-full', sc.bar)} />

                                      {/* ── TOP: apartment info ── */}
                                      <div className="px-3.5 pt-3 pb-2.5">
                                        {/* unit code + status */}
                                        <div className="flex items-center justify-between mb-2.5">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-extrabold tracking-tight">{apt.unitCode}</span>
                                            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', sc.dot)} />
                                            <span className="text-[11px] font-medium text-muted-foreground">{aptStatus[apt.status].label}</span>
                                          </div>
                                          <Badge variant={aptStatus[apt.status].variant} className="text-[9px] px-1.5 py-0">
                                            {apt.usageType === 'RESIDENTIAL' ? 'Residential' : apt.usageType === 'COMMERCIAL' ? 'Commercial' : 'Mixed'}
                                          </Badge>
                                        </div>

                                        {/* info grid */}
                                        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                                          <div className="flex flex-col bg-muted/40 rounded-lg px-2.5 py-2">
                                            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide leading-none mb-0.5">Area</span>
                                            <span className="text-xs font-bold text-foreground">{apt.areaSqm ? `${apt.areaSqm} m²` : '-'}</span>
                                          </div>
                                          <div className="flex flex-col bg-muted/40 rounded-lg px-2.5 py-2">
                                            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide leading-none mb-0.5">Floor</span>
                                            <span className="text-xs font-bold text-foreground">{apt.floor ?? '-'}</span>
                                          </div>
                                          <div className="flex flex-col bg-muted/40 rounded-lg px-2.5 py-2">
                                            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide leading-none mb-0.5">Share</span>
                                            <span className="text-xs font-bold text-foreground">{apt.percentageOfApartment != null ? `${apt.percentageOfApartment}%` : '-'}</span>
                                          </div>
                                        </div>

                                        {/* plot + residence share */}
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                          <span className="font-mono">{apt.mainPlotNumber}</span>
                                          {apt.percentageOfResidence != null && (
                                            <span className="text-muted-foreground/60">Residence {apt.percentageOfResidence}%</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* ── FOOTER: owners + navigate ── */}
                                      <div className="flex items-center justify-between px-3.5 py-2 border-t border-border/40 bg-muted/20">
                                        {owners.length > 0 ? (
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <div className="flex -space-x-1.5 shrink-0">
                                              {owners.slice(0, 3).map(o => (
                                                <img key={o.id} src={ownerAvatar(o.gender, o.profileImage)}
                                                  style={{ height: 20, width: 20 }}
                                                  className="rounded-full border-2 border-white object-cover" alt="" />
                                              ))}
                                              {owners.length > 3 && (
                                                <div style={{ height: 20, width: 20 }} className="rounded-full border-2 border-white bg-muted flex items-center justify-center">
                                                  <span className="text-[8px] font-semibold text-muted-foreground">+{owners.length - 3}</span>
                                                </div>
                                              )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground truncate">
                                              {owners.map(o => o.firstName).join(', ')}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground/40 italic">No owner assigned</span>
                                        )}
                                        <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 group-hover:bg-primary transition-colors shrink-0 ml-2">
                                          <ChevronRight size={12} className="text-primary group-hover:text-white transition-colors" />
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
                </div>{/* end RIGHT col */}
              </div>{/* end body */}

              {/* Sticky tickets - outside the modal right edge */}
              <StickyTickets
                buildings={buildings}
                currentBuildingId={activeBuilding.id}
                buildingApts={buildingApts}
                onSelectBuilding={id => setNav({ level: 'building', buildingId: id })}
                onSelectApt={() => { }}
              />
            </motion.div>
          )}

          {/* ── APARTMENT DETAIL: full width ─────────────────────── */}
          {nav.level === 'apartment' && activeApt && (
            <motion.div key="apartment"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="flex-1 overflow-hidden flex flex-col relative"
            >
              {/* ── inner nav ── */}
              <NavBar
                onBack={() => setNav({ level: 'building', buildingId: nav.buildingId })}
                crumbs={[
                  { label: residence.name, onClick: () => setNav({ level: 'overview' }) },
                  { label: activeBuilding?.name ?? '…', onClick: () => setNav({ level: 'building', buildingId: nav.buildingId }) },
                  { label: activeApt.unitCode },
                ]}
                onManage={() => { handleClose(); onManage(residence) }}
                onClose={handleClose}
              />

              {/* body */}
              <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-border">

                {/* LEFT - apartment info + floor plan image */}
                <div className="flex flex-col overflow-y-auto">

                  {/* Floor plan image */}
                  <div className="relative shrink-0 overflow-hidden bg-muted/30" style={{ height: 220 }}>
                    <img
                      src={getFloorPlanImage(residence.id)}
                      alt="Floor plan"
                      className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                    {/* subtle overlay just for the bottom label */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <span className="text-white text-xs font-semibold drop-shadow">Floor plan · {activeApt.unitCode}</span>
                      <Badge variant={aptStatus[activeApt.status].variant} className="text-[9px]">
                        {aptStatus[activeApt.status].label}
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-4">
                    {/* Identity */}
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-extrabold text-primary shrink-0">
                        {activeApt.floor ?? '-'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold">{activeApt.unitCode}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{activeBuilding?.name} · {residence.name}</p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Floor', value: activeApt.floor ?? '-', color: 'text-blue-600' },
                        { label: 'Area', value: activeApt.areaSqm ? `${activeApt.areaSqm}m²` : '-', color: 'text-violet-600' },
                        { label: 'Usage', value: activeApt.usageType === 'RESIDENTIAL' ? 'Res.' : activeApt.usageType === 'COMMERCIAL' ? 'Com.' : 'Mix', color: 'text-emerald-600' },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center py-3 rounded-xl bg-muted/40">
                          <span className={`text-lg font-extrabold tabular-nums leading-none ${s.color}`}>{s.value}</span>
                          <span className="text-[10px] text-muted-foreground mt-1">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Details list */}
                    <div className="rounded-xl border border-border/60 divide-y divide-border/50">
                      {[
                        { label: 'Main Plot', value: activeApt.mainPlotNumber },
                        { label: 'Bldg Share', value: activeApt.percentageOfApartment != null ? `${activeApt.percentageOfApartment}%` : undefined },
                        { label: 'Res. Share', value: activeApt.percentageOfResidence != null ? `${activeApt.percentageOfResidence}%` : undefined },
                        { label: 'Created', value: new Date(activeApt.createdAt).toLocaleDateString('en-GB') },
                      ].filter(r => r.value != null).map(r => (
                        <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-muted-foreground">{r.label}</span>
                          <span className="text-xs font-semibold font-mono">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT - owners (view only) */}
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Owners</p>
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                      {aptOwners.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {aptOwners.length > 0 ? aptOwners.map(o => (
                      <div key={o.id} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                        {/* Owner header */}
                        <div className="flex items-center gap-3 p-4">
                          <img
                            src={ownerAvatar(o.gender, o.profileImage)}
                            className="h-12 w-12 rounded-full border-2 border-white object-cover shrink-0 shadow-sm"
                            alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold">{o.firstName} {o.lastName}</span>
                              {o.isRepresentative && (
                                <Badge variant="info" className="text-[9px] px-1.5 py-0 shrink-0">Rep</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                              {o.gender === 'MALE' ? 'Male' : 'Female'} owner
                            </p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="border-t border-border/40 divide-y divide-border/30">
                          {o.phone && (
                            <div className="flex items-center gap-2.5 px-4 py-2.5">
                              <Phone size={11} className="text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground">{o.phone}</span>
                            </div>
                          )}
                          {o.nationalId && (
                            <div className="flex items-center gap-2.5 px-4 py-2.5">
                              <CreditCard size={11} className="text-muted-foreground shrink-0" />
                              <span className="text-xs font-mono text-muted-foreground">{o.nationalId}</span>
                            </div>
                          )}
                          {activeApt.percentageOfApartment != null && (
                            <div className="flex items-center gap-2.5 px-4 py-2.5">
                              <Hash size={11} className="text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground">{activeApt.percentageOfApartment}% building share</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/30 py-16">
                        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                          <Users size={26} strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">No owners yet</p>
                          <p className="text-xs mt-0.5">Click Manage to assign an owner</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>{/* end RIGHT col */}
              </div>{/* end body */}

              {/* Sticky tickets - outside the modal right edge */}
              <StickyTickets
                buildings={buildings}
                currentBuildingId={nav.buildingId}
                buildingApts={buildingApts}
                currentAptId={activeApt.id}
                onSelectBuilding={id => setNav({ level: 'building', buildingId: id })}
                onSelectApt={id => setNav({ level: 'apartment', buildingId: nav.buildingId, aptId: id })}
              />
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
  const [view, setView] = useState<View>('residences')
  const [selectedResidence, setSelectedResidence] = useState<Residence | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [expandedApt, setExpandedApt] = useState<string | null>(null)
  const [modalResidence, setModalResidence] = useState<Residence | null>(null)

  /* ── navigation helpers ── */
  const drillToBuildings = (r: Residence) => { setSelectedResidence(r); setSelectedBuilding(null); setView('buildings') }
  const openModal = (r: Residence) => setModalResidence(r)
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
  const totalUnits = mockApartments.length
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
      const apts = getApartmentsByBuilding(selectedBuilding.id)
      const occ = apts.filter(a => a.status === 'OCCUPIED').length
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
              const buildings = mockBuildings.filter(b => b.residenceId === r.id)
              const apartments = mockApartments.filter(a => a.residenceId === r.id)
              const occupied = apartments.filter(a => a.status === 'OCCUPIED').length
              const isStandalone = buildings.length === 1 && buildings[0]?.unionType === 'IMMEUBLE'
              const resOwners = mockOwners.filter(o => apartments.some(a => a.id === o.apartmentId))

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
                        { value: buildings.length, label: 'Buildings', Icon: Building2 },
                        { value: apartments.length, label: 'Units', Icon: Home },
                        { value: occupied, label: 'Occupied', Icon: Users },
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
                const occupied = apartments.filter(a => a.status === 'OCCUPIED').length
                const bldOwners = mockOwners.filter(o => apartments.some(a => a.id === o.apartmentId))

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
                          { value: b.numberOfFloors ?? '-', label: 'Étages' },
                          { value: apartments.length, label: 'Unités' },
                          { value: occupied, label: 'Occupés' },
                        ].map(s => (
                          <div key={s.label} className="text-center p-1.5 rounded-lg bg-muted/50">
                            <p className="text-sm font-bold">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground mb-3">
                        {b.hasElevator && <span className="bg-muted px-1.5 py-0.5 rounded">Elevator</span>}
                        {b.hasGarage && <span className="bg-muted px-1.5 py-0.5 rounded">Garage</span>}
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
                  const owners = getOwnersByApartment(apt.id)
                  const rep = owners.find(o => o.isRepresentative)
                  const repName = rep ? `${rep.firstName} ${rep.lastName}` : null
                  const repAvatar = rep?.profileImage ?? (rep?.gender === 'FEMALE' ? FEMALE_AVATAR : MALE_AVATAR)
                  const isOpen = expandedApt === apt.id

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
                        <td className="px-4 py-3 text-sm text-muted-foreground">{apt.floor ?? '-'}</td>
                        <td className="px-4 py-3 text-sm">{apt.areaSqm ? `${apt.areaSqm} m²` : '-'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {apt.usageType === 'RESIDENTIAL' ? 'Résidentiel' : apt.usageType === 'COMMERCIAL' ? 'Commercial' : 'Mixte'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{apt.percentageOfApartment ?? '-'}%</td>
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
                            <span className="text-xs text-muted-foreground">-</span>
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
                                Propriétaires - {apt.unitCode}
                              </p>
                              <div className="flex flex-wrap gap-3">
                                {owners.map(o => {
                                  const name = `${o.firstName} ${o.lastName}`
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
                                        <p className="text-[11px] text-muted-foreground">{o.phone ?? '-'}</p>
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
