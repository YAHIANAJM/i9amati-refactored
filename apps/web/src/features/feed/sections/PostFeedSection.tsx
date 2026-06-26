import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageIcon, Loader2, Send, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { type ApiPost, type ApiGroup } from '@/lib/feed.api'
import { cn } from '@/lib/utils'
import { PostCard } from '../components/PostCard'
import { PostSkeleton } from '../components/PostSkeleton'
import type { FeedAbility } from '@i9amati/shared'
import { CreateFeedPostSchema } from '@i9amati/shared'
import { z } from 'zod'
import { subject } from '@casl/ability'
import { toastApiError } from '@/components/toast'

interface PostFeedSectionProps {
  activeGroupId:      string | null
  selectedGroup:      ApiGroup | null
  ability:            FeedAbility | null
  profileId:          string
  authorName:         string | null
  authorAvatar:       string | null
  posts:              ApiPost[]
  postsLoading:       boolean
  postsError:         boolean
  isFetchingNextPage: boolean
  hasNextPage:        boolean
  fetchNextPage:      () => void
  onCreatePost:       (content: string, file: File | null) => void
  onEditPost:         (id: string, content: string) => void
  onDeletePost:       (id: string) => void
  onToggleLike:       (postId: string) => void
  isCreatingPost:     boolean
}

export function PostFeedSection({
  activeGroupId, selectedGroup, ability, profileId,
  authorName, authorAvatar,
  posts, postsLoading, postsError,
  isFetchingNextPage, hasNextPage, fetchNextPage,
  onCreatePost, onEditPost, onDeletePost, onToggleLike,
  isCreatingPost,
}: PostFeedSectionProps) {
  const { t } = useTranslation()
  const [newPost, setNewPost]           = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null)
  const fileInputRef                    = useRef<HTMLInputElement>(null)
  const sentinelRef                     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  function clearFile() {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function submitPost() {
    if (!newPost.trim()) return
    try {
      CreateFeedPostSchema.parse({ content: newPost.trim() })
      onCreatePost(newPost.trim(), selectedFile)
      setNewPost('')
      clearFile()
    } catch (err) {
      if (err instanceof z.ZodError) {
        toastApiError({ error: { code: 'VALIDATION_ERROR', message: err.errors.map(e => e.message).join('|') } })
      } else {
        toastApiError(err)
      }
    }
  }

  const canPost = ability?.can('create', subject('FeedPost', { groupId: activeGroupId ?? '', authorId: profileId })) ?? false

  return (
    <div className="flex-1 min-w-0 space-y-4">
      {/* Create post box */}
      {canPost && activeGroupId && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0 mt-0.5">
              <AvatarImage src={authorAvatar ?? undefined} />
              <AvatarFallback className="text-xs">{authorName?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>{t('feed.postingTo')}</span>
                <span className="font-semibold text-foreground">{selectedGroup?.name}</span>
              </div>
              <textarea
                rows={3}
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder={t('feed.whatAreYouThinking')}
                className="w-full resize-none text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-ring bg-muted/30"
              />
              {previewUrl && selectedFile && (
                <div className="relative inline-block max-w-full">
                  {selectedFile.type.startsWith('video/') ? (
                    <video
                      src={previewUrl}
                      controls
                      className="max-h-40 rounded-lg border bg-black"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="max-h-40 rounded-lg border object-cover"
                    />
                  )}
                  <button
                    onClick={clearFile}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ImageIcon size={14} /> {t('feed.photoVideo')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  disabled={!newPost.trim() || isCreatingPost}
                  onClick={submitPost}
                >
                  {isCreatingPost
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Send size={13} />}
                  {isCreatingPost ? t('feed.publishing') : t('feed.post')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!activeGroupId && !postsLoading && (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-2">
          <p className="text-sm font-medium">{t('feed.selectGroup')}</p>
          <p className="text-xs text-muted-foreground">{t('feed.selectGroupDesc')}</p>
        </div>
      )}

      {/* Posts list */}
      {postsLoading ? (
        <><PostSkeleton /><PostSkeleton /><PostSkeleton /></>
      ) : postsError ? (
        <p className="text-sm text-red-500">{t('feed.postsLoadError')}</p>
      ) : posts.length === 0 && activeGroupId ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-2">
          <p className="text-sm font-medium">{t('feed.noPostsYet')}</p>
          {canPost && <p className="text-xs text-muted-foreground">{t('feed.beFirstToPost')}</p>}
        </div>
      ) : (
        posts.map(post => {
          const gid          = activeGroupId ?? ''
          const tagged       = subject('FeedPost', { groupId: gid, authorId: post.authorId })
          const taggedLike   = subject('FeedPostLike', { groupId: gid })
          const taggedComment = subject('FeedComment', { groupId: gid, authorProfileId: profileId })
          return (
            <PostCard
              key={post.id}
              post={post}
              canEdit={ability?.can('update', tagged) ?? false}
              canDelete={ability?.can('delete', tagged) ?? false}
              canLike={ability?.can('create', taggedLike) ?? false}
              canComment={ability?.can('create', taggedComment) ?? false}
              onOptimisticLike={onToggleLike}
              onEdit={onEditPost}
              onDelete={onDeletePost}
            />
          )
        })
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-2" />
      {isFetchingNextPage && (
        <div className={cn('flex justify-center py-4')}>
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
