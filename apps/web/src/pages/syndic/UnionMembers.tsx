import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Phone, Mail, Building2 } from 'lucide-react'
import { mockUnionMembers } from '@/data/mock/union'
import { getInitials } from '@/lib/utils'

const roleVariant: Record<string, 'default'|'info'|'secondary'|'purple'> = {
  'Syndic Principal': 'default',
  'Syndic Délégué':  'info',
  'Trésorière':      'purple',
  'Syndic Helper':   'secondary',
}

export function UnionMembers() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Union Members"
        subtitle="Syndics délégués et helpers de l'union"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus size={13}/> Ajouter membre
          </Button>
        }
      />
      <div className="flex-1 p-6 animate-fade-in">
        <div className="rounded-xl border overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                {['Membre','Rôle','Immeuble','Contact','Statut',''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockUnionMembers.map((m, i) => (
                <tr key={m.id} className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${i%2!==0?'bg-muted/10':''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback></Avatar>
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail size={10}/>{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant[m.role]||'secondary'} className="text-[11px]">{m.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 size={11}/>{m.building}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone size={11}/>{m.phone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.status==='ACTIVE'?'success':'warning'}>{m.status==='ACTIVE'?'Actif':'En attente'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="text-xs h-7">Voir</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
