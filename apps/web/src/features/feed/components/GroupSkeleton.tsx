export function GroupSkeleton() {
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
