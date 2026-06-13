import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, Send, Image } from 'lucide-react'
import { mockFeedPosts } from '@/data/mock/feed'
import { getInitials } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function Feed() {
  const [newPost, setNewPost] = useState('')
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Feed Management" subtitle="Communauté — Résidence Al Nour"/>
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-5 animate-fade-in">

        {/* Compose */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="bg-primary/15 text-primary text-xs">SY</AvatarFallback></Avatar>
            <div className="flex-1">
              <textarea
                value={newPost} onChange={e=>setNewPost(e.target.value)}
                placeholder="Partagez une annonce avec votre résidence..."
                className="w-full resize-none text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] bg-muted/30"
              />
              <div className="flex items-center justify-between mt-2">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                  <Image size={13}/>Photo
                </Button>
                <Button size="sm" className="gap-1.5 text-xs" disabled={!newPost.trim()}>
                  <Send size={13}/>Publier
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {mockFeedPosts.map(post => (
          <div key={post.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-9 w-9 shrink-0"><AvatarFallback className="text-xs">{getInitials(post.authorName)}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{post.authorName}</span>
                  <Badge variant={post.authorRole==='Syndic'?'default':'secondary'} className="text-[10px] py-0">{post.authorRole}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), {addSuffix:true, locale:fr})} · {post.building}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-3">{post.content}</p>
            <div className="flex items-center gap-4 pt-2 border-t">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                <Heart size={14}/>{post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle size={14}/>{post.comments} commentaire{post.comments>1?'s':''}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
