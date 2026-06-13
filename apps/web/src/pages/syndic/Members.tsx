import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Plus, Search, Phone, Mail } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useState } from 'react'

const mockMembers = [
  { id: '1', name: 'Mohammed El Fassi', email: 'melfassi@gmail.com', phone: '+212 6 61 23 45 67', role: 'OWNER', apartment: 'A101' },
  { id: '2', name: 'Fatima Zahra Benhaddou', email: 'fzbenhaddou@gmail.com', phone: '+212 6 72 34 56 78', role: 'OWNER', apartment: 'A102' },
  { id: '3', name: 'Youssef Alami', email: 'yalami@gmail.com', phone: '+212 6 83 45 67 89', role: 'OWNER', apartment: 'A103' },
  { id: '4', name: 'Khadija Benali', email: 'kbenali@gmail.com', phone: '+212 6 94 56 78 90', role: 'OWNER', apartment: 'B201' },
  { id: '5', name: 'Omar Tahiri', email: 'otahiri@gmail.com', phone: '+212 6 55 67 89 01', role: 'TENANT', apartment: 'B201' },
  { id: '6', name: 'Hassan Cherkaoui', email: 'hcherkaoui@gmail.com', phone: '+212 6 66 78 90 12', role: 'OWNER', apartment: 'B202' },
  { id: '7', name: 'Aicha Lamrani', email: 'alamrani@gmail.com', phone: '+212 6 77 89 01 23', role: 'OWNER', apartment: 'B203' },
  { id: '8', name: 'Rachid Bouazza', email: 'rbouazza@gmail.com', phone: '+212 6 88 90 12 34', role: 'OWNER', apartment: 'C301' },
  { id: '9', name: 'Nadia Tazi', email: 'ntazi@gmail.com', phone: '+212 6 99 01 23 45', role: 'OWNER', apartment: 'C302' },
]

const roleConfig = {
  OWNER: { label: 'Propriétaire', variant: 'info' as const },
  TENANT: { label: 'Locataire', variant: 'secondary' as const },
}

export function Members() {
  const [search, setSearch] = useState('')
  const filtered = mockMembers.filter(m =>
    search === '' || m.name.toLowerCase().includes(search.toLowerCase()) || m.apartment.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Membres"
        subtitle={`${mockMembers.length} propriétaires et locataires`}
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus size={13} /> Ajouter un membre
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-4 animate-fade-in">
        <div className="relative flex items-center w-64">
          <Search size={13} className="absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un membre..."
            className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="rounded-xl border overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <Th>Membre</Th>
                <Th>Appartement</Th>
                <Th>Téléphone</Th>
                <Th>Email</Th>
                <Th>Rôle</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center h-6 w-14 rounded-md bg-primary/10 text-primary text-xs font-bold">
                      {m.apartment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone size={11} /> {m.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail size={11} /> {m.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleConfig[m.role as keyof typeof roleConfig].variant}>
                      {roleConfig[m.role as keyof typeof roleConfig].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="text-xs h-7">Voir</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} membre(s)</p>
      </div>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{children}</th>
}
