import { useTranslation } from 'react-i18next'
import { Building2, ChevronRight, Pencil, Settings2, Trash2, Users } from 'lucide-react'
import { type ApiGroup } from '@/lib/feed.api'
import { cn } from '@/lib/utils'
import { GROUP_TYPE_COLORS } from '../utils'

const GROUP_ICONS: Record<string, React.ReactNode> = {
  residence: <Users size={16} />,
  building:  <Building2 size={16} />,
  custom:    <Settings2 size={16} />,
}

interface GroupCardProps {
  group:         ApiGroup
  isActive:      boolean
  canManage:     boolean
  onSelect:      () => void
  onViewMembers: () => void
  onRename:      () => void
  onDelete:      () => void
}

export function GroupCard({
  group, isActive, canManage,
  onSelect, onViewMembers, onRename, onDelete,
}: GroupCardProps) {
  const { t } = useTranslation()

  return (
    <div className={cn(
      'rounded-xl border bg-card p-3 flex items-center gap-3 transition-colors group/gcard',
      isActive && 'border-primary bg-primary/5',
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
        <div className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
          GROUP_TYPE_COLORS[group.type],
        )}>
          {GROUP_ICONS[group.type]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{group.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {group.type} · {group.memberCount} {t('feed.members')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {canManage && (
          <>
            <button
              onClick={onRename}
              className="opacity-0 group-hover/gcard:opacity-100 h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-all text-muted-foreground hover:text-primary"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={onDelete}
              className="opacity-0 group-hover/gcard:opacity-100 h-6 w-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
        <button
          onClick={onViewMembers}
          className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
