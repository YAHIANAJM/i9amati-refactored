import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarCheck, Plus, MapPin, Users, Clock } from 'lucide-react'
import { mockMeetings } from '@/data/mock/meetings'
import { formatDate } from '@/lib/utils'

const statusConfig = {
  SCHEDULED: { label: 'Planifiée', variant: 'info' as const },
  IN_PROGRESS: { label: 'En cours', variant: 'warning' as const },
  COMPLETED: { label: 'Terminée', variant: 'success' as const },
  CANCELLED: { label: 'Annulée', variant: 'secondary' as const },
}

export function Meetings() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Réunions & AG"
        subtitle="Assemblées générales et réunions de copropriété"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus size={13} /> Planifier une réunion
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-4 animate-fade-in">
        <div className="grid gap-4">
          {mockMeetings.map(m => {
            const date = new Date(m.scheduledAt)
            const cfg = statusConfig[m.status as keyof typeof statusConfig]
            return (
              <Card key={m.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl bg-primary/10 shrink-0">
                      <span className="text-xl font-bold text-primary leading-none">{date.getDate()}</span>
                      <span className="text-[11px] text-primary/70 uppercase tracking-wide">
                        {date.toLocaleString('fr-MA', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{m.title}</h3>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      {m.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{m.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {date.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {m.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} /> {m.location}
                          </span>
                        )}
                        {m.attendees > 0 && (
                          <span className="flex items-center gap-1">
                            <Users size={11} /> {m.attendees} participants
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {m.status === 'SCHEDULED' && (
                        <Button size="sm" variant="outline" className="text-xs h-8">Envoyer convocation</Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs h-8">Détails</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
