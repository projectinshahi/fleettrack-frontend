// Full-bleed: the tracking map runs edge to edge under the navbar, so its placeholder has no
// radius or inset of its own.
export function MapSkeleton() {
  // Same fill as <Skeleton>: bg-muted matched the light page background exactly.
  return <div className="h-full min-h-[300px] w-full animate-pulse bg-border/60" />;
}
