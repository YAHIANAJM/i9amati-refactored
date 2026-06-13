import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { mockPaymentStats, mockPayments } from '@/data/mock/payments'
import { formatCurrency } from '@/lib/utils'

const statusPie = [
  { name: 'Payé',       value: mockPayments.filter(p=>p.status==='PAID').length,    color: '#22c55e' },
  { name: 'En attente', value: mockPayments.filter(p=>p.status==='PENDING').length, color: '#f59e0b' },
  { name: 'En retard',  value: mockPayments.filter(p=>p.status==='OVERDUE').length, color: '#ef4444' },
]

export function PaymentsDash() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Payments Analytics" subtitle="Revenus, collecte et tendances" />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Collecté ce mois',   value: formatCurrency(mockPaymentStats.totalCollected), color: 'text-emerald-600' },
            { label: 'En attente',          value: formatCurrency(mockPaymentStats.totalPending),   color: 'text-amber-600' },
            { label: 'Taux de collecte',    value: `${mockPaymentStats.collectionRate}%`,           color: 'text-primary' },
          ].map(k => (
            <Card key={k.label}><CardContent className="p-4 text-center">
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Card className="col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Tendance mensuelle (MAD)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={mockPaymentStats.monthlyTrend}>
                  <defs>
                    <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(221 83% 53%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="month" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
                  <Tooltip formatter={(v:number)=>[formatCurrency(v)]} contentStyle={{fontSize:12,borderRadius:8}}/>
                  <Area type="monotone" dataKey="collected" stroke="hsl(221 83% 53%)" fill="url(#gCollected)" name="Collecté"/>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Statuts des paiements</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {statusPie.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
