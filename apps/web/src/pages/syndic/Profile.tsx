import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Building2, Edit } from 'lucide-react'

export function Profile() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Profile" subtitle="Vos informations personnelles"
        actions={<Button size="sm" variant="outline" className="gap-1.5 text-xs"><Edit size={13}/>Modifier</Button>}
      />
      <div className="flex-1 p-6 max-w-2xl animate-fade-in space-y-5">
        <Card>
          <CardContent className="p-6 flex items-start gap-5">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">SY</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold">Ahmed Syndic</h2>
                <Badge variant="default">Syndic Principal</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">auth.union_agent · Membre depuis Jan 2023</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Mail size={13}/>syndic@i9amati.ma</span>
                <span className="flex items-center gap-1.5 text-muted-foreground"><Phone size={13}/>+212 6 61 00 11 22</span>
                <span className="flex items-center gap-1.5 text-muted-foreground"><Building2 size={13}/>3 résidences</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Résidences gérées</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {['Résidence Al Nour — Casablanca', 'Résidence Atlas — Rabat', 'Résidence Marina — Agadir'].map(r => (
              <div key={r} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40">
                <div className="h-2 w-2 rounded-full bg-emerald-500"/>
                <span className="text-sm">{r}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
