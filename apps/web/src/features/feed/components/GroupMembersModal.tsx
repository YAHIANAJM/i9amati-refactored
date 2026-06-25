import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toastSuccess, toastDeleted, toastApiError } from '@/components/toast'
import { feedApi, type ApiGroup, type ApiOrgProfile } from '@/lib/feed.api'
import { cn, getInitials } from '@/lib/utils'
import { GROUP_TYPE_COLORS } from '../utils'
import { Building2, Settings2, Users } from 'lucide-react'

const GROUP_ICONS: Record<string, React.ReactNode> = {
  residence: <Users size={16} />,
  building:  <Building2 size={16} />,
  custom:    <Settings2 size={16} />,
}

interface GroupMembersModalProps {
  group:            ApiGroup
  canManageMembers: boolean
  onClose:          () => void
}

export function GroupMembersModal({ group, canManageMembers, onClose }: GroupMembersModalProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showPicker, setShowPicker] = useState(false)

  const { data: members = [], isLoading: loadingMembers, isError: membersError } = useQuery({
    queryKey: ['feed-group-members', group.id],
    queryFn:  () => feedApi.getGroupMembers(group.id),
  })

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['org-profiles'],
    queryFn:  feedApi.getOrgProfiles,
    enabled:  showPicker,
  })

  const memberProfileIds = new Set(members.map(m => m.profileId))
  const available        = allProfiles.filter(p => !memberProfileIds.has(p.profileId))

  const addMember = useMutation({
    mutationFn: (profileId: string) => feedApi.addGroupMember(group.id, profileId),
    onSuccess: () => {
      Promise.all([
        qc.invalidateQueries({ queryKey: ['feed-group-members', group.id] }),
        qc.invalidateQueries({ queryKey: ['feed-groups'] }),
      ])
      toastSuccess(t('success.memberAdded'))
    },
    onError: (err: any) => toastApiError(err),
  })

  const removeMember = useMutation({
    mutationFn: (profileId: string) => feedApi.removeGroupMember(group.id, profileId),
    onSuccess: () => {
      Promise.all([
        qc.invalidateQueries({ queryKey: ['feed-group-members', group.id] }),
        qc.invalidateQueries({ queryKey: ['feed-groups'] }),
      ])
      toastDeleted(t('success.memberRemoved'))
    },
    onError: (err: any) => toastApiError(err),
  })

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="p-5 border-b shrink-0">
          <div className="flex items-center gap-3 pr-8">
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
              GROUP_TYPE_COLORS[group.type],
            )}>
              {GROUP_ICONS[group.type]}
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">{group.name}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {loadingMembers ? group.memberCount : members.length} {t('feed.members')}
              </p>
            </div>
          </div>
        </div>

        {/* Member list */}
        <div className="p-2 overflow-y-auto flex-1">
          {loadingMembers ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-4">
              <Loader2 size={12} className="animate-spin" /> {t('feed.loading')}
            </div>
          ) : membersError ? (
            <p className="text-sm text-red-500 text-center py-6">{t('feed.failedLoadMembers')}</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('feed.noMembersYet')}</p>
          ) : (
            members.map(m => (
              <div
                key={m.membershipId}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={m.avatar ?? undefined} />
                  <AvatarFallback className="text-xs">{getInitials(m.name ?? '?')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name ?? t('feed.unknown')}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.orgRole?.toLowerCase() ?? ''}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] py-0 shrink-0">{m.groupRole}</Badge>
                {canManageMembers && (
                  <button
                    onClick={() => removeMember.mutate(m.profileId)}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                  >
                    {removeMember.isPending
                      ? <Loader2 size={11} className="animate-spin" />
                      : <X size={11} />}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add member footer */}
        <div className="border-t shrink-0">
          {canManageMembers && (
            <button
              onClick={() => setShowPicker(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus size={14} /> {t('feed.addMember')}
              <span className="ml-auto text-muted-foreground text-[10px]">
                {available.length} {t('feed.available')}
              </span>
            </button>
          )}
          {canManageMembers && showPicker && (
            <div className="px-2 pb-2 max-h-[180px] overflow-y-auto border-t">
              {available.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">{t('feed.allMembersAdded')}</p>
              ) : available.map((p: ApiOrgProfile) => (
                <div
                  key={p.profileId}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors"
                >
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
