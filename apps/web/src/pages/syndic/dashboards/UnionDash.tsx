import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { mockUnionMembers } from '@/data/mock/union'

const byRole = mockUnionMembers.reduce((acc, m) => {
  acc[m.role] = (acc[m.role] || 0) + 1
  return acc
}, {} as Record<string, number>)

const colors = ['#3b82f6','#22c55e','#8b5cf6','#f59e0b']
const rolePie = Object.entries(byRole).map(([name, value], i) => ({ name, value, color: colors[i%colors.length] }))

export function UnionDash() {
  const active  = mockUnionMembers.filter(m=>m.status==='ACTIVE').length
  const pending = mockUnionMembers.filter(m=>m.status==='PENDING').length

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Union Analytics" subtitle="Vue d'ensemble des membres de l'union"/>
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Total membres', value: mockUnionMembers.length, color:'text-foreground' },
            { label:'Actifs',        value: active,                  color:'text-emerald-600' },
            { label:'En attente',    value: pending,                 color:'text-amber-600' },
          ].map(k=>(
            <Card key={k.label}><CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Répartition par rôle</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={rolePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {rolePie.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip/><Legend/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Membres par immeuble</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-2">
              {['Al Nour','Atlas','Marina'].map(b=>{
                const count = mockUnionMembers.filter(m=>m.building===b).length
                return (
                  <div key={b} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                    <span className="text-sm font-medium">{b}</span>
                    <Badge variant="info">{count} membre{count>1?'s':''}</Badge>
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
