import { useState, useRef, useEffect } from 'react'
import { Search, Bell, ChevronDown, LogOut, User, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Link, useNavigate } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'
import { getInitials } from '@/lib/utils'
import {
  LayoutDashboard, Home, CreditCard, FileText, CalendarCheck,
  BarChart3, Rss, Wrench, Bell as BellIcon, Users, PieChart, TrendingUp, Bot, MessageSquare,
} from 'lucide-react'

// All sidebar pages — same source as Sidebar.tsx
const ALL_PAGES = [
  { label: 'Global Overview',       to: '/syndic',                  section: 'Dashboards',  icon: LayoutDashboard },
  { label: "Owners' Association",   to: '/syndic/dash/apartments',  section: 'Dashboards',  icon: PieChart        },
  { label: 'Payments Analytics',    to: '/syndic/dash/payments',    section: 'Dashboards',  icon: TrendingUp      },
  { label: 'Meetings Analytics',    to: '/syndic/dash/meetings',    section: 'Dashboards',  icon: CalendarCheck   },
  { label: 'Accounting Analytics',  to: '/syndic/dash/accounting',  section: 'Dashboards',  icon: BarChart3       },
  { label: 'Feed Analytics',        to: '/syndic/dash/feed',        section: 'Dashboards',  icon: Rss             },
  { label: 'Services Analytics',    to: '/syndic/dash/services',    section: 'Dashboards',  icon: Wrench          },
  { label: 'Union Analytics',       to: '/syndic/dash/union',       section: 'Dashboards',  icon: Users           },
  { label: "Owners' Association",   to: '/syndic/association',      section: 'Management',  icon: Home            },
  { label: 'Payments',              to: '/syndic/payments',         section: 'Management',  icon: CreditCard      },
  { label: 'Documents',             to: '/syndic/documents',        section: 'Management',  icon: FileText        },
  { label: 'Meeting & Voting',      to: '/syndic/meetings',         section: 'Management',  icon: CalendarCheck   },
  { label: 'Accounting',            to: '/syndic/accounting',       section: 'Management',  icon: BarChart3       },
  { label: 'Feed Management',       to: '/syndic/feed',             section: 'Community',   icon: Rss             },
  { label: 'Service Tracking',      to: '/syndic/services',         section: 'Community',   icon: Wrench          },
  { label: 'Alerts & Notifications',to: '/syndic/alerts',           section: 'Community',   icon: BellIcon        },
  { label: 'Union Members',         to: '/syndic/union-members',    section: 'Union',        icon: Users           },
  { label: 'Chatbot Analytics',     to: '/syndic/dash/chatbot',     section: 'Chatbot',     icon: Bot             },
  { label: 'Chat Interface',        to: '/syndic/chat',             section: 'Chatbot',     icon: MessageSquare   },
  { label: 'Profile',               to: '/syndic/profile',          section: 'General',     icon: User            },
]

export function Header() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [query, setQuery]           = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [userOpen, setUserOpen]     = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const userRef   = useRef<HTMLDivElement>(null)

  const results = query.trim().length > 0
    ? ALL_PAGES.filter(p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.section.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 7)
    : []

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.href = '/auth/login'
  }

  const fullName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name : 'Syndic'
  const initials = getInitials(fullName)

  return (
    <header className="flex items-center justify-between px-5 py-3 shrink-0 bg-white rounded-b-xl shadow-sm border border-border/40 mx-36">
      {/* Left - brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
          <span className="text-white font-bold text-sm">i9</span>
        </div>
        <div>
          <span className="font-semibold text-sm text-foreground/90">i9amati</span>
          <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">Gestion de Syndic</span>
        </div>
      </div>

      {/* Center - smart search */}
      <div ref={searchRef} className="flex-1 max-w-md mx-8 hidden md:block relative">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Rechercher dans i9amati..."
            className="w-full h-8 rounded-lg bg-muted border border-border pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
          {query ? (
            <button onClick={() => { setQuery(''); setSearchOpen(false) }}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors">
              <X size={13} />
            </button>
          ) : (
            <kbd className="absolute right-3 text-[10px] text-foreground/40 hidden lg:block">⌘K</kbd>
          )}
        </div>

        {/* Search dropdown */}
        {searchOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-border rounded-xl shadow-xl overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-4 pt-3 pb-1">
              Pages correspondantes
            </p>
            {results.map(page => (
              <button
                key={page.to}
                onClick={() => { navigate(page.to); setQuery(''); setSearchOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8 group-hover:bg-primary/15 transition-colors shrink-0">
                  <page.icon size={13} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{page.label}</p>
                  <p className="text-[10px] text-muted-foreground">{page.section}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchOpen && query.trim().length > 0 && results.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-border rounded-xl shadow-xl px-4 py-5 text-center">
            <p className="text-sm font-medium text-foreground">Aucune page trouvée</p>
            <p className="text-xs text-muted-foreground mt-0.5">Essayez un autre mot-clé</p>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1 mr-3">
        {[
          { label: 'Home',     to: '/'          },
          { label: 'About',    to: '/#about'    },
          { label: 'Services', to: '/#services' },
        ].map(({ label, to }) => (
          <Link key={label} to={to}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {label}
          </Link>
        ))}
      </nav>

      {/* Right - bell + user */}
      <div className="flex items-center gap-2">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <Bell size={16} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* User dropdown */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setUserOpen(v => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-muted transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-white text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium leading-none text-foreground/90">{fullName}</p>
              <p className="text-[10px] text-foreground/50 mt-0.5">Syndic</p>
            </div>
            <ChevronDown size={12} className={`text-foreground/50 hidden sm:block transition-transform ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-border/60">
                <p className="text-xs font-semibold text-foreground truncate">{fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/syndic/profile'); setUserOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors">
                <User size={14} className="text-muted-foreground" />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-border/40">
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
