import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { mockServices } from '@/data/mock/services'
import { formatCurrency } from '@/lib/utils'

export function ServicesDash() {
  const totalContract = mockServices.reduce((s,v)=>s+v.contractAmount, 0)
  const totalPaid     = mockServices.reduce((s,v)=>s+v.amountPaid, 0)
  const totalPending  = mockServices.reduce((s,v)=>s+v.amountRemaining, 0)

  const barData = mockServices.map(s=>({
    name: s.company.split(' ')[0],
    payé: s.amountPaid,
    restant: s.amountRemaining,
  }))

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Services Analytics" subtitle="Suivi financier des prestataires"/>
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Valeur totale contrats', value: formatCurrency(totalContract), color:'text-foreground' },
            { label:'Total payé',             value: formatCurrency(totalPaid),     color:'text-emerald-600' },
            { label:'Restant à payer',        value: formatCurrency(totalPending),  color:'text-amber-600' },
          ].map(k=>(
            <Card key={k.label}><CardContent className="p-4 text-center">
              <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Payé vs Restant par prestataire</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
                  <Tooltip formatter={(v:number)=>[formatCurrency(v)]} contentStyle={{fontSize:12,borderRadius:8}}/>
                  <Bar dataKey="payé"    fill="#22c55e" name="Payé"    radius={[4,4,0,0]}/>
                  <Bar dataKey="restant" fill="#f59e0b" name="Restant" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Progression des paiements</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-2">
              {mockServices.map(s=>{
                const pct = Math.round((s.amountPaid/s.contractAmount)*100)
                return (
                  <div key={s.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium">{s.company}</span>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2"/>
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
