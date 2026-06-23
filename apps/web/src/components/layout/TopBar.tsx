import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  hideSearch?: boolean
}

export function TopBar({ title, subtitle, actions, hideSearch }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-white/30 bg-white/10 backdrop-blur-md sticky top-0 z-10">
      <div>
        <h1 className="inline-flex items-center text-sm font-semibold text-foreground leading-tight bg-white px-3 py-1 rounded-full border border-border/40 shadow-sm">{title}</h1>
        {subtitle && <div className="mt-1">{subtitle}</div>}
      </div>

      <div className="flex items-center gap-2">
        {!hideSearch && (
          <div className="relative hidden md:flex items-center">
            <Search size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Search..."
              className="h-8 w-56 rounded-md border bg-secondary pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <kbd className="absolute right-2 text-[10px] text-muted-foreground hidden lg:block">⌘K</kbd>
          </div>
        )}

        {actions}
      </div>
    </div>
  )
}
