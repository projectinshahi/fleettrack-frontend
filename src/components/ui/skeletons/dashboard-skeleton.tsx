import { Skeleton } from "@/components/ui/skeleton";

// These mirror the dashboard's real geometry so the swap from placeholder to data does not
// shift the page. The strip matches the KPI strip in dashboard/page.tsx: tiles on --card
// inside a --border strip, divided by the 1px gap.
const STRIP =
  "grid min-w-0 grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border";

/** One KPI tile: p-4 · 16px label row · 24px value · 16px description, like StatsCard. */
function TileSkeleton() {
  return (
    <div className="bg-card p-4">
      <div className="flex h-4 items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4 rounded-sm" />
      </div>
      <Skeleton className="mt-3 h-6 w-16" />
      <div className="mt-1.5 flex h-4 items-center">
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

/** `grid` is passed as a literal class string so Tailwind still sees it in source. */
function GroupSkeleton({ tiles, grid }: { tiles: number; grid: string }) {
  return (
    <div>
      <div className="mb-2 flex h-4 items-center">
        <Skeleton className="h-3 w-28" />
      </div>
      <div className={`${STRIP} ${grid}`}>
        {Array.from({ length: tiles }).map((_, i) => (
          <TileSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Panel header strip: a 22px section title over a 20px description, like the real panels. */
function PanelHeaderSkeleton() {
  return (
    <div className="border-b border-border px-4 py-3">
      <Skeleton className="h-[22px] w-40" />
      <Skeleton className="mt-1 h-5 w-64 max-w-full" />
    </div>
  );
}

/** The three KPI strips, in page order. */
export function DashboardKpiSkeleton() {
  return (
    <div className="space-y-6">
      <GroupSkeleton tiles={4} grid="sm:grid-cols-2 xl:grid-cols-4" />
      <GroupSkeleton tiles={6} grid="sm:grid-cols-2 lg:grid-cols-3" />
      <GroupSkeleton tiles={3} grid="md:grid-cols-3" />
    </div>
  );
}

/**
 * Fleet status beside active vehicles, then weekly activity. This replaces a MapSkeleton that
 * stood in for a map the dashboard does not have, which is what made the page jump on load.
 */
export function DashboardFleetSkeleton() {
  return (
    <>
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-border bg-card">
          <PanelHeaderSkeleton />
          <div className="flex justify-center p-4">
            <Skeleton className="h-[220px] w-[220px] rounded-full" />
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-border bg-card xl:col-span-2">
          <PanelHeaderSkeleton />
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <PanelHeaderSkeleton />
        <div className="p-4">
          <div className="flex h-[240px] items-end justify-between gap-2">
            {/* Static heights: deterministic so SSR and client match. */}
            {[55, 80, 45, 90, 60, 40, 75].map((h, i) => (
              <Skeleton key={i} className="w-full" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/** A table panel (live operations, ETAs) while the whole route loads. */
function TablePanelSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <PanelHeaderSkeleton />
      <div className="divide-y divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Route-level loading (dashboard/loading.tsx): the whole page, in page order. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <DashboardKpiSkeleton />
      <TablePanelSkeleton />
      <TablePanelSkeleton />
      <DashboardFleetSkeleton />
    </div>
  );
}
