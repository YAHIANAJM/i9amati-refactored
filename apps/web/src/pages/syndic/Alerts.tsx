import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, CreditCard, MessageSquareWarning, CalendarCheck, FileText, Users } from 'lucide-react'
import { mockAlerts, mockNotificationSettings } from '@/data/mock/alerts'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const typeIcon: Record<string, React.ReactNode> = {
  PAYMENT:   <CreditCard size={14} className="text-emerald-600"/>,
  COMPLAINT: <MessageSquareWarning size={14} className="text-red-600"/>,
  MEETING:   <CalendarCheck size={14} className="text-blue-600"/>,
  DOCUMENT:  <FileText size={14} className="text-gray-500"/>,
  MEMBER:    <Users size={14} className="text-purple-600"/>,
}
const priorityVariant: Record<string, 'destructive'|'warning'|'info'|'secondary'> = {
  URGENT: 'destructive', HIGH: 'warning', MEDIUM: 'info', LOW: 'secondary',
}
const priorityLabel: Record<string, string> = {
  URGENT: 'Urgent', HIGH: 'Élevé', MEDIUM: 'Moyen', LOW: 'Faible',
}

export function Alerts() {
  const [settings, setSettings] = useState(mockNotificationSettings)

  const toggle = (key: string) =>
    setSettings(s => s.map(n => n.key === key ? { ...n, enabled: !n.enabled } : n))

  const unread = mockAlerts.filter(a => !a.read).length

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Alerts & Notifications"
        subtitle={`${unread} nouvelle${unread > 1 ? 's' : ''} notification${unread > 1 ? 's' : ''}`}
      />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Alerts list */}
          <div className="lg:col-span-2 space-y-3">
            {mockAlerts.map(a => (
              <div key={a.id} className={cn(
                'flex items-start gap-3 rounded-xl border p-4 transition-shadow hover:shadow-sm',
                !a.read && 'border-primary/30 bg-primary/5'
              )}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                  {typeIcon[a.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{a.title}</span>
                    {!a.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"/>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{a.message}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                <Badge variant={priorityVariant[a.priority]} className="text-[10px] shrink-0">
                  {priorityLabel[a.priority]}
                </Badge>
              </div>
            ))}
          </div>

          {/* Notification settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell size={14}/> Contrôle notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.map(n => (
                <div key={n.key} className="flex items-center justify-between py-1">
                  <span className="text-xs">{n.label}</span>
                  <button
                    onClick={() => toggle(n.key)}
                    className={cn(
                      'relative h-5 w-9 rounded-full transition-colors shrink-0',
                      n.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                      n.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    )}/>
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
