import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type ApiPost } from '@/lib/feed.api'
import { getInitials, cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CommentList } from './CommentList'

interface PostCardProps {
  post:             ApiPost
  canEdit:          boolean
  canDelete:        boolean
  canLike:          boolean
  canComment:       boolean
  onOptimisticLike: (id: string) => void
  onEdit:           (id: string, content: string) => void
  onDelete:         (id: string) => void
}

export function PostCard({
  post, canEdit, canDelete, canLike, canComment,
  onOptimisticLike, onEdit, onDelete,
}: PostCardProps) {
  const { t } = useTranslation()
  const [showComments, setShowComments] = useState(false)
  const [editMode, setEditMode]         = useState(false)
  const [editContent, setEditContent]   = useState(post.content)

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 group/card">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={post.authorAvatar ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(post.authorName ?? '?')}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{post.authorName ?? t('feed.unknown')}</span>
              <Badge
                variant={post.authorGroupRole === 'ADMIN' ? 'default' : 'secondary'}
                className="text-[10px] py-0"
              >
                {post.authorGroupRole === 'ADMIN' ? t('feed.syndicBadge') : t('feed.memberBadge')}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
        {!editMode && (canEdit || canDelete) && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
            {canEdit && (
              <button
                onClick={() => { setEditContent(post.content); setEditMode(true) }}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Pencil size={13} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {editMode ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full resize-none text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] bg-muted/30"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost" size="sm" className="h-7 text-xs"
              onClick={() => { setEditContent(post.content); setEditMode(false) }}
            >
              {t('feed.cancel')}
            </Button>
            <Button
              size="sm" className="h-7 text-xs"
              disabled={!editContent.trim()}
              onClick={() => { onEdit(post.id, editContent.trim()); setEditMode(false) }}
            >
              {t('feed.save')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
          {post.mediaUrl && post.mediaType === 'image' && (
            <div className="rounded-lg overflow-hidden border bg-muted">
              <img src={post.mediaUrl} alt="Post attachment" className="w-full max-h-96 object-contain" />
            </div>
          )}
          {post.mediaUrl && post.mediaType === 'video' && (
            <div className="rounded-lg overflow-hidden border bg-black">
              <video src={post.mediaUrl} controls className="w-full max-h-96" />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {!editMode && (
        <div className="flex items-center gap-4 pt-2 border-t">
          {canLike && (
            <button
              onClick={() => onOptimisticLike(post.id)}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                post.likedByMe ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
              )}
            >
              <Heart size={14} className={post.likedByMe ? 'fill-red-500' : ''} />
              {post.likeCount}
            </button>
          )}
          <button
            onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle size={14} />
            {t('feed.comment')} ({post.commentCount})
          </button>
        </div>
      )}

      {showComments && !editMode && <CommentList postId={post.id} canComment={canComment} />}
    </div>
  )
}
