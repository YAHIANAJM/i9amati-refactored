import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Heart, MessageCircle, Image, Video,
  Users, Building2, Settings2,
  Plus, ChevronRight, Phone, Mail, CalendarDays,
  UserPlus, Pencil, Trash2,
} from 'lucide-react'
import {
  mockFeedPosts, mockGroups, mockUsers, mockGroupMembers,
  type MockFeedPost, type MockGroup, type MockUser, type GroupType,
} from '@/data/mock/feed'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Constants ──────────────────────────────────────────────────────────────────

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

const CURRENT_USER = mockUsers[0] // Ahmed Benali (Syndic) — the logged-in user

// ── Helpers ───────────────────────────────────────────────────────────────────

function isSyndic(role: string) {
  return role === 'Syndic' || role === 'Délégué'
}

// ── Create Group Dialog ───────────────────────────────────────────────────────

function CreateGroupDialog({
  open, onClose, onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => void
}) {
  const [name, setName] = useState('')

  function handleCreate() {
    if (!name.trim()) return
    onCreate(name.trim())
    setName('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm p-6">
        <DialogTitle className="text-base font-semibold mb-4">Create a group</DialogTitle>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Group name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Propriétaires Bâtiment C"
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-muted/30"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={!name.trim()} onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── User Profile Modal ────────────────────────────────────────────────────────

function UserProfileModal({ user, onClose }: { user: MockUser; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-xs p-0 overflow-hidden">
        <div className="bg-primary/10 px-6 pt-8 pb-5 flex flex-col items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar ?? undefined} />
            <AvatarFallback className="text-lg font-semibold">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-sm font-semibold">{user.name}</p>
            <Badge variant={isSyndic(user.role) ? 'default' : 'secondary'} className="text-[10px] mt-1.5">
              {user.role}
            </Badge>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <Row icon={<Building2 size={14} />} text={user.apartment} />
          {user.phone && <Row icon={<Phone size={14} />} text={user.phone} />}
          {user.email && <Row icon={<Mail size={14} />} text={user.email} muted />}
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground pt-1 border-t">
            <CalendarDays size={12} className="shrink-0" />
            <span>Member since {formatDate(user.joinedAt)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({ icon, text, muted }: { icon: React.ReactNode; text: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className={muted ? 'text-muted-foreground truncate' : ''}>{text}</span>
    </div>
  )
}

// ── Group Members Modal ───────────────────────────────────────────────────────

function GroupMembersModal({
  group, members, availableUsers,
  onClose, onSelectUser, onAddMember, onRemoveMember,
}: {
  group: MockGroup
  members: MockUser[]
  availableUsers: MockUser[]
  onClose: () => void
  onSelectUser: (user: MockUser) => void
  onAddMember: (userId: string) => void
  onRemoveMember: (userId: string) => void
}) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>

        {/* Header */}
        <div className="p-5 border-b shrink-0">
          <div className="flex items-center gap-2 pr-8">
            <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', GROUP_COLORS[group.type])}>
              {GROUP_ICONS[group.type]}
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold leading-tight">{group.name}</DialogTitle>
              <p className="text-xs text-muted-foreground">{members.length} members</p>
            </div>
          </div>
        </div>

        {/* Members list */}
        <div className="p-2 overflow-y-auto flex-1">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No members yet.</p>
          ) : (
            members.map(user => (
              <div key={user.id} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
                {/* Clickable area → profile */}
                <button onClick={() => onSelectUser(user)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user.avatar ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.apartment}</p>
                  </div>
                  <Badge variant={isSyndic(user.role) ? 'default' : 'secondary'} className="text-[10px] py-0 shrink-0">
                    {user.role}
                  </Badge>
                </button>

                {/* Remove button — appears on hover */}
                <button
                  onClick={() => onRemoveMember(user.id)}
                  className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add member panel */}
        <div className="border-t shrink-0">
          <button
            onClick={() => setShowAdd(v => !v)}
            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <UserPlus size={14} />
            Add member
            <span className="ml-auto text-muted-foreground text-[10px]">{availableUsers.length} available</span>
          </button>

          {showAdd && (
            <div className="px-2 pb-2 max-h-[200px] overflow-y-auto border-t">
              {availableUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">All users are already members.</p>
              ) : (
                availableUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={user.avatar ?? undefined} />
                      <AvatarFallback className="text-[10px]">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.apartment}</p>
                    </div>
                    <button
                      onClick={() => onAddMember(user.id)}
                      className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  findUser,
  onToggleLike,
  onEdit,
  onDelete,
  onSelectUser,
}: {
  post: MockFeedPost
  findUser: (name: string) => MockUser | undefined
  onToggleLike: (id: string) => void
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  onSelectUser: (user: MockUser) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [editMode, setEditMode]         = useState(false)
  const [editContent, setEditContent]   = useState(post.content)

  function handleSave() {
    if (!editContent.trim()) return
    onEdit(post.id, editContent.trim())
    setEditMode(false)
  }

  function handleCancelEdit() {
    setEditContent(post.content)
    setEditMode(false)
  }

  function handleAuthorClick(name: string) {
    const user = findUser(name)
    if (user) onSelectUser(user)
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 group/card">

      {/* Author row + action buttons */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button onClick={() => handleAuthorClick(post.authorName)} className="shrink-0 rounded-full focus:outline-none">
            <Avatar className="h-9 w-9">
              <AvatarImage src={post.avatar ?? undefined} />
              <AvatarFallback className="text-xs">{getInitials(post.authorName)}</AvatarFallback>
            </Avatar>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button onClick={() => handleAuthorClick(post.authorName)} className="text-sm font-semibold hover:underline focus:outline-none">
                {post.authorName}
              </button>
              <Badge variant={isSyndic(post.authorRole) ? 'default' : 'secondary'} className="text-[10px] py-0">
                {post.authorRole}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>

        {/* Edit / Delete — visible on card hover */}
        {!editMode && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => { setEditContent(post.content); setEditMode(true) }}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Content — normal or edit mode */}
      {editMode ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full resize-none text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] bg-muted/30"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancelEdit}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs" disabled={!editContent.trim()} onClick={handleSave}>Save</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
      )}

      {/* Actions */}
      {!editMode && (
        <div className="flex items-center gap-4 pt-2 border-t">
          <button
            onClick={() => onToggleLike(post.id)}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors',
              post.liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
            )}
          >
            <Heart size={14} className={post.liked ? 'fill-red-500' : ''} />
            {post.likes}
          </button>
          <button
            onClick={() => post.comments.length > 0 && setShowComments(v => !v)}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors',
              post.comments.length > 0
                ? 'text-muted-foreground hover:text-primary cursor-pointer'
                : 'text-muted-foreground cursor-default',
            )}
          >
            <MessageCircle size={14} />
            {post.comments.length} commentaire{post.comments.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Inline comments */}
      {showComments && !editMode && (
        <div className="space-y-3 pt-1">
          {post.comments.map(comment => (
            <div key={comment.id} className="flex items-start gap-2.5">
              <button
                onClick={() => handleAuthorClick(comment.authorName)}
                className="shrink-0 rounded-full focus:outline-none"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={comment.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px]">{getInitials(comment.authorName)}</AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <button
                    onClick={() => handleAuthorClick(comment.authorName)}
                    className="text-xs font-semibold hover:underline focus:outline-none"
                  >
                    {comment.authorName}
                  </button>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Feed Page ─────────────────────────────────────────────────────────────────

export function Feed() {
  const [newPost, setNewPost]                 = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState(mockGroups[0].id)
  const [posts, setPosts]                     = useState(mockFeedPosts)
  const [groups, setGroups]                   = useState(mockGroups)
  const [groupMembers, setGroupMembers]       = useState<Record<string, string[]>>(mockGroupMembers)

  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [membersGroupId, setMembersGroupId]   = useState<string | null>(null)
  const [profileUser, setProfileUser]         = useState<MockUser | null>(null)

  const selectedGroup = groups.find(g => g.id === selectedGroupId)!
  const filteredPosts = posts.filter(p => p.groupId === selectedGroupId)
  const membersGroup  = groups.find(g => g.id === membersGroupId)

  const currentMemberIds  = membersGroupId ? (groupMembers[membersGroupId] ?? []) : []
  const membersGroupUsers = currentMemberIds.map(id => mockUsers.find(u => u.id === id)!).filter(Boolean)
  const availableUsers    = mockUsers.filter(u => !currentMemberIds.includes(u.id))

  const findUser = (name: string) => mockUsers.find(u => u.name === name)

  // ── Post operations ──────────────────────────────────────────────────────

  function createPost() {
    if (!newPost.trim()) return
    const post: MockFeedPost = {
      id:         `p-${Date.now()}`,
      groupId:    selectedGroupId,
      authorName: CURRENT_USER.name,
      authorRole: CURRENT_USER.role,
      avatar:     CURRENT_USER.avatar,
      content:    newPost.trim(),
      createdAt:  new Date().toISOString(),
      likes:      0,
      liked:      false,
      comments:   [],
    }
    setPosts(prev => [post, ...prev])
    setNewPost('')
  }

  function editPost(id: string, content: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, content } : p))
  }

  function deletePost(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  function toggleLike(postId: string) {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p,
      ),
    )
  }

  // ── Group operations ─────────────────────────────────────────────────────

  function handleCreateGroup(name: string) {
    const id = `g-custom-${Date.now()}`
    setGroups(prev => [...prev, { id, name, memberCount: 0, type: 'custom' }])
    setGroupMembers(prev => ({ ...prev, [id]: [] }))
    setSelectedGroupId(id)
  }

  function addMemberToGroup(userId: string) {
    if (!membersGroupId) return
    setGroupMembers(prev => ({ ...prev, [membersGroupId]: [...(prev[membersGroupId] ?? []), userId] }))
    setGroups(prev => prev.map(g => g.id === membersGroupId ? { ...g, memberCount: g.memberCount + 1 } : g))
  }

  function removeMemberFromGroup(userId: string) {
    if (!membersGroupId) return
    setGroupMembers(prev => ({ ...prev, [membersGroupId]: (prev[membersGroupId] ?? []).filter(id => id !== userId) }))
    setGroups(prev => prev.map(g => g.id === membersGroupId ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g))
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Feed Management" subtitle={`Communauté — ${selectedGroup.name}`} />

      <div className="flex-1 flex gap-5 p-6 min-h-0">

        {/* ── Main feed column ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Compose box */}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-[11px] text-muted-foreground mb-2">
              Posting to <span className="font-medium text-foreground">{selectedGroup.name}</span>
            </p>
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.metaKey && createPost()}
              placeholder="What are you thinking of?"
              className="w-full resize-none text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] bg-muted/30"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                  <Image size={13} /> Photo
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                  <Video size={13} /> Video
                </Button>
              </div>
              <Button size="sm" className="gap-1.5 text-xs" disabled={!newPost.trim()} onClick={createPost}>
                Post
              </Button>
            </div>
          </div>

          {/* Posts */}
          {filteredPosts.length === 0 ? (
            <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
              No posts in this group yet.
            </div>
          ) : (
            filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                findUser={findUser}
                onToggleLike={toggleLike}
                onEdit={editPost}
                onDelete={deletePost}
                onSelectUser={setProfileUser}
              />
            ))
          )}
        </div>

        {/* ── Groups sidebar ───────────────────────────────────────────── */}
        <div className="w-64 shrink-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-sm font-semibold">groups</p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="space-y-2">
            {groups.map(group => (
              <div
                key={group.id}
                className={cn(
                  'rounded-xl border bg-card p-3 flex items-center gap-3 transition-colors',
                  selectedGroupId === group.id && 'border-primary bg-primary/5',
                )}
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', GROUP_COLORS[group.type])}>
                    {GROUP_ICONS[group.type]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.memberCount} members</p>
                  </div>
                </div>
                <button
                  onClick={() => setMembersGroupId(group.id)}
                  className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreate={handleCreateGroup}
      />

      {membersGroup && (
        <GroupMembersModal
          group={membersGroup}
          members={membersGroupUsers}
          availableUsers={availableUsers}
          onClose={() => setMembersGroupId(null)}
          onSelectUser={user => { setMembersGroupId(null); setProfileUser(user) }}
          onAddMember={addMemberToGroup}
          onRemoveMember={removeMemberFromGroup}
        />
      )}

      {profileUser && (
        <UserProfileModal user={profileUser} onClose={() => setProfileUser(null)} />
      )}
    </div>
  )
}
