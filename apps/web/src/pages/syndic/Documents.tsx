import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { TopBar } from '@/components/layout/TopBar'
import {
  ChevronRight, Download, FileText,
  Home, Building2, Users, MapPin, Scale,
  Upload, Folder, Settings2, FolderPlus, FolderInput,
  Check, X, Plus, Eye,
} from 'lucide-react'
import { mockDocuments, type MockDocument } from '@/data/mock/documents'
import { mockResidences } from '@/data/mock/residences'
import { mockBuildings }  from '@/data/mock/buildings'
import { mockApartments } from '@/data/mock/apartments'
import { mockOwners }     from '@/data/mock/owners'

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryKey = 'residences' | 'buildings' | 'apartments' | 'owners' | 'law'

interface AccentConfig {
  tab:       string   // default tab bg (dark, matches folder)
  tabHover:  string   // tab bg on hover (matches lighter top section)
  from:      string
  to:        string
  glow:      string
  innerFrom: string
  innerTo:   string
}

interface CategoryConfig {
  key:         CategoryKey
  label:       string
  icon:        React.ElementType
  accent:      AccentConfig
  docCategory: MockDocument['category']
  entities:    { id: string; name: string; sub?: string }[]
}

interface VirtualFolder {
  id:       string
  name:     string
  parentId: string
  entityId: string
  catKey:   CategoryKey
}

interface NavItem {
  id:      string
  label:   string
  type:    'home' | 'category' | 'entity' | 'folder'
  catKey?: CategoryKey
}

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'residences', label: 'Residences', icon: MapPin,
    accent: { tab: 'bg-blue-600', tabHover: 'group-hover:bg-blue-300', from: 'from-blue-500', to: 'to-indigo-700', glow: 'hover:shadow-blue-500/30', innerFrom: 'from-blue-300', innerTo: 'to-indigo-400' },
    docCategory: 'residence',
    entities: mockResidences.map(r => ({ id: r.id, name: r.name, sub: r.city })),
  },
  {
    key: 'buildings', label: 'Buildings', icon: Building2,
    accent: { tab: 'bg-amber-500', tabHover: 'group-hover:bg-amber-200', from: 'from-amber-400', to: 'to-orange-600', glow: 'hover:shadow-amber-500/30', innerFrom: 'from-amber-200', innerTo: 'to-orange-300' },
    docCategory: 'building',
    entities: mockBuildings.map(b => ({
      id: b.id, name: b.name,
      sub: mockResidences.find(r => r.id === b.residenceId)?.name,
    })),
  },
  {
    key: 'apartments', label: 'Apartments', icon: Home,
    accent: { tab: 'bg-emerald-600', tabHover: 'group-hover:bg-emerald-200', from: 'from-emerald-400', to: 'to-teal-600', glow: 'hover:shadow-emerald-500/30', innerFrom: 'from-emerald-200', innerTo: 'to-teal-300' },
    docCategory: 'apartment',
    entities: mockApartments.map(a => ({ id: a.id, name: a.unitCode, sub: `Floor ${a.floor} · ${a.areaSqm} m²` })),
  },
  {
    key: 'owners', label: 'Owners', icon: Users,
    accent: { tab: 'bg-violet-600', tabHover: 'group-hover:bg-violet-300', from: 'from-violet-500', to: 'to-purple-700', glow: 'hover:shadow-violet-500/30', innerFrom: 'from-violet-300', innerTo: 'to-purple-400' },
    docCategory: 'owner',
    entities: mockOwners.map(o => ({
      id: o.id,
      name: `${o.firstName} ${o.lastName}`,
      sub: mockApartments.find(a => a.id === o.apartmentId)?.unitCode,
    })),
  },
  {
    key: 'law', label: 'Law & Regulations', icon: Scale,
    accent: { tab: 'bg-rose-600', tabHover: 'group-hover:bg-rose-300', from: 'from-rose-500', to: 'to-red-700', glow: 'hover:shadow-rose-500/30', innerFrom: 'from-rose-300', innerTo: 'to-red-400' },
    docCategory: 'law',
    entities: [],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const CUSTOM_ACCENT: AccentConfig = {
  tab: 'bg-slate-500', tabHover: 'group-hover:bg-slate-300', from: 'from-slate-500', to: 'to-slate-700', glow: 'hover:shadow-slate-400/20',
  innerFrom: 'from-slate-300', innerTo: 'to-slate-400',
}

const TYPE_STYLE: Record<string, { pill: string; lineA: string; lineB: string }> = {
  PDF:  { pill: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',                     lineA: 'bg-red-100 dark:bg-red-900/20',        lineB: 'bg-slate-100 dark:bg-slate-800' },
  DOCX: { pill: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',                 lineA: 'bg-blue-100 dark:bg-blue-900/20',       lineB: 'bg-slate-100 dark:bg-slate-800' },
  XLSX: { pill: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',     lineA: 'bg-emerald-100 dark:bg-emerald-900/20', lineB: 'bg-slate-100 dark:bg-slate-800' },
  IMG:  { pill: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',             lineA: 'bg-amber-100 dark:bg-amber-900/20',     lineB: 'bg-slate-100 dark:bg-slate-800' },
}

// ─── Folder Card ──────────────────────────────────────────────────────────────

function FolderCard({ label, count, accent, onClick, small = false }: {
  label:   string
  count:   string
  accent:  AccentConfig
  onClick: () => void
  small?:  boolean
}) {
  const bodyH  = small ? 'min-h-[160px]' : 'min-h-[200px]'
  const tabH   = small ? 18 : 22
  const notchR = small ? 14 : 18

  return (
    <button onClick={onClick} className="group relative text-left w-full focus:outline-none">
      {/* Whole card lifts on hover */}
      <div className="relative transition-transform duration-200 ease-out group-hover:-translate-y-1.5"
           style={{ paddingTop: tabH }}>

        {/* Tab — flush left, classic folder shape */}
        <div
          className={`absolute left-0 w-[40%] ${accent.tab} rounded-tl-2xl rounded-tr-xl z-10`}
          style={{ top: 0, height: tabH }}
        />

        {/* Concave notch — cuts into the tab's right edge */}
        <div
          className="absolute z-20 bg-background"
          style={{
            top: 0, left: '40%',
            width: notchR, height: tabH,
            borderRadius: `0 0 0 ${notchR}px`,
          }}
        />

        {/* Folder body */}
        <div className={cn(
          'relative overflow-hidden rounded-tr-2xl rounded-b-2xl',
          bodyH,
          `bg-gradient-to-br ${accent.from} ${accent.to}`,
          'shadow-lg group-hover:shadow-2xl',
          accent.glow,
          'transition-shadow duration-200',
        )}>
          {/* ── Top section — extends past 47% so it fills the triangle behind dark section's rounded corners ── */}
          <div className={cn(
            'absolute inset-x-0 top-0 h-[53%] pointer-events-none z-10',
            accent.tab,
          )}>
            {/* White file card — rises slightly on hover */}
            <div className={cn(
              'absolute left-3 right-3 top-2.5 bottom-2.5 bg-white rounded-xl shadow-md',
              'transition-transform duration-200 ease-out',
              'group-hover:-translate-y-1 group-hover:shadow-lg',
            )}>
              <div className={cn('px-3 pt-2.5 pb-2 space-y-1.5', small && 'px-2.5 pt-2 pb-1.5')}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] text-slate-300 font-bold">···</span>
                </div>
                <div className="h-[3.5px] bg-slate-200 rounded-full w-4/5" />
                {[90, 65, 80, 50, 72].map((w, i) => (
                  <div key={i} className="h-[2.5px] bg-slate-100 rounded-full" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Dark bottom section — gradient top→bottom (lighter near top, darker at bottom) ── */}
          <div className={cn(
            'absolute inset-x-0 bottom-0 z-20',
            `bg-gradient-to-b ${accent.from} ${accent.to}`,
            'rounded-tl-2xl rounded-tr-2xl',
          )} style={{ top: '47%' }}>
            {/* Label + count inside the dark section */}
            <div className="absolute left-4 bottom-4">
              <p className={cn('text-white font-bold leading-tight', small ? 'text-[11px]' : 'text-sm')}>{label}</p>
              <p className="text-white/60 text-[10px] mt-0.5">{count}</p>
            </div>
            {/* Icons */}
            <div className="absolute right-4 bottom-4 flex items-center gap-2 opacity-50">
              <Folder    size={small ? 12 : 13} className="text-white" />
              <Settings2 size={small ? 12 : 13} className="text-white" />
            </div>
          </div>

          <ChevronRight size={12} className="absolute right-4 bottom-4 z-30 text-white/40 group-hover:text-white/80 transition-colors" />
        </div>
      </div>
    </button>
  )
}

// ─── Add Folder Ghost Card ────────────────────────────────────────────────────
// Always shown at end of every folder grid — click to create

function AddFolderCard({ accent, onActivate, small = false }: {
  accent:     AccentConfig
  onActivate: () => void
  small?:     boolean
}) {
  const bodyH = small ? 'min-h-[175px]' : 'min-h-[215px]'
  const tabH  = small ? 16 : 20
  return (
    <button onClick={onActivate} className="group relative text-left w-full focus:outline-none"
            style={{ paddingTop: tabH }}>
      <div className={`absolute top-0 left-0 w-[38%] ${accent.tab} rounded-tl-2xl rounded-tr-xl opacity-30 group-hover:opacity-60 transition-opacity`}
           style={{ height: tabH }} />
      <div className={cn(
        'relative rounded-tr-2xl rounded-b-2xl overflow-hidden flex flex-col items-center justify-center gap-2',
        bodyH,
        'border-2 border-dashed border-muted-foreground/20 group-hover:border-muted-foreground/40',
        'bg-muted/30 group-hover:bg-muted/50',
        'transition-all duration-200',
      )}>
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-muted-foreground/10 transition-colors">
          <Plus size={18} className="text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors" />
        </div>
        <p className={cn('text-muted-foreground/50 group-hover:text-muted-foreground/70 font-medium transition-colors', small ? 'text-[11px]' : 'text-xs')}>
          New Folder
        </p>
      </div>
    </button>
  )
}

// ─── Create Folder Inline Card ────────────────────────────────────────────────

function CreateFolderCard({ accent, onConfirm, onCancel, small = false }: {
  accent:    AccentConfig
  onConfirm: (name: string) => void
  onCancel:  () => void
  small?:    boolean
}) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const bodyH = small ? 'min-h-[175px]' : 'min-h-[215px]'
  const pt    = small ? 'pt-[10px]'     : 'pt-[13px]'

  return (
    <div className={cn('relative', pt)}>
      <div className={`absolute top-0 left-0 ${small ? 'h-[16px]' : 'h-[20px]'} w-[38%] ${accent.tab} rounded-tl-2xl rounded-tr-xl opacity-60`} />
      <div className={cn(
        'relative rounded-2xl overflow-hidden flex flex-col justify-end p-4 gap-2.5',
        bodyH,
        `bg-gradient-to-br ${accent.from} ${accent.to}`,
      )}>
        <div className="absolute inset-0 border-2 border-dashed border-white/25 rounded-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        <div className="relative">
          <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-2">New Folder</p>
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && name.trim()) onConfirm(name.trim())
              if (e.key === 'Escape') onCancel()
            }}
            placeholder="Folder name…"
            className="w-full bg-white/20 text-white placeholder:text-white/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:bg-white/30 transition-colors"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { if (name.trim()) onConfirm(name.trim()) }}
              className="flex-1 flex items-center justify-center gap-1 bg-white/25 hover:bg-white/35 text-white text-xs font-semibold rounded-lg py-1.5 transition-colors"
            >
              <Check size={11} /> Create
            </button>
            <button
              onClick={onCancel}
              className="w-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/60 rounded-lg transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Document Paper Card ──────────────────────────────────────────────────────

function DocPaperCard({ doc, moveTargets, movingThis, onMoveRequest, onMove, onMoveClose }: {
  doc:           MockDocument
  moveTargets:   VirtualFolder[]
  movingThis:    boolean
  onMoveRequest: (e: React.MouseEvent) => void
  onMove:        (folderId: string | null) => void
  onMoveClose:   () => void
}) {
  const ts = TYPE_STYLE[doc.type] ?? TYPE_STYLE.PDF

  return (
    <div className="group relative flex flex-col bg-white dark:bg-card border border-slate-100 dark:border-border rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Scrollable / variable-height content area */}
      <div className="flex-1 px-5 pt-6 pb-4">
        {/* Paper content lines */}
        <div className="space-y-2.5 mb-5">
          <div className={`h-[5px] ${ts.lineA} rounded-full w-4/5`} />
          {[100, 75, 90, 60, 85, 50].map((w, i) => (
            <div
              key={i}
              className={cn('rounded-full', i % 2 === 0 ? `h-[3px] ${ts.lineB}` : 'h-[3px] bg-slate-100 dark:bg-slate-800/60')}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        <div className="border-t border-slate-100 dark:border-border/60 pt-4">
          <div className="flex items-start gap-2 mb-2">
            <span className={cn('shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-lg', ts.pill)}>
              <FileText size={8} /> {doc.type}
            </span>
            <p className="text-xs font-semibold text-foreground leading-snug">{doc.name}</p>
          </div>
          {doc.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{doc.description}</p>
          )}
          <div className="mt-3">
            <p className="text-[10px] text-muted-foreground">{formatDate(doc.uploadedAt)}</p>
            <p className="text-[10px] text-muted-foreground/70">{formatSize(doc.size)}</p>
          </div>
        </div>
      </div>

      {/* ── Fixed footer — always at the bottom of every card ── */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-border/60 pt-3">
          {/* View */}
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 group/btn transition-colors"
            title="Preview"
          >
            <Eye size={15} className="text-blue-500 group-hover/btn:text-blue-600 transition-colors" />
            <span className="text-[11px] font-medium text-blue-500 group-hover/btn:text-blue-600 transition-colors">View</span>
          </button>

          <div className="w-px h-5 bg-slate-100 dark:bg-border/60" />

          {/* Move */}
          <button
            onClick={onMoveRequest}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/30 group/btn transition-colors"
            title="Move to folder"
          >
            <FolderInput size={15} className="text-violet-500 group-hover/btn:text-violet-600 transition-colors" />
            <span className="text-[11px] font-medium text-violet-500 group-hover/btn:text-violet-600 transition-colors">Move</span>
          </button>

          <div className="w-px h-5 bg-slate-100 dark:bg-border/60" />

          {/* Download */}
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 group/btn transition-colors"
            title="Download"
          >
            <Download size={15} className="text-emerald-500 group-hover/btn:text-emerald-600 transition-colors" />
            <span className="text-[11px] font-medium text-emerald-500 group-hover/btn:text-emerald-600 transition-colors">Download</span>
          </button>
        </div>
      </div>

      {/* Move-to dropdown */}
      {movingThis && (
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[200px]">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-3 pt-2.5 pb-1">Move to</p>
          <button onClick={() => onMove(null)} className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2 transition-colors">
            <Folder size={12} className="text-muted-foreground" /> Root folder
          </button>
          {moveTargets.length > 0 && <div className="mx-3 border-t border-border/50 my-1" />}
          {moveTargets.map(f => (
            <button key={f.id} onClick={() => onMove(f.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2 transition-colors">
              <Folder size={12} className="text-muted-foreground" /> {f.name}
            </button>
          ))}
          {moveTargets.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-muted-foreground">No sub-folders yet</p>
          )}
          <div className="p-2 pt-1">
            <button onClick={onMoveClose} className="w-full text-center text-[10px] text-muted-foreground py-1.5 rounded-xl hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Documents() {
  const [navStack, setNavStack]         = useState<NavItem[]>([{ id: 'home', label: 'Documents', type: 'home' }])
  const [userFolders, setUserFolders]   = useState<VirtualFolder[]>([])
  const [docLocations, setDocLocations] = useState<Record<string, string>>({})
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [movingDocId, setMovingDocId]   = useState<string | null>(null)

  const current    = navStack[navStack.length - 1]
  const currentCat = current.catKey ? CATEGORIES.find(c => c.key === current.catKey) : null
  const accent     = currentCat?.accent ?? CUSTOM_ACCENT

  const pushNav = (item: NavItem) => {
    setNavStack(prev => [...prev, item])
    setCreatingFolder(false)
    setMovingDocId(null)
  }

  const navToIndex = (index: number) => {
    setNavStack(prev => prev.slice(0, index + 1))
    setCreatingFolder(false)
    setMovingDocId(null)
  }

  const handleCatClick = (c: CategoryConfig) => {
    if (c.key === 'law') {
      pushNav({ id: 'global', label: 'Law & Regulations', type: 'entity', catKey: 'law' })
    } else {
      pushNav({ id: c.key, label: c.label, type: 'category', catKey: c.key })
    }
  }

  const currentSubFolders: VirtualFolder[] =
    current.type === 'entity' || current.type === 'folder'
      ? userFolders.filter(f => f.parentId === current.id)
      : []

  const currentDocs: MockDocument[] = (() => {
    if (current.type === 'entity' && currentCat) {
      return mockDocuments.filter(d =>
        d.category === currentCat.docCategory && d.linkedId === current.id && !docLocations[d.id],
      )
    }
    if (current.type === 'folder') {
      return mockDocuments.filter(d => docLocations[d.id] === current.id)
    }
    return []
  })()

  const entityItems = current.type === 'category' && currentCat
    ? currentCat.entities.map(e => {
        const docCount    = mockDocuments.filter(d => d.category === currentCat.docCategory && d.linkedId === e.id).length
        const folderCount = userFolders.filter(f => f.entityId === e.id).length
        return { ...e, docCount, folderCount }
      })
    : []

  const confirmCreateFolder = (name: string) => {
    const entityId =
      current.type === 'home'   ? 'home' :
      current.type === 'entity' ? current.id :
      userFolders.find(f => f.id === current.id)?.entityId ?? current.id
    const catKey = (current.catKey ?? currentCat?.key ?? 'custom') as CategoryKey

    setUserFolders(prev => [...prev, {
      id: `folder-${Date.now()}`, name, parentId: current.id, entityId, catKey,
    }])
    setCreatingFolder(false)
  }

  const moveDoc = (docId: string, folderId: string | null) => {
    setDocLocations(prev => {
      const next = { ...prev }
      if (folderId === null) delete next[docId]
      else next[docId] = folderId
      return next
    })
    setMovingDocId(null)
  }

  const getMoveTargets = (doc: MockDocument): VirtualFolder[] =>
    userFolders.filter(f => f.entityId === doc.linkedId && f.id !== docLocations[doc.id])

  // "New Folder" is active everywhere (category, entity, folder, home)
  const canCreateFolder = true
  const inFolderView    = current.type === 'entity' || current.type === 'folder'

  // Home-level custom folders (parentId === 'home')
  const homeCustomFolders = userFolders.filter(f => f.parentId === 'home')

  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <TopBar
        title="Documents"
        subtitle={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Breadcrumb trail (hidden at home level) */}
            {navStack.length > 1 && (
              <div className="flex items-center gap-1">
                {navStack.map((item, i) => (
                  <span key={item.id} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight size={10} className="text-muted-foreground/40" />}
                    <button
                      onClick={() => i < navStack.length - 1 && navToIndex(i)}
                      className={cn(
                        'text-[11px] transition-colors',
                        i === navStack.length - 1
                          ? 'text-foreground/80 font-semibold pointer-events-none'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {item.label}
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Dot separator */}
            {navStack.length > 1 && <span className="text-muted-foreground/30 text-xs">·</span>}
            {/* Stats — same StatItem pattern as Association */}
            <div className="flex items-center gap-1">
              {current.type === 'home' && (
                <>
                  <span className="flex items-baseline gap-1">
                    <span className="text-sm font-bold tabular-nums leading-none text-blue-600">{mockDocuments.length}</span>
                    <span className="text-xs text-muted-foreground leading-none">documents</span>
                  </span>
                  <span className="text-muted-foreground/30 text-xs mx-0.5">·</span>
                  <span className="flex items-baseline gap-1">
                    <span className="text-sm font-bold tabular-nums leading-none text-violet-600">5</span>
                    <span className="text-xs text-muted-foreground leading-none">categories</span>
                  </span>
                </>
              )}
              {current.type === 'category' && currentCat && (
                <span className="flex items-baseline gap-1">
                  <span className="text-sm font-bold tabular-nums leading-none text-violet-600">{currentCat.entities.length}</span>
                  <span className="text-xs text-muted-foreground leading-none">folders</span>
                </span>
              )}
              {(current.type === 'entity' || current.type === 'folder') && (
                <>
                  <span className="flex items-baseline gap-1">
                    <span className="text-sm font-bold tabular-nums leading-none text-violet-600">{currentSubFolders.length}</span>
                    <span className="text-xs text-muted-foreground leading-none">folders</span>
                  </span>
                  <span className="text-muted-foreground/30 text-xs mx-0.5">·</span>
                  <span className="flex items-baseline gap-1">
                    <span className="text-sm font-bold tabular-nums leading-none text-blue-600">{currentDocs.length}</span>
                    <span className="text-xs text-muted-foreground leading-none">files</span>
                  </span>
                </>
              )}
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {navStack.length > 1 && (
              <Button variant="outline" size="sm" className="text-xs" onClick={() => navToIndex(navStack.length - 2)}>
                ← Back
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn('gap-1.5 text-xs', !canCreateFolder && 'opacity-40 pointer-events-none')}
              onClick={() => { if (canCreateFolder) { setCreatingFolder(true); setMovingDocId(null) } }}
              title={canCreateFolder ? 'Create a new folder here' : 'Folders are fixed at this level'}
            >
              <FolderPlus size={13} /> New Folder
            </Button>
            <Button size="sm" className="gap-1.5 text-xs">
              <Upload size={12} /> Upload
            </Button>
          </div>
        }
        hideSearch
      />

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 p-6 animate-fade-in" onClick={() => movingDocId && setMovingDocId(null)}>

        {/* Home — 5 category cards + custom home folders + ghost "+" */}
        {current.type === 'home' && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Fixed category folders */}
            {CATEGORIES.map(c => {
              const docCount = mockDocuments.filter(d => d.category === c.docCategory).length
              return (
                <FolderCard
                  key={c.key}
                  label={c.label}
                  count={c.key === 'law' ? `${docCount} docs` : `${c.entities.length} folders · ${docCount} docs`}
                  accent={c.accent}
                  onClick={() => handleCatClick(c)}
                />
              )
            })}

            {/* User-created root-level folders */}
            {homeCustomFolders.map(f => (
              <FolderCard
                key={f.id}
                label={f.name}
                count="0 items"
                accent={CUSTOM_ACCENT}
                onClick={() => pushNav({ id: f.id, label: f.name, type: 'folder' })}
              />
            ))}

            {/* Ghost "+" or inline create form */}
            {creatingFolder ? (
              <CreateFolderCard
                accent={CUSTOM_ACCENT}
                onConfirm={confirmCreateFolder}
                onCancel={() => setCreatingFolder(false)}
              />
            ) : (
              <AddFolderCard
                accent={CUSTOM_ACCENT}
                onActivate={() => setCreatingFolder(true)}
              />
            )}
          </div>
        )}

        {/* Category — entity folder cards + custom folders + ghost "+" */}
        {current.type === 'category' && currentCat && (() => {
          const catCustomFolders = userFolders.filter(f => f.parentId === current.id)
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {/* Fixed entity folders (from mock data) */}
              {entityItems.map(e => (
                <FolderCard
                  key={e.id}
                  small
                  label={e.name}
                  count={e.sub ? `${e.sub} · ${e.folderCount + e.docCount} items` : `${e.folderCount + e.docCount} items`}
                  accent={currentCat.accent}
                  onClick={() => pushNav({ id: e.id, label: e.name, type: 'entity', catKey: currentCat.key })}
                />
              ))}

              {/* User-created custom folders at this category level */}
              {catCustomFolders.map(f => {
                const subCount = userFolders.filter(x => x.parentId === f.id).length
                const docCount = Object.entries(docLocations).filter(([, fid]) => fid === f.id).length
                return (
                  <FolderCard
                    key={f.id}
                    small
                    label={f.name}
                    count={`${subCount + docCount} items`}
                    accent={currentCat.accent}
                    onClick={() => pushNav({ id: f.id, label: f.name, type: 'folder', catKey: currentCat.key })}
                  />
                )
              })}

              {/* Ghost "+" or inline create form */}
              {creatingFolder ? (
                <CreateFolderCard
                  small
                  accent={currentCat.accent}
                  onConfirm={confirmCreateFolder}
                  onCancel={() => setCreatingFolder(false)}
                />
              ) : (
                <AddFolderCard
                  small
                  accent={currentCat.accent}
                  onActivate={() => setCreatingFolder(true)}
                />
              )}
            </div>
          )
        })()}

        {/* Entity / Folder — sub-folders + documents */}
        {inFolderView && accent && (
          <div className="space-y-8">

            {/* Folders section */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">Folders</p>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {currentSubFolders.map(f => {
                  const subCount = userFolders.filter(x => x.parentId === f.id).length
                  const docCount = Object.entries(docLocations).filter(([, fid]) => fid === f.id).length
                  return (
                    <FolderCard
                      key={f.id}
                      small
                      label={f.name}
                      count={`${subCount + docCount} items`}
                      accent={accent}
                      onClick={() => pushNav({ id: f.id, label: f.name, type: 'folder', catKey: current.catKey })}
                    />
                  )
                })}

                {/* Inline create form (replaces ghost card when creating) */}
                {creatingFolder ? (
                  <CreateFolderCard
                    small
                    accent={accent}
                    onConfirm={confirmCreateFolder}
                    onCancel={() => setCreatingFolder(false)}
                  />
                ) : (
                  /* Ghost "+" card — always at end of folders grid */
                  <AddFolderCard
                    small
                    accent={accent}
                    onActivate={() => setCreatingFolder(true)}
                  />
                )}
              </div>
            </div>

            {/* Files section */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">Files</p>
              {currentDocs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {currentDocs.map(doc => (
                    <DocPaperCard
                      key={doc.id}
                      doc={doc}
                      moveTargets={getMoveTargets(doc)}
                      movingThis={movingDocId === doc.id}
                      onMoveRequest={(e) => { e.stopPropagation(); setMovingDocId(p => p === doc.id ? null : doc.id) }}
                      onMove={(folderId) => moveDoc(doc.id, folderId)}
                      onMoveClose={() => setMovingDocId(null)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-muted-foreground/15">
                  <FileText size={36} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium text-muted-foreground/60">No files here</p>
                  <p className="text-xs text-muted-foreground/40 mt-0.5">Upload a file to this folder</p>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs mt-4">
                    <Upload size={12} /> Upload File
                  </Button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
