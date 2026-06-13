import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { mockAccountingStats, mockDailyEntries } from '@/data/mock/accounting'
import { formatCurrency } from '@/lib/utils'

const categoryTotals = mockDailyEntries.reduce((acc, e) => {
  if (e.type === 'DEBIT') acc[e.category] = (acc[e.category] || 0) + e.amount
  return acc
}, {} as Record<string,number>)

const catPie = Object.entries(categoryTotals).map(([name, value], i) => ({
  name, value, color: ['#3b82f6','#f59e0b','#ef4444','#8b5cf6'][i % 4]
}))

const monthlyBalance = [
  { month: 'Jan', credits: 18200, debits: 9800 },
  { month: 'Fév', credits: 21000, debits: 11200 },
  { month: 'Mar', credits: 19500, debits: 10500 },
  { month: 'Avr', credits: 22000, debits: 13000 },
  { month: 'Mai', credits: 20800, debits: 11800 },
  { month: 'Jun', credits: 18450, debits: 12300 },
]

export function AccountingDash() {
  const s = mockAccountingStats
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Accounting Analytics" subtitle="Daftar yawmi · Ostad · Jard"/>
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Total Crédits', value: formatCurrency(s.totalCredits), color:'text-emerald-600' },
            { label:'Total Débits',  value: formatCurrency(s.totalDebits),  color:'text-red-600' },
            { label:'Solde net',     value: formatCurrency(s.balance),      color:'text-primary' },
          ].map(k=>(
            <Card key={k.label}><CardContent className="p-4 text-center">
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Crédits vs Débits (mensuel)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyBalance} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="month" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
                  <Tooltip formatter={(v:number)=>[formatCurrency(v)]} contentStyle={{fontSize:12,borderRadius:8}}/>
                  <Bar dataKey="credits" fill="#22c55e" name="Crédits" radius={[4,4,0,0]}/>
                  <Bar dataKey="debits"  fill="#ef4444" name="Débits"  radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Répartition des dépenses</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={catPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {catPie.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v:number)=>[formatCurrency(v)]}/><Legend/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
