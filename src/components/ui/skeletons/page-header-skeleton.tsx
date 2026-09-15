import { Skeleton } from "@/components/ui/skeleton";

/**
 * Page title + subtitle placeholder, with an optional right-aligned action
 * button (Add / Export) so list-page loading.tsx files read like the real header.
 */
export function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 max-w-full" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {action && <Skeleton className="h-10 w-28 shrink-0 rounded-lg" />}
    </div>
  );
}
