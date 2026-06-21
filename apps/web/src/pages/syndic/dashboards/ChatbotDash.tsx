import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { Bot, MessageSquare, Clock, ThumbsUp, TrendingUp, Users } from 'lucide-react'

const KPI = [
  { label: 'Total Conversations', value: '1,248', delta: '+18%', icon: MessageSquare, color: '#6366f1' },
  { label: 'Avg. Response Time', value: '1.4s', delta: '-0.3s', icon: Clock, color: '#10b981' },
  { label: 'Satisfaction Rate', value: '94%', delta: '+2%', icon: ThumbsUp, color: '#f59e0b' },
  { label: 'Active Users', value: '312', delta: '+24', icon: Users, color: '#3b82f6' },
]

const weeklyData = [
  { day: 'Mon', chats: 38, resolved: 34 },
  { day: 'Tue', chats: 52, resolved: 48 },
  { day: 'Wed', chats: 44, resolved: 40 },
  { day: 'Thu', chats: 61, resolved: 55 },
  { day: 'Fri', chats: 55, resolved: 50 },
  { day: 'Sat', chats: 30, resolved: 28 },
  { day: 'Sun', chats: 22, resolved: 20 },
]

const topicsData = [
  { name: 'Syndic Law', value: 34 },
  { name: 'Payments', value: 28 },
  { name: 'Complaints', value: 18 },
  { name: 'Meetings', value: 12 },
  { name: 'Documents', value: 8 },
]

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899']

const monthlyTrend = [
  { month: 'Jan', chats: 180 }, { month: 'Feb', chats: 220 }, { month: 'Mar', chats: 195 },
  { month: 'Apr', chats: 260 }, { month: 'May', chats: 310 }, { month: 'Jun', chats: 280 },
]

export function ChatbotDash() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Chatbot Analytics" subtitle="AI assistant usage and performance" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          {KPI.map(k => (
            <Card key={k.label} className="border-border/40 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                    <p className="text-2xl font-bold text-slate-800">{k.value}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">{k.delta} this week</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: k.color + '18' }}>
                    <k.icon size={18} style={{ color: k.color }} />
                  </div>
                </div>
                <div className="mt-3 h-1 w-full rounded-full bg-border/40">
                  <div className="h-full rounded-full" style={{ width: '70%', background: k.color }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">

          {/* Weekly chats bar chart */}
          <Card className="col-span-2 border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <TrendingUp size={15} className="text-indigo-500" />
                Weekly Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="chats" name="Chats" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Topics pie */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Bot size={15} className="text-indigo-500" />
                Top Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={topicsData} dataKey="value" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                    {topicsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-1.5">
                {topicsData.map((t, i) => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                      <span className="text-[11px] text-slate-600">{t.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{t.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly trend */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Monthly Chat Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="chats" stroke="#6366f1" strokeWidth={2} fill="url(#chatGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
