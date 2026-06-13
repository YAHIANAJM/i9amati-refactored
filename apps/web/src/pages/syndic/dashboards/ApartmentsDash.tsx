import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { mockApartments } from '@/data/mock/apartments'

const statusCount = {
  OCCUPIED:    mockApartments.filter(a => a.status === 'OCCUPIED').length,
  VACANT:      mockApartments.filter(a => a.status === 'VACANT').length,
  MAINTENANCE: mockApartments.filter(a => a.status === 'MAINTENANCE').length,
}
const pieData = [
  { name: 'Occupés',    value: statusCount.OCCUPIED,    color: '#22c55e' },
  { name: 'Vacants',    value: statusCount.VACANT,      color: '#94a3b8' },
  { name: 'En travaux', value: statusCount.MAINTENANCE, color: '#f59e0b' },
]
const floorData = [1,2,3].map(f => ({
  floor: `Étage ${f}`,
  occupied: mockApartments.filter(a => a.floor === f && a.status === 'OCCUPIED').length,
  vacant:   mockApartments.filter(a => a.floor === f && a.status !== 'OCCUPIED').length,
}))

export function ApartmentsDash() {
  const total = mockApartments.length
  const occupancyRate = Math.round((statusCount.OCCUPIED / total) * 100)

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Apartments Analytics" subtitle="KPIs et statistiques d'occupation" />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total unités',     value: total,                    color: 'text-foreground' },
            { label: 'Occupés',          value: statusCount.OCCUPIED,     color: 'text-emerald-600' },
            { label: 'Vacants',          value: statusCount.VACANT,       color: 'text-slate-500' },
            { label: 'Taux occupation',  value: `${occupancyRate}%`,      color: 'text-primary' },
          ].map(k => (
            <Card key={k.label}><CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Pie */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Répartition par statut</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} appts`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar by floor */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Occupation par étage</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={floorData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="floor" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="occupied" fill="#22c55e" name="Occupés"    radius={[4,4,0,0]} />
                  <Bar dataKey="vacant"   fill="#e2e8f0" name="Non occupés" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
