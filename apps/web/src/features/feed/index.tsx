import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  defineFeedAbility, subject, ProfileRole,
  UPLOAD_MAX_SIZE_BYTES, UPLOAD_MAX_SIZE_LABEL, UPLOAD_MEDIA_MIME, mimeToMediaType,
} from '@i9amati/shared'
import type { FeedAbility, MembershipInfo } from '@i9amati/shared'
import { api } from '@/lib/api'
import { toastCreated, toastUpdated, toastDeleted, toastApiError, toastSuccess } from '@/components/toast'
import { TopBar } from '@/components/layout/TopBar'
import {
  feedApi,
  type ApiGroup, type ApiPost,
} from '@/lib/feed.api'
import { authClient } from '@/lib/auth-client'
import { PostFeedSection } from './sections/PostFeedSection'
import { GroupsSidebar } from './sections/GroupsSidebar'
import { GroupNameDialog } from './components/GroupNameDialog'
import { GroupMembersModal } from './components/GroupMembersModal'

export function Feed() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: session } = authClient.useSession()

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [membersGroupId, setMembersGroupId]   = useState<string | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [renameGroup, setRenameGroup]         = useState<ApiGroup | null>(null)

  // ── Groups ──────────────────────────────────────────────────────────────────
  const {
    data: groupsResponse,
    isLoading: groupsLoading,
    isError: groupsError,
  } = useQuery({
    queryKey: ['feed-groups'],
    queryFn:  feedApi.getGroups,
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

  const isSyndic     = groupsResponse?.profileRole === ProfileRole.SYNDIC
  const activeGroupId = selectedGroupId ?? groups[0]?.id ?? null
  const selectedGroup = groups.find(g => g.id === activeGroupId) ?? null
  const membersGroup  = groups.find(g => g.id === membersGroupId) ?? null

  // ── Posts (infinite) ───────────────────────────────────────────────────────
  const {
    data: postsData,
    isLoading: postsLoading,
    isError: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey:       ['feed-posts', activeGroupId],
    queryFn:        ({ pageParam }) => feedApi.getPosts(activeGroupId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    enabled:         !!activeGroupId,
  })
  const posts: ApiPost[] = postsData?.pages.flatMap(p => p.posts) ?? []

  // ── Group mutations ────────────────────────────────────────────────────────
  const createGroup = useMutation({
    mutationFn: (name: string) => feedApi.createGroup(name),
    onSuccess: data => {
      qc.invalidateQueries({ queryKey: ['feed-groups'] })
      setSelectedGroupId(data.id)
      toastCreated(t('success.groupCreated'))
    },
    onError: (err: any) => toastApiError(err),
  })

  const updateGroup = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => feedApi.updateGroup(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed-groups'] })
      setRenameGroup(null)
      toastUpdated(t('success.groupUpdated'))
    },
    onError: (err: any) => toastApiError(err),
  })

  const deleteGroup = useMutation({
    mutationFn: (id: string) => feedApi.deleteGroup(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['feed-groups'] })
      if (activeGroupId === id) setSelectedGroupId(null)
      toastDeleted(t('success.groupDeleted'))
    },
    onError: (err: any) => toastApiError(err),
  })

  // ── Post mutations ─────────────────────────────────────────────────────────
  const createPost = useMutation({
    mutationFn: async ({ content, file }: { content: string; file: File | null }) => {
      let mediaUrl: string | undefined
      let mediaType: 'image' | 'video' | undefined
      if (file) {
        if (!UPLOAD_MEDIA_MIME.includes(file.type as any)) throw new Error(`Invalid file type`)
        if (file.size > UPLOAD_MAX_SIZE_BYTES) throw new Error(`File too large. Max: ${UPLOAD_MAX_SIZE_LABEL}`)
        const res = await api.upload<{ url: string }>('/api/upload?scope=feed', file)
        mediaUrl  = res.url
        mediaType = mimeToMediaType(file.type)
      }
      return feedApi.createPost(activeGroupId!, { content, mediaUrl, mediaType })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed-posts', activeGroupId] })
      toastCreated(t('success.postCreated'))
    },
    onError: (err: any) => toastApiError(err),
  })

  const editPost = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      feedApi.updatePost(id, { content }),
    onMutate: async ({ id, content }) => {
      await qc.cancelQueries({ queryKey: ['feed-posts', activeGroupId] })
      const prev = qc.getQueryData(['feed-posts', activeGroupId])
      qc.setQueryData(['feed-posts', activeGroupId], (old: typeof postsData) =>
        old
          ? { ...old, pages: old.pages.map(page => ({ ...page, posts: page.posts.map(p => p.id === id ? { ...p, content } : p) })) }
          : old,
      )
      return { prev }
    },
    onError: (err: any, _v, ctx: { prev: unknown } | undefined) => {
      if (ctx?.prev) qc.setQueryData(['feed-posts', activeGroupId], ctx.prev)
      toastApiError(err)
    },
    onSuccess: () => toastUpdated(t('success.postUpdated')),
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed-posts', activeGroupId] }),
  })

  const deletePost = useMutation({
    mutationFn: (id: string) => feedApi.deletePost(id),
    onMutate: async id => {
      await qc.cancelQueries({ queryKey: ['feed-posts', activeGroupId] })
      const prev = qc.getQueryData(['feed-posts', activeGroupId])
      qc.setQueryData(['feed-posts', activeGroupId], (old: typeof postsData) =>
        old
          ? { ...old, pages: old.pages.map(page => ({ ...page, posts: page.posts.filter(p => p.id !== id) })) }
          : old,
      )
      return { prev }
    },
    onError: (err: any, _v, ctx: { prev: unknown } | undefined) => {
      if (ctx?.prev) qc.setQueryData(['feed-posts', activeGroupId], ctx.prev)
      toastApiError(err)
    },
    onSuccess: () => toastDeleted(t('success.postDeleted')),
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
        old
          ? { ...old, pages: old.pages.map(page => ({ ...page, posts: page.posts.map(p => p.id === id ? { ...p, likedByMe: !likedByMe, likeCount: likedByMe ? p.likeCount - 1 : p.likeCount + 1 } : p) })) }
          : old,
      )
      return { prev }
    },
    onError: (err: any, _v, ctx: { prev: unknown } | undefined) => {
      if (ctx?.prev) qc.setQueryData(['feed-posts', activeGroupId], ctx.prev)
      toastApiError(err)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed-posts', activeGroupId] }),
  })

  function handleToggleLike(postId: string) {
    const post = posts.find(p => p.id === postId)
    if (post) likePost.mutate({ id: postId, likedByMe: post.likedByMe })
  }

  const user = (session as any)?.user

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={t('feed.pageTitle')}
        subtitle={selectedGroup ? `${t('feed.postingTo')} — ${selectedGroup.name}` : t('feed.pageSubtitle')}
      />
      <div className="flex-1 flex gap-5 p-6 min-h-0">
        <PostFeedSection
          activeGroupId={activeGroupId}
          selectedGroup={selectedGroup}
          ability={ability}
          profileId={groupsResponse?.profileId ?? ''}
          authorName={user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name : null}
          authorAvatar={user?.image ?? null}
          posts={posts}
          postsLoading={postsLoading}
          postsError={postsError}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={!!hasNextPage}
          fetchNextPage={fetchNextPage}
          onCreatePost={(content, file) => createPost.mutate({ content, file })}
          onEditPost={(id, content) => editPost.mutate({ id, content })}
          onDeletePost={id => deletePost.mutate(id)}
          onToggleLike={handleToggleLike}
          isCreatingPost={createPost.isPending}
        />
        <GroupsSidebar
          groups={groups}
          groupsLoading={groupsLoading}
          groupsError={groupsError}
          activeGroupId={activeGroupId}
          isSyndic={isSyndic}
          onSelect={setSelectedGroupId}
          onViewMembers={setMembersGroupId}
          onRename={setRenameGroup}
          onDelete={id => deleteGroup.mutate(id)}
          onCreateGroup={() => setShowCreateGroup(true)}
        />
      </div>

      <GroupNameDialog
        open={showCreateGroup}
        title={t('feed.createGroupBtn')}
        onClose={() => setShowCreateGroup(false)}
        onSave={name => createGroup.mutate(name)}
      />
      {renameGroup && (
        <GroupNameDialog
          open
          title={`${t('feed.rename')} "${renameGroup.name}"`}
          initial={renameGroup.name}
          onClose={() => setRenameGroup(null)}
          onSave={name => updateGroup.mutate({ id: renameGroup.id, name })}
        />
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
