import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { mockMeetings } from '@/data/mock/meetings'
import { formatDate } from '@/lib/utils'

const statusPie = [
  { name: 'Planifiée', value: mockMeetings.filter(m => m.status === 'SCHEDULED').length, color: '#3b82f6' },
  { name: 'Terminée', value: mockMeetings.filter(m => m.status === 'COMPLETED').length, color: '#22c55e' },
  { name: 'Annulée', value: mockMeetings.filter(m => m.status === 'CANCELLED').length, color: '#94a3b8' },
]

const mockVotes = [
  { title: 'Remplacement moteur ascenseur', yes: 14, no: 3, abstain: 2, status: 'OPEN' },
  { title: 'Budget travaux toiture 2024', yes: 12, no: 5, abstain: 1, status: 'CLOSED' },
  { title: 'Changement gardien', yes: 8, no: 7, abstain: 3, status: 'OPEN' },
]

export function MeetingsDash() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Meetings & Voting Analytics" subtitle="Statistiques des réunions et votes" />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total réunions', value: mockMeetings.length },
            { label: 'Planifiées', value: mockMeetings.filter(m => m.status === 'SCHEDULED').length },
            { label: 'Votes actifs', value: mockVotes.filter(v => v.status === 'OPEN').length },
          ].map(k => (
            <Card key={k.label}><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Statuts des réunions</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Résultats des votes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {mockVotes.map(v => {
                const total = v.yes + v.no + v.abstain
                return (
                  <div key={v.title} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-medium leading-snug">{v.title}</p>
                      <Badge variant={v.status === 'OPEN' ? 'info' : 'secondary'} className="text-[10px] ml-2 shrink-0">{v.status === 'OPEN' ? 'Ouvert' : 'Fermé'}</Badge>
                    </div>
                    <div className="flex gap-3 text-[11px]">
                      <span className="text-emerald-600 font-semibold">✓ {v.yes} ({Math.round(v.yes / total * 100)}%)</span>
                      <span className="text-red-500 font-semibold">✗ {v.no} ({Math.round(v.no / total * 100)}%)</span>
                      <span className="text-muted-foreground">- {v.abstain}</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden mt-2 bg-muted">
                      <div className="bg-emerald-500 h-full" style={{ width: `${v.yes / total * 100}%` }} />
                      <div className="bg-red-400 h-full" style={{ width: `${v.no / total * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
