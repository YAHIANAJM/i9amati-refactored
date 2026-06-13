import { Search, Bell, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-base font-semibold text-foreground leading-tight">{title}</h1>
        {subtitle && <div className="mt-1">{subtitle}</div>}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:flex items-center">
          <Search size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            placeholder="Search..."
            className="h-8 w-56 rounded-md border bg-secondary pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <kbd className="absolute right-2 text-[10px] text-muted-foreground hidden lg:block">⌘K</kbd>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>

        <Button variant="ghost" size="icon">
          <Settings2 size={16} />
        </Button>

        {actions}
      </div>
    </div>
  )
}
