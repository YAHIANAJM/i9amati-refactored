import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { mockFeedPosts } from '@/data/mock/feed'

const engagementData = mockFeedPosts.map(p => ({
  name: p.authorName.split(' ')[0],
  likes: p.likes,
  comments: p.comments,
}))

export function FeedDash() {
  const totalLikes    = mockFeedPosts.reduce((s,p)=>s+p.likes, 0)
  const totalComments = mockFeedPosts.reduce((s,p)=>s+p.comments, 0)

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Feed Analytics" subtitle="Engagement et activité communautaire"/>
      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Publications', value: mockFeedPosts.length },
            { label:'Total Likes',  value: totalLikes },
            { label:'Commentaires', value: totalComments },
          ].map(k=>(
            <Card key={k.label}><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Engagement par publication</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={engagementData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
                <Bar dataKey="likes"    fill="#ef4444" name="Likes"       radius={[4,4,0,0]}/>
                <Bar dataKey="comments" fill="#3b82f6" name="Commentaires" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
