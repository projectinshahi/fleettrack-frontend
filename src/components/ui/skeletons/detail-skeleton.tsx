import { Skeleton } from "@/components/ui/skeleton";
import { StatsCardSkeleton } from "./card-skeleton";

/**
 * Detail-page skeleton (vehicle / trip detail): back link + title + a
 * responsive grid of stat cards + a content panel. Responsive from 320px up.
 */
export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />

      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-40 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
