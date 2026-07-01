import { Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"

// Sentinel div that triggers fetchNextPage when it enters the viewport
export default function InfiniteScrollTrigger({
    hasNextPage, isFetchingNextPage, fetchNextPage,
}: {
    hasNextPage: boolean
    isFetchingNextPage: boolean
    fetchNextPage: () => void
}) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
            },
            { threshold: 0.1 },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    return (
        <div ref={ref} className="h-8 flex items-center justify-center">
            {isFetchingNextPage && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
        </div>
    )
}
