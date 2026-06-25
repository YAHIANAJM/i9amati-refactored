import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { type ApiGroup } from '@/lib/feed.api'
import { GroupCard } from '../components/GroupCard'
import { GroupSkeleton } from '../components/GroupSkeleton'

interface GroupsSidebarProps {
  groups:        ApiGroup[]
  groupsLoading: boolean
  groupsError:   boolean
  activeGroupId: string | null
  isSyndic:      boolean
  onSelect:      (groupId: string) => void
  onViewMembers: (groupId: string) => void
  onRename:      (group: ApiGroup) => void
  onDelete:      (groupId: string) => void
  onCreateGroup: () => void
}

export function GroupsSidebar({
  groups, groupsLoading, groupsError,
  activeGroupId, isSyndic,
  onSelect, onViewMembers, onRename, onDelete, onCreateGroup,
}: GroupsSidebarProps) {
  const { t } = useTranslation()

  return (
    <div className="w-64 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm font-semibold">{t('feed.groups')}</p>
        {isSyndic && (
          <button
            onClick={onCreateGroup}
            className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Plus size={13} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {groupsLoading ? (
          <><GroupSkeleton /><GroupSkeleton /><GroupSkeleton /></>
        ) : groupsError ? (
          <p className="text-xs text-red-500 px-1">{t('feed.groupsLoadError')}</p>
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center space-y-2">
            <p className="text-xs font-medium text-foreground">{t('feed.noGroupsYet')}</p>
            <p className="text-[11px] text-muted-foreground">{t('feed.createGroup')}</p>
            {isSyndic && (
              <button
                onClick={onCreateGroup}
                className="mt-1 text-xs text-primary font-medium hover:underline"
              >
                {t('feed.createGroupBtn')}
              </button>
            )}
          </div>
        ) : (
          groups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              isActive={group.id === activeGroupId}
              canManage={isSyndic}
              onSelect={() => onSelect(group.id)}
              onViewMembers={() => onViewMembers(group.id)}
              onRename={() => onRename(group)}
              onDelete={() => onDelete(group.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
