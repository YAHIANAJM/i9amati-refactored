import { useState } from 'react'
import { Search, Bell, X, CreditCard, CalendarClock, MessageSquareWarning, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

// ─── Types ─────────────────────────────────────────────────────────────────────

type NotifType = 'PAYMENT' | 'MEETING' | 'COMPLAINT' | 'DOCUMENT'

interface ApiNotif {
  id:       string
  type:     NotifType
  title:    string
  body:     string
  time:     string
  linkedAt: string
}

interface Notif extends ApiNotif {
  read: boolean
}

const notifIcon: Record<NotifType, React.ReactNode> = {
  PAYMENT:   <CreditCard size={13} />,
  MEETING:   <CalendarClock size={13} />,
  COMPLAINT: <MessageSquareWarning size={13} />,
  DOCUMENT:  <FileText size={13} />,
}

const notifColor: Record<NotifType, string> = {
  PAYMENT:   'bg-amber-100 text-amber-700',
  MEETING:   'bg-blue-100 text-blue-700',
  COMPLAINT: 'bg-red-100 text-red-700',
  DOCUMENT:  'bg-slate-100 text-slate-600',
}

// ─── NotificationPanel ─────────────────────────────────────────────────────────

interface NotificationPanelProps {
  notifs:       Notif[]
  isLoading:    boolean
  onMarkRead:   (id: string) => void
  onMarkAllRead: () => void
  onClose:      () => void
}

function NotificationPanel({ notifs, isLoading, onMarkRead, onMarkAllRead, onClose }: NotificationPanelProps) {
  const unread = notifs.filter(n => !n.read).length

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed right-4 top-16 z-50 w-80 rounded-xl border bg-white shadow-xl overflow-hidden flex flex-col"
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{   opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        style={{ maxHeight: 'calc(100vh - 80px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-foreground" />
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <span className="flex items-center justify-center text-[10px] font-bold text-white bg-destructive rounded-full w-4 h-4">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button className="text-[11px] text-[#C18D52] hover:text-[#C18D52]/70 font-medium px-1 transition-colors" onClick={onMarkAllRead}>
                Tout lire
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X size={13} />
            </button>
          </div>
        </div>

        {/* List */}
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
          {notifs.map(n => (
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
      </motion.div>
    </>
  )
}

// ─── TopBar ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  title:      React.ReactNode
  subtitle?:  React.ReactNode
  actions?:   React.ReactNode
  hideSearch?: boolean
  searchValue?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
  searchTextColor?: string
}

export function TopBar({ title, subtitle, actions, hideSearch, searchValue, onSearchChange, searchPlaceholder, searchTextColor }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [readIds,   setReadIds]   = useState<Set<string>>(new Set())

  const { data: rawNotifs = [], isLoading } = useQuery<ApiNotif[]>({
    queryKey: ['notifications'],
    queryFn:  async () => {
      const res = await fetch('/api/notifications', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch notifications')
      return res.json()
    },
    refetchInterval: 60_000,
    staleTime:       30_000,
  })

  const notifs     = rawNotifs.map(n => ({ ...n, read: readIds.has(n.id) }))
  const unreadCount = notifs.filter(n => !n.read).length

  const markRead    = (id: string) => setReadIds(prev => new Set([...prev, id]))
  const markAllRead = ()           => setReadIds(new Set(rawNotifs.map(n => n.id)))

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-base font-semibold text-foreground leading-tight">{title}</h1>
        {subtitle && <div className="mt-1">{subtitle}</div>}
      </div>

      <div className="flex items-center gap-2">
        {!hideSearch && (
          <div className="relative hidden md:flex items-center">
            <Search size={14} className="absolute left-3 text-[#C18D52]/50 pointer-events-none" />
            <input
              placeholder={searchPlaceholder ?? 'Search...'}
              value={searchValue ?? ''}
              onChange={onSearchChange ? e => onSearchChange(e.target.value) : undefined}
              readOnly={!onSearchChange}
              className="h-8 w-80 rounded-md border border-[#C18D52]/30 bg-[#F9D3C0]/[0.18] pl-8 pr-8 text-sm placeholder:text-[#C18D52]/60 focus:outline-none focus:ring-2 focus:ring-[#C18D52]/40 focus:border-[#C18D52]/60"
              style={searchTextColor ? { color: searchTextColor } : undefined}
            />
            {searchValue && onSearchChange && (
              <button onClick={() => onSearchChange('')} className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative flex items-center justify-center h-8 w-8 rounded-lg border border-[#C18D52]/30 bg-[#C18D52]/[0.06] text-[#C18D52] hover:bg-[#C18D52]/[0.14] hover:border-[#C18D52]/60 transition-all">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center text-[8px] font-bold text-white bg-destructive rounded-full min-w-[14px] h-[14px] px-[3px]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <NotificationPanel
                notifs={notifs}
                isLoading={isLoading}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onClose={() => setNotifOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {actions}
      </div>
    </div>
  )
}
