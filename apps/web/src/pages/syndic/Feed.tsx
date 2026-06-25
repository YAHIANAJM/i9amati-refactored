import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { defineFeedAbility, subject, ProfileRole } from '@i9amati/shared'
import type { FeedAbility, MembershipInfo } from '@i9amati/shared'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Heart, MessageCircle, Image, Video,
  Users, Building2, Settings2, Plus,
  ChevronRight, Pencil, Trash2, Send, Loader2, UserPlus, X,
} from 'lucide-react'
import {
  feedApi,
  type ApiGroup, type ApiPost, type ApiComment,
  type ApiMember, type ApiOrgProfile, type GroupType, type GroupsResponse,
} from '@/lib/feed.api'
import { cn, getInitials } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const GROUP_COLORS: Record<GroupType, string> = {
  residence: 'bg-blue-100 text-blue-700',
  building:  'bg-emerald-100 text-emerald-700',
  custom:    'bg-violet-100 text-violet-700',
}
const GROUP_ICONS: Record<GroupType, React.ReactNode> = {
  residence: <Users size={16} />,
  building:  <Building2 size={16} />,
  custom:    <Settings2 size={16} />,
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-28 bg-muted rounded" />
          <div className="h-2.5 w-16 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-4/5" />
      </div>
      <div className="flex gap-4 pt-2 border-t">
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
    </div>
  )
}

function GroupSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-3 flex items-center gap-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-2.5 w-16 bg-muted rounded" />
      </div>
    </div>
  )
}

// ── Create / Rename Group Dialog ──────────────────────────────────────────────

function GroupNameDialog({
  open, onClose, onSave, initial, title,
}: {
  open: boolean; onClose: () => void
  onSave: (name: string) => void
  initial?: string; title: string
}) {
  const [name, setName] = useState(initial ?? '')
  function handle() {
    if (!name.trim()) return
    onSave(name.trim())
    onClose()
  }
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm p-6">
        <DialogTitle className="text-base font-semibold mb-4">{title}</DialogTitle>
        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
            placeholder="Group name…"
            className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-muted/30"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={!name.trim()} onClick={handle}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Group Members Modal ───────────────────────────────────────────────────────

function GroupMembersModal({
  group, canManageMembers, onClose,
}: {
  group: ApiGroup; canManageMembers: boolean; onClose: () => void
}) {
  const qc = useQueryClient()
  const [showPicker, setShowPicker] = useState(false)

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['feed-group-members', group.id],
    queryFn: () => feedApi.getGroupMembers(group.id),
  })

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['org-profiles'],
    queryFn: feedApi.getOrgProfiles,
    enabled: showPicker,
  })

  const memberProfileIds = new Set(members.map(m => m.profileId))
  const available = allProfiles.filter(p => !memberProfileIds.has(p.profileId))

  const addMember = useMutation({
    mutationFn: (profileId: string) => feedApi.addGroupMember(group.id, profileId),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: ['feed-group-members', group.id] }),
      qc.invalidateQueries({ queryKey: ['feed-groups'] }),
    ]),
  })

  const removeMember = useMutation({
    mutationFn: (profileId: string) => feedApi.removeGroupMember(group.id, profileId),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: ['feed-group-members', group.id] }),
      qc.invalidateQueries({ queryKey: ['feed-groups'] }),
    ]),
  })

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="p-5 border-b shrink-0">
          <div className="flex items-center gap-3 pr-8">
            <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', GROUP_COLORS[group.type])}>
              {GROUP_ICONS[group.type]}
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">{group.name}</DialogTitle>
              <p className="text-xs text-muted-foreground">{loadingMembers ? group.memberCount : members.length} members</p>
            </div>
          </div>
        </div>

        <div className="p-2 overflow-y-auto flex-1">
          {loadingMembers ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-4">
              <Loader2 size={12} className="animate-spin" /> Loading…
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No members yet.</p>
          ) : (
            members.map(m => (
              <div key={m.membershipId} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={m.avatar ?? undefined} />
                  <AvatarFallback className="text-xs">{getInitials(m.name ?? '?')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.orgRole?.toLowerCase() ?? ''}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] py-0 shrink-0">{m.groupRole}</Badge>
                {canManageMembers && (
                  <button
                    onClick={() => removeMember.mutate(m.profileId)}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                  >
                    {removeMember.isPending ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t shrink-0">
          {canManageMembers && (
            <button
              onClick={() => setShowPicker(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <UserPlus size={14} /> Add member
              <span className="ml-auto text-muted-foreground text-[10px]">{available.length} available</span>
            </button>
          )}
          {canManageMembers && showPicker && (
            <div className="px-2 pb-2 max-h-[180px] overflow-y-auto border-t">
              {available.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">All members already added.</p>
              ) : available.map((p: ApiOrgProfile) => (
                <div key={p.profileId} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={p.image ?? undefined} />
                    <AvatarFallback className="text-[10px]">{getInitials(p.name ?? '?')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{p.orgRole?.toLowerCase()}</p>
                  </div>
                  <button
                    onClick={() => addMember.mutate(p.profileId)}
                    disabled={addMember.isPending}
                    className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shrink-0"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Comment List ──────────────────────────────────────────────────────────────

function CommentList({ postId, canComment }: { postId: string; canComment: boolean }) {
  const qc = useQueryClient()
  const [newComment, setNewComment] = useState('')

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['feed-comments', postId],
    queryFn: () => feedApi.getComments(postId),
  })

  const addComment = useMutation({
    mutationFn: (content: string) => feedApi.createComment(postId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed-comments', postId] })
      qc.invalidateQueries({ queryKey: ['feed-posts'] })
      setNewComment('')
    },
  })

  return (
    <div className="space-y-3 pt-1">
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 size={12} className="animate-spin" /> Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">No comments yet.</p>
      ) : (
        comments.map((c: ApiComment) => (
          <div key={c.id} className="flex items-start gap-2.5">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={c.authorAvatar ?? undefined} />
              <AvatarFallback className="text-[10px]">{getInitials(c.authorName ?? '?')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold">{c.authorName ?? 'Unknown'}</span>
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
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (newComment.trim()) addComment.mutate(newComment.trim()) } }}
            placeholder="Write a comment…"
            className="flex-1 resize-none text-xs border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-muted/30"
          />
          <button
            onClick={() => newComment.trim() && addComment.mutate(newComment.trim())}
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

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ post, canEdit, canDelete, canLike, canComment, onOptimisticLike, onEdit, onDelete }: {
  post: ApiPost
  canEdit: boolean
  canDelete: boolean
  canLike: boolean
  canComment: boolean
  onOptimisticLike: (id: string) => void
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState(post.content)

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 group/card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={post.authorAvatar ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(post.authorName ?? '?')}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{post.authorName ?? 'Unknown'}</span>
              <Badge variant={post.authorGroupRole === 'ADMIN' ? 'default' : 'secondary'} className="text-[10px] py-0">
                {post.authorGroupRole === 'ADMIN' ? 'Syndic' : 'Membre'}
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
              <button onClick={() => { setEditContent(post.content); setEditMode(true) }} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Pencil size={13} />
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(post.id)} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {editMode ? (
        <div className="space-y-2">
          <textarea autoFocus value={editContent} onChange={e => setEditContent(e.target.value)}
            className="w-full resize-none text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] bg-muted/30" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditContent(post.content); setEditMode(false) }}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs" disabled={!editContent.trim()} onClick={() => { onEdit(post.id, editContent.trim()); setEditMode(false) }}>Save</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
      )}

      {!editMode && (
        <div className="flex items-center gap-4 pt-2 border-t">
          {canLike && (
            <button onClick={() => onOptimisticLike(post.id)} className={cn('flex items-center gap-1.5 text-xs transition-colors', post.likedByMe ? 'text-red-500' : 'text-muted-foreground hover:text-red-500')}>
              <Heart size={14} className={post.likedByMe ? 'fill-red-500' : ''} />
              {post.likeCount}
            </button>
          )}
          <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle size={14} />
            {post.commentCount} commentaire{post.commentCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {showComments && !editMode && <CommentList postId={post.id} canComment={canComment} />}
    </div>
  )
}

// ── Group Card ────────────────────────────────────────────────────────────────

function GroupCard({ group, isActive, canManage, onSelect, onViewMembers, onRename, onDelete }: {
  group: ApiGroup; isActive: boolean; canManage: boolean
  onSelect: () => void; onViewMembers: () => void
  onRename: () => void; onDelete: () => void
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-3 flex items-center gap-3 transition-colors group/gcard', isActive && 'border-primary bg-primary/5')}>
      <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
        <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', GROUP_COLORS[group.type])}>
          {GROUP_ICONS[group.type]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{group.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{group.type} · {group.memberCount} members</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {canManage && (
          <>
            <button onClick={onRename} className="opacity-0 group-hover/gcard:opacity-100 h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-all text-muted-foreground hover:text-primary">
              <Pencil size={12} />
            </button>
            <button onClick={onDelete} className="opacity-0 group-hover/gcard:opacity-100 h-6 w-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500">
              <Trash2 size={12} />
            </button>
          </>
        )}
        <button onClick={onViewMembers} className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Feed Page ─────────────────────────────────────────────────────────────────

export function Feed() {
  const qc = useQueryClient()
  const [newPost, setNewPost] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [membersGroupId, setMembersGroupId] = useState<string | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [renameGroup, setRenameGroup] = useState<ApiGroup | null>(null)

  const { data: groupsResponse, isLoading: groupsLoading, isError: groupsError } = useQuery({
    queryKey: ['feed-groups'],
    queryFn: feedApi.getGroups,
  })
  const groups = groupsResponse?.groups ?? []

  const ability = useMemo<FeedAbility | null>(() => {
    if (!groupsResponse) return null
    const { profileId, profileRole, groups: gs } = groupsResponse
    const memberships: MembershipInfo[] = gs
      .filter(g => g.memberProfileGroupId != null)
      .map(g => ({
        profileGroupId: g.memberProfileGroupId!,
        groupId:        g.id,
        role:           (g.memberRole ?? 'USER') as MembershipInfo['role'],
      }))
    return defineFeedAbility(profileRole as ProfileRole, profileId, memberships)
  }, [groupsResponse])

  const isSyndic = groupsResponse?.profileRole === ProfileRole.SYNDIC

  const activeGroupId = selectedGroupId ?? groups[0]?.id ?? null
  const selectedGroup = groups.find(g => g.id === activeGroupId) ?? null
  const membersGroup = groups.find(g => g.id === membersGroupId) ?? null

  const { data: postsData, isLoading: postsLoading, isError: postsError } = useQuery({
    queryKey: ['feed-posts', activeGroupId],
    queryFn: () => feedApi.getPosts(activeGroupId!),
    enabled: !!activeGroupId,
  })
  const posts: ApiPost[] = postsData?.posts ?? []

  // ── Group mutations ───────────────────────────────────────────────────────
  const createGroup = useMutation({
    mutationFn: (name: string) => feedApi.createGroup(name),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['feed-groups'] })
      setSelectedGroupId(data.id)
    },
  })

  const updateGroup = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => feedApi.updateGroup(id, name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feed-groups'] }); setRenameGroup(null) },
  })

  const deleteGroup = useMutation({
    mutationFn: (id: string) => feedApi.deleteGroup(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['feed-groups'] })
      if (activeGroupId === id) setSelectedGroupId(null)
    },
  })

  // ── Post mutations ────────────────────────────────────────────────────────
  const createPost = useMutation({
    mutationFn: (content: string) => feedApi.createPost(activeGroupId!, content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feed-posts', activeGroupId] }); setNewPost('') },
  })

  const editPost = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => feedApi.updatePost(id, content),
    onMutate: async ({ id, content }) => {
      await qc.cancelQueries({ queryKey: ['feed-posts', activeGroupId] })
      const prev = qc.getQueryData(['feed-posts', activeGroupId])
      qc.setQueryData(['feed-posts', activeGroupId], (old: typeof postsData) =>
        old ? { ...old, posts: old.posts.map(p => p.id === id ? { ...p, content } : p) } : old)
      return { prev }
    },
    onError: (_e, _v, ctx: any) => { if (ctx?.prev) qc.setQueryData(['feed-posts', activeGroupId], ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed-posts', activeGroupId] }),
  })

  const deletePost = useMutation({
    mutationFn: (id: string) => feedApi.deletePost(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['feed-posts', activeGroupId] })
      const prev = qc.getQueryData(['feed-posts', activeGroupId])
      qc.setQueryData(['feed-posts', activeGroupId], (old: typeof postsData) =>
        old ? { ...old, posts: old.posts.filter(p => p.id !== id) } : old)
      return { prev }
    },
    onError: (_e, _v, ctx: any) => { if (ctx?.prev) qc.setQueryData(['feed-posts', activeGroupId], ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed-posts', activeGroupId] }),
  })

  const likePost = useMutation<void, Error, { id: string; likedByMe: boolean }, { prev: unknown }>({
    mutationFn: async ({ id, likedByMe }) => {
      if (likedByMe) await feedApi.unlikePost(id); else await feedApi.likePost(id)
    },
    onMutate: async ({ id, likedByMe }) => {
      await qc.cancelQueries({ queryKey: ['feed-posts', activeGroupId] })
      const prev = qc.getQueryData(['feed-posts', activeGroupId])
      qc.setQueryData(['feed-posts', activeGroupId], (old: typeof postsData) =>
        old ? { ...old, posts: old.posts.map(p => p.id === id ? { ...p, likedByMe: !likedByMe, likeCount: likedByMe ? p.likeCount - 1 : p.likeCount + 1 } : p) } : old)
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['feed-posts', activeGroupId], ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed-posts', activeGroupId] }),
  })

  function handleToggleLike(postId: string) {
    const post = posts.find(p => p.id === postId)
    if (post) likePost.mutate({ id: postId, likedByMe: post.likedByMe })
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Feed Management" subtitle={selectedGroup ? `Communauté — ${selectedGroup.name}` : 'Communauté'} />
      <div className="flex-1 flex gap-5 p-6 min-h-0">

        {/* Main feed */}
        <div className="flex-1 min-w-0 space-y-4">
          {activeGroupId && ability?.can('create', subject('FeedPost', { groupId: activeGroupId, authorId: '' })) && (
            <div className="rounded-xl border bg-card p-4">
              <p className="text-[11px] text-muted-foreground mb-2">
                Posting to <span className="font-medium text-foreground">{selectedGroup?.name ?? '…'}</span>
              </p>
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.metaKey && createPost.mutate(newPost.trim())}
                placeholder="What are you thinking of?" disabled={createPost.isPending}
                className="w-full resize-none text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] bg-muted/30 disabled:opacity-60" />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground"><Image size={13} /> Photo</Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground"><Video size={13} /> Video</Button>
                </div>
                <Button size="sm" className="gap-1.5 text-xs" disabled={!newPost.trim() || createPost.isPending} onClick={() => createPost.mutate(newPost.trim())}>
                  {createPost.isPending && <Loader2 size={12} className="animate-spin" />} Post
                </Button>
              </div>
            </div>
          )}

          {postsLoading ? (<><PostSkeleton /><PostSkeleton /><PostSkeleton /></>)
            : postsError ? (<div className="rounded-xl border bg-card p-6 text-center text-sm text-red-500">Failed to load posts.</div>)
            : posts.length === 0 ? (<div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">No posts in this group yet.</div>)
            : posts.map(post => (
              <PostCard key={post.id} post={post}
                canEdit={ability?.can('update', subject('FeedPost', { groupId: activeGroupId!, authorId: post.authorId })) ?? false}
                canDelete={ability?.can('delete', subject('FeedPost', { groupId: activeGroupId!, authorId: post.authorId })) ?? false}
                canLike={ability?.can('create', subject('FeedPostLike', { groupId: activeGroupId! })) ?? false}
                canComment={ability?.can('create', subject('FeedComment', { groupId: activeGroupId!, authorProfileId: groupsResponse?.profileId ?? '' })) ?? false}
                onOptimisticLike={handleToggleLike}
                onEdit={(id, content) => editPost.mutate({ id, content })}
                onDelete={id => deletePost.mutate(id)} />
            ))}
        </div>

        {/* Groups sidebar */}
        <div className="w-64 shrink-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-sm font-semibold">groups</p>
            {isSyndic && (
              <button onClick={() => setShowCreateGroup(true)} className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors">
                <Plus size={13} />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {groupsLoading ? (<><GroupSkeleton /><GroupSkeleton /><GroupSkeleton /></>)
              : groupsError ? (<p className="text-xs text-red-500 px-1">Failed to load groups.</p>)
              : groups.map(group => (
                <GroupCard key={group.id} group={group} isActive={group.id === activeGroupId}
                  canManage={isSyndic}
                  onSelect={() => setSelectedGroupId(group.id)}
                  onViewMembers={() => setMembersGroupId(group.id)}
                  onRename={() => setRenameGroup(group)}
                  onDelete={() => deleteGroup.mutate(group.id)} />
              ))}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <GroupNameDialog open={showCreateGroup} title="Create a group" onClose={() => setShowCreateGroup(false)}
        onSave={name => createGroup.mutate(name)} />
      {renameGroup && (
        <GroupNameDialog open title={`Rename "${renameGroup.name}"`} initial={renameGroup.name}
          onClose={() => setRenameGroup(null)}
          onSave={name => updateGroup.mutate({ id: renameGroup.id, name })} />
      )}
      {membersGroup && (
        <GroupMembersModal
          group={membersGroup}
          canManageMembers={isSyndic || membersGroup.memberRole === 'ADMIN'}
          onClose={() => setMembersGroupId(null)}
        />
      )}
    </div>
  )
}
