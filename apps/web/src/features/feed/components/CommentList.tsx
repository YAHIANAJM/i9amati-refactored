import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toastCreated, toastApiError } from '@/components/toast'
import { feedApi, type ApiComment } from '@/lib/feed.api'
import { getInitials } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface CommentListProps {
  postId:     string
  canComment: boolean
}

export function CommentList({ postId, canComment }: CommentListProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [newComment, setNewComment] = useState('')

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['feed-comments', postId],
    queryFn:  () => feedApi.getComments(postId),
  })

  const addComment = useMutation({
    mutationFn: (content: string) => feedApi.createComment(postId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed-comments', postId] })
      qc.invalidateQueries({ queryKey: ['feed-posts'] })
      setNewComment('')
      toastCreated(t('success.commentAdded'))
    },
    onError: (err: any) => toastApiError(err),
  })

  function submit() {
    if (newComment.trim()) addComment.mutate(newComment.trim())
  }

  return (
    <div className="space-y-3 pt-1">
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 size={12} className="animate-spin" /> {t('feed.loadingComments')}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">{t('feed.noCommentsYet')}</p>
      ) : (
        comments.map((c: ApiComment) => (
          <div key={c.id} className="flex items-start gap-2.5">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={c.authorAvatar ?? undefined} />
              <AvatarFallback className="text-[10px]">{getInitials(c.authorName ?? '?')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold">{c.authorName ?? t('feed.unknown')}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: fr })}
                </span>
              </div>
              <p className="text-xs leading-relaxed">{c.content}</p>
            </div>
          </div>
        ))
      )}
      {canComment && (
        <div className="flex items-start gap-2 pt-1">
          <textarea
            rows={1}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder={t('feed.writeComment')}
            className="flex-1 resize-none text-xs border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-muted/30"
          />
          <button
            onClick={submit}
            disabled={!newComment.trim() || addComment.isPending}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {addComment.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
      )}
    </div>
  )
}
