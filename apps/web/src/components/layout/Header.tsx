import { useState, useRef, useEffect } from 'react'
import { Search, Bell, ChevronDown, LogOut, User, X, CreditCard, CalendarClock, MessageSquareWarning, FileText, CheckCircle2, Loader2, Home, BarChart3, Rss, Wrench, Users } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Link, useNavigate } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'
import { getInitials } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Bot, MessageSquare, BellIcon, PieChart, TrendingUp,
} from 'lucide-react'

const LANGUAGES = [
  { code: 'fr',  label: 'Français',   dir: 'ltr' },
  { code: 'en',  label: 'English',    dir: 'ltr' },
  { code: 'ar',  label: 'العربية',    dir: 'rtl' },
  { code: 'tzm', label: 'ⵜⴰⵎⴰⵣⵉⵖⵜ', dir: 'ltr' },
] as const

// All sidebar pages — same source as Sidebar.tsx
const ALL_PAGES = [
  { label: 'Global Overview',        to: '/syndic',                  section: 'Dashboards',  icon: LayoutDashboard },
  { label: "Owners' Association",    to: '/syndic/dash/apartments',  section: 'Dashboards',  icon: PieChart        },
  { label: 'Payments Analytics',     to: '/syndic/dash/payments',    section: 'Dashboards',  icon: TrendingUp      },
  { label: 'Meetings Analytics',     to: '/syndic/dash/meetings',    section: 'Dashboards',  icon: CalendarClock   },
  { label: 'Accounting Analytics',   to: '/syndic/dash/accounting',  section: 'Dashboards',  icon: BarChart3       },
  { label: 'Feed Analytics',         to: '/syndic/dash/feed',        section: 'Dashboards',  icon: Rss             },
  { label: 'Services Analytics',     to: '/syndic/dash/services',    section: 'Dashboards',  icon: Wrench          },
  { label: 'Union Analytics',        to: '/syndic/dash/union',       section: 'Dashboards',  icon: Users           },
  { label: "Owners' Association",    to: '/syndic/association',      section: 'Management',  icon: Home            },
  { label: 'Payments',               to: '/syndic/payments',         section: 'Management',  icon: CreditCard      },
  { label: 'Documents',              to: '/syndic/documents',        section: 'Management',  icon: FileText        },
  { label: 'Meeting & Voting',       to: '/syndic/meetings',         section: 'Management',  icon: CalendarClock   },
  { label: 'Accounting',             to: '/syndic/accounting',       section: 'Management',  icon: BarChart3       },
  { label: 'Feed Management',        to: '/syndic/feed',             section: 'Community',   icon: Rss             },
  { label: 'Service Tracking',       to: '/syndic/services',         section: 'Community',   icon: Wrench          },
  { label: 'Alerts & Notifications', to: '/syndic/alerts',           section: 'Community',   icon: BellIcon        },
  { label: 'Union Members',          to: '/syndic/union-members',    section: 'Union',       icon: Users           },
  { label: 'Chatbot Analytics',      to: '/syndic/dash/chatbot',     section: 'Chatbot',     icon: Bot             },
  { label: 'Chat Interface',         to: '/syndic/chat',             section: 'Chatbot',     icon: MessageSquare   },
  { label: 'Profile',                to: '/syndic/profile',          section: 'General',     icon: User            },
]

// ─── Notification types ────────────────────────────────────────────────────────

type NotifType = 'PAYMENT' | 'MEETING' | 'COMPLAINT' | 'DOCUMENT'

interface ApiNotif {
  id:       string
  type:     NotifType
  title:    string
  body:     string
  time:     string
  linkedAt: string
  section?: string
}

interface Notif extends ApiNotif { read: boolean }

const notifIcon: Record<NotifType, React.ReactNode> = {
  PAYMENT:   <CreditCard size={13} />,
  MEETING:   <CalendarClock size={13} />,
  COMPLAINT: <MessageSquareWarning size={13} />,
  DOCUMENT:  <FileText size={13} />,
}

const notifColor: Record<NotifType, string> = {
  PAYMENT:   'bg-[#C18D52]/[0.12] text-[#C18D52]',
  MEETING:   'bg-[#203B37]/[0.12] text-[#203B37]',
  COMPLAINT: 'bg-[#D97172]/[0.12] text-[#D97172]',
  DOCUMENT:  'bg-[#8F5C64]/[0.12] text-[#8F5C64]',
}

const sectionLabel: Record<string, string> = {
  Management:  "Owners' Association",
  Community:   'Community',
  Dashboards:  'Dashboards',
  Union:       'Union',
  Chatbot:     'Chatbot',
  General:     'General',
}

// ─── Global Notification Panel ─────────────────────────────────────────────────

interface GlobalNotifPanelProps {
  notifs:        Notif[]
  isLoading:     boolean
  onMarkRead:    (id: string) => void
  onMarkAllRead: () => void
  onClose:       () => void
}

function GlobalNotifPanel({ notifs, isLoading, onMarkRead, onMarkAllRead, onClose }: GlobalNotifPanelProps) {
  const unread = notifs.filter(n => !n.read).length

  const grouped = notifs.reduce<Record<string, Notif[]>>((acc, n) => {
    const key = n.section ?? 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {})

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed right-4 top-14 z-50 w-88 rounded-xl border bg-white shadow-xl overflow-hidden flex flex-col"
        style={{ width: 340, maxHeight: 'calc(100vh - 72px)' }}
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{   opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-foreground" />
            <span className="text-sm font-semibold">Notifications globales</span>
            {unread > 0 && (
              <span className="flex items-center justify-center text-[10px] font-bold text-white bg-[#D97172] rounded-full w-4 h-4">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button
                className="text-[11px] text-[#C18D52] hover:text-[#C18D52]/70 font-medium px-1 transition-colors"
                onClick={onMarkAllRead}
              >
                Tout lire
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Chargement…</span>
            </div>
          )}
          {!isLoading && notifs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <CheckCircle2 size={24} className="mb-2 opacity-40" />
              <p className="text-sm">Aucune notification</p>
            </div>
          )}
          {!isLoading && Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  {sectionLabel[section] ?? section}
                </span>
              </div>
              {items.map(n => (
                <button
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 border-b last:border-0 text-left transition-colors hover:bg-muted/50 ${!n.read ? 'bg-[#C18D52]/[0.04]' : ''}`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${notifColor[n.type]}`}>
                    {notifIcon[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[11px] font-semibold leading-tight ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#C18D52] mt-1 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    </>
  )
}

// ─── Header ────────────────────────────────────────────────────────────────────

export function Header() {
  const navigate   = useNavigate()
  const { t, i18n } = useTranslation()
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [query,      setQuery]      = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [userOpen,   setUserOpen]   = useState(false)
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [readIds,    setReadIds]    = useState<Set<string>>(new Set())
  const userRef   = useRef<HTMLDivElement>(null)
  const langRef   = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const userRef   = useRef<HTMLDivElement>(null)
  const notifRef  = useRef<HTMLDivElement>(null)

  const { data: rawNotifs = [], isLoading } = useQuery<ApiNotif[]>({
    queryKey: ['global-notifications'],
    queryFn:  async () => {
      const res = await fetch('/api/notifications', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    refetchInterval: 60_000,
    staleTime:       30_000,
  })

  const notifs      = rawNotifs.map(n => ({ ...n, read: readIds.has(n.id) }))
  const unreadCount = notifs.filter(n => !n.read).length

  const markRead    = (id: string) => setReadIds(prev => new Set([...prev, id]))
  const markAllRead = ()           => setReadIds(new Set(rawNotifs.map(n => n.id)))


  const results = query.trim().length > 0
    ? ALL_PAGES.filter(p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.section.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 7)
    : []

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
      if (userRef.current   && !userRef.current.contains(e.target as Node))   setUserOpen(false)
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false)
      if (langRef.current   && !langRef.current.contains(e.target as Node))   setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.href = '/auth/login'
  }

  const switchLang = (code: string) => {
    i18n.changeLanguage(code)
    document.documentElement.dir = LANGUAGES.find(l => l.code === code)?.dir ?? 'ltr'
    setLangOpen(false)
  }

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0]
  const fullName    = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name : t('nav.syndic')
  const initials    = getInitials(fullName)

  return (
    <header className="flex items-center justify-between px-5 py-3 shrink-0 bg-white rounded-b-xl shadow-sm border border-border/40 mx-36">
      {/* Left - brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
          <span className="text-white font-bold text-sm">i9</span>
        </div>
        <div>
          <span className="font-semibold text-sm text-foreground/90">i9amati</span>
          <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">{t('nav.syndicMgmt')}</span>
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
            placeholder={t('nav.search')}
            className="w-full h-8 rounded-lg bg-muted border border-border pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearchOpen(false) }}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Search results */}
        {searchOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-border rounded-xl shadow-xl overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-4 pt-3 pb-1">
              {t('nav.matchingPages')}
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
            <p className="text-sm font-medium text-foreground">{t('nav.noPageFound')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('nav.tryAnother')}</p>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1 mr-3">
        {([
          { key: 'home',     to: '/'          },
          { key: 'about',    to: '/#about'    },
          { key: 'services', to: '/#services' },
        ] as const).map(({ key, to }) => (
          <Link key={key} to={to}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {t(`nav.${key}`)}
          </Link>
        ))}
      </nav>

      {/* Right - lang + bell + user */}
      <div className="flex items-center gap-2">
        {/* Global notification bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#C18D52]/30 bg-[#C18D52]/[0.06] text-[#C18D52] hover:bg-[#C18D52]/[0.14] hover:border-[#C18D52]/60 transition-all"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center text-[8px] font-bold text-white bg-[#D97172] rounded-full min-w-[14px] h-[14px] px-[3px]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <GlobalNotifPanel
                notifs={notifs}
                isLoading={isLoading}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onClose={() => setNotifOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Language switcher */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen(v => !v)}
            title={t('nav.lang')}
            className="flex items-center gap-1.5 h-8 px-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Globe size={14} />
            <span className="text-xs font-medium hidden sm:inline">{currentLang.label}</span>
            <ChevronDown size={11} className={`hidden sm:block transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>

          {langOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white border border-border rounded-xl shadow-xl overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-3 pt-2.5 pb-1">
                {t('nav.lang')}
              </p>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => switchLang(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted/60 ${
                    i18n.language === lang.code
                      ? 'text-primary font-semibold bg-primary/5'
                      : 'text-foreground'
                  }`}
                  dir={lang.dir}
                >
                  <span>{lang.label}</span>
                  {i18n.language === lang.code && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

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
              <p className="text-[10px] text-foreground/50 mt-0.5">{t('nav.syndic')}</p>
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
                {t('nav.profile')}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-border/40">
                <LogOut size={14} />
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
