import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Home, CreditCard, FileText, CalendarCheck,
  BarChart3, Rss, Wrench, Bell, Users, User, Settings, LogOut,
  ChevronLeft, ChevronRight, ChevronDown, PieChart, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

/* ─── Section definitions ────────────────────────────────── */

const sections = [
  {
    key: 'dashboards',
    label: 'DASHBOARDS',
    defaultOpen: true,
    items: [
      { label: 'Global Overview', icon: LayoutDashboard, to: '/syndic' },
      { label: 'Apartments Analytics', icon: PieChart, to: '/syndic/dash/apartments' },
      { label: 'Payments Analytics', icon: TrendingUp, to: '/syndic/dash/payments' },
      { label: 'Meetings Analytics', icon: CalendarCheck, to: '/syndic/dash/meetings' },
      { label: 'Accounting Analytics', icon: BarChart3, to: '/syndic/dash/accounting' },
      { label: 'Feed Analytics', icon: Rss, to: '/syndic/dash/feed' },
      { label: 'Services Analytics', icon: Wrench, to: '/syndic/dash/services' },
      { label: 'Union Analytics', icon: Users, to: '/syndic/dash/union' },
    ],
  },
  {
    key: 'general',
    label: 'GENERAL',
    defaultOpen: false,
    items: [
      { label: 'Profile', icon: User, to: '/syndic/profile' },
    ],
  },
  {
    key: 'management',
    label: 'MANAGEMENT',
    defaultOpen: false,
    items: [
      { label: "Owners' Association", icon: Home, to: '/syndic/association' },
      { label: 'Payments', icon: CreditCard, to: '/syndic/payments' },
      { label: 'Documents', icon: FileText, to: '/syndic/documents' },
      { label: 'Meeting & Voting', icon: CalendarCheck, to: '/syndic/meetings' },
      { label: 'Accounting', icon: BarChart3, to: '/syndic/accounting' },
    ],
  },
  {
    key: 'community',
    label: 'COMMUNITY',
    defaultOpen: false,
    items: [
      { label: 'Feed Management', icon: Rss, to: '/syndic/feed' },
      { label: 'Service Tracking', icon: Wrench, to: '/syndic/services' },
      { label: 'Alerts & Notifications', icon: Bell, to: '/syndic/alerts' },
    ],
  },
  {
    key: 'union',
    label: 'UNION',
    defaultOpen: false,
    items: [
      { label: 'Union Members', icon: Users, to: '/syndic/union-members' },
    ],
  },
]

/* ─── Component ──────────────────────────────────────────── */

interface SidebarProps { open: boolean; onToggle: () => void }

export function Sidebar({ open, onToggle }: SidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map(s => [s.key, s.defaultOpen]))
  )

  // Auto-open the section that owns the current route
  useEffect(() => {
    const active = sections.find(s => s.items.some(item =>
      item.to === '/syndic'
        ? pathname === '/syndic'
        : pathname.startsWith(item.to)
    ))
    if (active) setExpanded(prev => ({ ...prev, [active.key]: true }))
  }, [pathname])

  const toggleSection = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <aside className={cn(
      'flex flex-col bg-white rounded-xl shadow-sm border border-border/50 transition-all duration-300 ease-in-out shrink-0 overflow-hidden',
      open ? 'w-[220px]' : 'w-[60px]'
    )}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className={cn(
        'flex items-center gap-2.5 border-b border-border/50 shrink-0 py-3 px-3',
        !open && 'flex-col justify-center px-0'
      )}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
          <span className="text-white font-bold text-sm leading-none">i9</span>
        </div>

        {open && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">إقامتي</p>
            <p className="text-[11px] text-muted-foreground truncate">وكيل الاتحاد محمد الأمين</p>
            <p className="text-[10px] text-primary/70">auth.union_agent</p>
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-white shadow-sm hover:bg-primary hover:text-white transition-all shrink-0"
        >
          {open
            ? <ChevronLeft size={12} className="text-primary" />
            : <ChevronRight size={12} className="text-primary" />}
        </button>
      </div>

      {/* ── Scrollable nav ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-1">
        {sections.map(section => (
          <div key={section.key}>

            {/* Section header - clickable accordion trigger */}
            <button
              onClick={() => open && toggleSection(section.key)}
              className={cn(
                'w-full flex items-center transition-colors',
                open
                  ? 'px-3 py-1.5 justify-between hover:bg-muted/50 rounded-md mx-1 w-[calc(100%-8px)]'
                  : 'justify-center py-1.5'
              )}
            >
              {open ? (
                <>
                  <span className="text-[11px] font-extrabold tracking-widest text-foreground/75 uppercase">
                    {section.label}
                  </span>
                  <ChevronDown
                    size={12}
                    className={cn(
                      'text-muted-foreground/50 transition-transform duration-200',
                      expanded[section.key] && 'rotate-180'
                    )}
                  />
                </>
              ) : (
                <div className="h-px w-8 bg-border/60" />
              )}
            </button>

            {/* Section items */}
            {(open ? expanded[section.key] : true) && (
              <div className={cn('space-y-0.5', open ? 'px-2 pb-1' : 'px-2 pb-1')}>
                {section.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/syndic'}
                    title={!open ? item.label : undefined}
                    className={({ isActive }) => cn(
                      'flex items-center gap-2.5 rounded-lg transition-colors',
                      open ? 'px-2.5 py-1.5' : 'justify-center p-2.5',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon size={15} className="shrink-0" />
                    {open && (
                      <span className="text-xs font-medium whitespace-nowrap truncate">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* ── Bottom box: Settings + Logout ───────────────── */}
      <div className="px-2 pb-2 pt-1 border-t border-border/50 shrink-0">
        <div className="rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
          <NavLink
            to="/syndic/settings"
            title={!open ? 'Settings' : undefined}
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-3 py-2 border-b border-border/40 transition-colors text-xs font-medium',
              !open && 'justify-center px-0',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings size={14} className="shrink-0" />
            {open && <span>Settings</span>}
          </NavLink>

          <button
            onClick={() => navigate('/login')}
            title={!open ? 'Logout' : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors',
              !open && 'justify-center px-0'
            )}
          >
            <LogOut size={14} className="shrink-0" />
            {open && <span>Logout</span>}
          </button>
        </div>
      </div>

    </aside>
  )
}
