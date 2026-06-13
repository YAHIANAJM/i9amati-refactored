import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquareWarning, Plus, Search } from 'lucide-react'
import { mockComplaints } from '@/data/mock/complaints'
import { formatDate, getInitials, cn } from '@/lib/utils'

const statusConfig = {
  OPEN: { label: 'Ouvert', variant: 'destructive' as const },
  IN_PROGRESS: { label: 'En cours', variant: 'warning' as const },
  RESOLVED: { label: 'Résolu', variant: 'success' as const },
  CLOSED: { label: 'Fermé', variant: 'secondary' as const },
}
const priorityConfig = {
  LOW: { label: 'Faible', variant: 'secondary' as const },
  MEDIUM: { label: 'Moyen', variant: 'info' as const },
  HIGH: { label: 'Élevé', variant: 'warning' as const },
  URGENT: { label: 'Urgent', variant: 'destructive' as const },
}

export function Complaints() {
  const [search, setSearch] = useState('')
  const filtered = mockComplaints.filter(c =>
    search === '' || c.title.toLowerCase().includes(search.toLowerCase()) || c.authorName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Réclamations"
        subtitle="Gestion des plaintes et signalements"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus size={13} /> Nouvelle réclamation
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-4 animate-fade-in">
        <div className="relative flex items-center w-64">
          <Search size={13} className="absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                  <MessageSquareWarning size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium">{c.title}</h3>
                    <Badge variant={priorityConfig[c.priority as keyof typeof priorityConfig].variant} className="text-[11px]">
                      {priorityConfig[c.priority as keyof typeof priorityConfig].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px]">{getInitials(c.authorName)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{c.authorName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Appt {c.apartmentNumber}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={statusConfig[c.status as keyof typeof statusConfig].variant}>
                    {statusConfig[c.status as keyof typeof statusConfig].label}
                  </Badge>
                  {c.status === 'OPEN' && (
                    <Button size="sm" variant="outline" className="text-xs h-7">Prendre en charge</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquareWarning size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Aucune réclamation trouvée</p>
          </div>
        )}
      </div>
    </div>
  )
}
