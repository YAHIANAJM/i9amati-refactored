import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Home, Plus, MoreHorizontal, Eye, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AddResidenceModal } from '@/components/residences/AddResidenceModal'

const statusConfig = {
  ACTIVE:      { label: 'Actif',   variant: 'success'   as const },
  MAINTENANCE: { label: 'Travaux', variant: 'warning'   as const },
  INACTIVE:    { label: 'Inactif', variant: 'secondary' as const },
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80'

async function fetchResidences() {
  const res = await fetch('/api/residences')
  if (!res.ok) throw new Error('Failed to fetch residences')
  return res.json() as Promise<any[]>
}

export function Residences() {
  const qc = useQueryClient()
  const { data: residences = [], isLoading, isError } = useQuery({
    queryKey: ['residences'],
    queryFn:  fetchResidences,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['residences'] })

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Résidences & Immeubles"
        subtitle="Gérez vos immeubles et copropriétés"
        actions={
          <AddResidenceModal onSuccess={invalidate}>
            <Button size="sm" className="gap-1.5">
              <Plus size={14} /> Nouvelle résidence
            </Button>
          </AddResidenceModal>
        }
      />

      <div className="flex-1 p-6 animate-fade-in">
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Chargement des résidences…</span>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-red-500">Erreur de chargement — vérifiez la connexion API</p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {residences.map(r => {
              const buildings    = r.buildings ?? []
              const isStandalone = buildings.length === 1
              const facilities: string[] = Array.isArray(r.facilities) ? r.facilities : []

              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <div className="h-32 w-full overflow-hidden bg-muted">
                    <img
                      src={r.image ?? DEFAULT_IMAGE}
                      alt={r.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{r.name}</h3>
                        <Badge variant={isStandalone ? 'secondary' : 'info'} className="text-[10px]">
                          {isStandalone ? 'عمارة فردية' : 'إقامة'}
                        </Badge>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground p-1 rounded">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                      <MapPin size={11} />
                      {r.address}{r.city ? `, ${r.city}` : ''}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-base font-bold">{buildings.length}</p>
                        <p className="text-[10px] text-muted-foreground">Bâtiments</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-base font-bold">—</p>
                        <p className="text-[10px] text-muted-foreground">Unités</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-base font-bold text-emerald-600">—</p>
                        <p className="text-[10px] text-muted-foreground">Occupés</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={statusConfig[r.status as keyof typeof statusConfig]?.variant ?? 'secondary'}>
                        {statusConfig[r.status as keyof typeof statusConfig]?.label ?? r.status}
                      </Badge>
                      {facilities.length > 0 && (
                        <div className="flex gap-1">
                          {facilities.slice(0, 3).map(f => (
                            <span key={f} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                        <Link to={`/syndic/residences/${r.id}`}>
                          <Eye size={12} className="mr-1" /> Détails
                        </Link>
                      </Button>
                      <Button size="sm" className="flex-1 text-xs h-8" asChild>
                        <Link to={`/syndic/apartments?residence=${r.id}`}>
                          <Home size={12} className="mr-1" /> Appartements
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Add new card */}
            <AddResidenceModal onSuccess={invalidate}>
              <button className="flex flex-col items-center justify-center min-h-[300px] rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors group w-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 mb-3 transition-colors">
                  <Plus size={20} className="text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">Ajouter</p>
              </button>
            </AddResidenceModal>
          </div>
        )}
      </div>
    </div>
  )
}
