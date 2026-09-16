import { Skeleton } from "@/components/ui/skeleton";
import { StatsCardSkeleton } from "./card-skeleton";
import { MapSkeleton } from "./map-skeleton";

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

/** A bordered card with a title bar and a few text lines. */
function PanelSkeleton({ lines }: { lines: number }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <Skeleton className="h-5 w-40 max-w-full" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

/**
 * /trips/[id]: title, the live monitoring (or playback) map panel, then the two-thirds /
 * one-third card grid. The page draws its own back link above the loading state, so the
 * placeholder for it is optional.
 */
export function TripDetailSkeleton({ backLink = true }: { backLink?: boolean }) {
  return (
    <div className="space-y-6">
      {backLink && <Skeleton className="h-4 w-28" />}

      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-[300px] w-full sm:h-[380px]" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelSkeleton lines={5} />
          <PanelSkeleton lines={2} />
        </div>
        <div className="space-y-6">
          <PanelSkeleton lines={4} />
          <PanelSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}

/**
 * /vehicles/[id]: back link, the title block with its status chip, the info cards, then the
 * location map panel beside the statistics panel.
 */
export function VehicleDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-5 w-64 max-w-full" />
          <Skeleton className="h-4 w-48 max-w-full" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-6 w-40 max-w-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 md:p-5">
          <Skeleton className="h-5 w-44 max-w-full" />
          <Skeleton className="mt-6 h-[320px] w-full md:h-[420px]" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-6 h-4 w-28" />
          <Skeleton className="mt-2 h-9 w-32" />
          <div className="mt-8 flex flex-wrap gap-3">
            <Skeleton className="h-11 w-28" />
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * /tracking/[id]: full-bleed, like the page. Below md the map sits above the details sheet;
 * from md the map sits beside the 340px details panel.
 */
export function TrackingDetailSkeleton() {
  return (
    <div className="flex h-full flex-col md:grid md:grid-cols-[1fr_340px]">
      <div className="min-h-[300px] min-w-0 flex-1 md:h-full">
        <MapSkeleton />
      </div>

      <div className="space-y-4 border-t border-border bg-card p-4 md:h-full md:border-l md:border-t-0">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
