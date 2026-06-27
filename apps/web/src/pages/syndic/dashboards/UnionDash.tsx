import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { mockRightHands, mockPartnerSyndics } from '@/data/mock/union'
import { UserCheck, Share2, Building2 } from 'lucide-react'

const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444']

// right hand stats
const rhActive  = mockRightHands.filter(r => r.status === 'ACTIVE').length
const rhPending = mockRightHands.filter(r => r.status === 'PENDING').length

// buildings covered
const buildingCoverage = mockRightHands.map(r => r.building)

// partner shared-parts distribution
const sharedPartCounts: Record<string, number> = {}
mockPartnerSyndics.forEach(ps => {
  ps.sharedParts.forEach(p => {
    sharedPartCounts[p] = (sharedPartCounts[p] || 0) + 1
  })
})
const sharedPie = Object.entries(sharedPartCounts).map(([name, value], i) => ({
  name, value, color: COLORS[i % COLORS.length],
}))

export function UnionDash() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Union Analytics" subtitle="Délégués d'immeubles et syndics partenaires" />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* ── KPI row ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Délégués actifs',       value: rhActive,                    icon: <UserCheck size={16} />, color: 'text-primary',     bg: 'bg-primary/8'   },
            { label: 'En attente',            value: rhPending,                   icon: <UserCheck size={16} />, color: 'text-amber-600',   bg: 'bg-amber-50'    },
            { label: 'Immeubles couverts',    value: buildingCoverage.length,     icon: <Building2 size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50'  },
            { label: 'Syndics partenaires',   value: mockPartnerSyndics.length,   icon: <Share2 size={16} />,    color: 'text-purple-600',  bg: 'bg-purple-50'   },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.bg} ${k.color}`}>
                  {k.icon}
                </div>
                <div>
                  <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5">

          {/* ── Immeubles couverts ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCheck size={14} className="text-primary" /> Délégués par immeuble
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-1">
              {mockRightHands.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucun délégué</p>
              )}
              {mockRightHands.map(rh => (
                <div key={rh.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{rh.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 size={9} /> {rh.building}
                    </p>
                  </div>
                  <Badge variant={rh.status === 'ACTIVE' ? 'success' : 'warning'} className="text-[10px]">
                    {rh.status === 'ACTIVE' ? 'Actif' : 'En attente'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Shared parts breakdown ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Share2 size={14} className="text-emerald-600" /> Parties communes partagées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sharedPie.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucun partenaire</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sharedPie} cx="50%" cy="50%"
                      innerRadius={40} outerRadius={72} paddingAngle={3} dataKey="value">
                      {sharedPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(v: number, name: string) => [`${v} syndic${v > 1 ? 's' : ''}`, name]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Partner list ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Share2 size={14} className="text-emerald-600" /> Syndics partenaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-1">
            {mockPartnerSyndics.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun partenaire enregistré</p>
            )}
            {mockPartnerSyndics.map(ps => (
              <div key={ps.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-foreground">{ps.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{ps.residence}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end max-w-[240px]">
                  {ps.sharedParts.map(p => (
                    <span key={p} className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
