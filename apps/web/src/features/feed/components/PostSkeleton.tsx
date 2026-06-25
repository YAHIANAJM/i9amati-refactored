export function PostSkeleton() {
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
