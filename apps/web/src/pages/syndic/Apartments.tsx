import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Download, Search, Home } from 'lucide-react'
import { mockApartments } from '@/data/mock/apartments'
import { getRepresentative } from '@/data/mock/owners'
import { formatCurrency, getInitials, cn } from '@/lib/utils'

type StatusFilter = 'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE'

const statusConfig = {
  OCCUPIED: { label: 'Occupé', variant: 'success' as const },
  VACANT: { label: 'Vacant', variant: 'secondary' as const },
  MAINTENANCE: { label: 'En travaux', variant: 'warning' as const },
}

// Auto-avatar URLs by gender
const MALE_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=male&backgroundColor=b6e3f4'
const FEMALE_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=female&backgroundColor=ffd5dc'

export function Apartments() {
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')

  const filtered = mockApartments.filter(a => {
    const rep = getRepresentative(a.id)
    const ownerName = rep ? `${rep.firstName} ${rep.lastName}` : ''
    const matchStatus = filter === 'ALL' || a.status === filter
    const matchSearch = search === '' ||
      a.unitCode.toLowerCase().includes(search.toLowerCase()) ||
      ownerName.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts = {
    ALL: mockApartments.length,
    OCCUPIED: mockApartments.filter(a => a.status === 'OCCUPIED').length,
    VACANT: mockApartments.filter(a => a.status === 'VACANT').length,
    MAINTENANCE: mockApartments.filter(a => a.status === 'MAINTENANCE').length,
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Appartements"
        subtitle={`${mockApartments.length} unités gérées`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download size={13} /> Export
            </Button>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus size={13} /> Ajouter
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 animate-fade-in space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="h-8 w-52 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex rounded-md border overflow-hidden">
            {(['ALL', 'OCCUPIED', 'VACANT', 'MAINTENANCE'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                )}
              >
                {s === 'ALL' ? 'Tous' : statusConfig[s].label} ({counts[s]})
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <Th>Appartement</Th>
                <Th>Étage</Th>
                <Th>Surface</Th>
                <Th>Propriétaire</Th>
                <Th>% Copro</Th>
                <Th>Statut</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt, i) => {
                const rep = getRepresentative(apt.id)
                const ownerName = rep ? `${rep.firstName} ${rep.lastName}` : null
                const avatarSrc = rep?.profileImage ?? (rep?.gender === 'FEMALE' ? FEMALE_AVATAR : MALE_AVATAR)

                return (
                  <tr key={apt.id} className={cn('border-b last:border-0 hover:bg-muted/30 transition-colors', i % 2 !== 0 && 'bg-muted/10')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                          {apt.unitCode.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{apt.unitCode}</p>
                          <p className="text-[11px] text-muted-foreground">{apt.usageType === 'RESIDENTIAL' ? 'Résidentiel' : apt.usageType === 'COMMERCIAL' ? 'Commercial' : 'Mixte'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {apt.floor != null ? `Étage ${apt.floor}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {apt.areaSqm != null ? `${apt.areaSqm} m²` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {ownerName ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={avatarSrc} />
                            <AvatarFallback className="text-[10px]">{getInitials(ownerName)}</AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-medium">{ownerName}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {apt.percentageOfApartment != null ? `${apt.percentageOfApartment}%` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusConfig[apt.status].variant}>
                        {statusConfig[apt.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="text-xs h-7">Voir</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Home size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Aucun appartement trouvé</p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} appartement(s) affiché(s)</p>
      </div>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{children}</th>
}
