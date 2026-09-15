import { Skeleton } from "@/components/ui/skeleton";

/**
 * KPI / stat card skeleton matching the Phase-4 stats-card
 * (rounded-lg border, no shadow, p-5).
 */
export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-28" />
    </div>
  );
}

/** Backwards-compatible alias — existing imports use `CardSkeleton`. */
export const CardSkeleton = StatsCardSkeleton;
