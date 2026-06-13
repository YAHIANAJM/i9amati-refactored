import { Search, Bell, Settings2, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Header() {
  return (
    <header className="flex items-center justify-between px-5 py-3 shrink-0 bg-white rounded-xl shadow-sm border border-border/40">
      {/* Left — brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
          <span className="text-white font-bold text-sm">i9</span>
        </div>
        <div>
          <span className="font-semibold text-sm text-foreground/90">i9amati</span>
          <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">Gestion de Syndic</span>
        </div>
      </div>

      {/* Center — search */}
      <div className="flex-1 max-w-md mx-8 hidden md:flex items-center relative">
        <Search size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
        <input
          placeholder="Rechercher dans i9amati..."
          className="w-full h-8 rounded-lg bg-muted border border-border pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
        <kbd className="absolute right-3 text-[10px] text-foreground/40 hidden lg:block">⌘K</kbd>
      </div>

      {/* Right — actions + user */}
      <div className="flex items-center gap-2">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <Bell size={16} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <Settings2 size={16} className="text-muted-foreground" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-muted transition-colors">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-white text-xs font-semibold">SY</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium leading-none text-foreground/90">Ahmed Syndic</p>
            <p className="text-[10px] text-foreground/50 mt-0.5">Syndic</p>
          </div>
          <ChevronDown size={12} className="text-foreground/50 hidden sm:block" />
        </button>
      </div>
    </header>
  )
}
