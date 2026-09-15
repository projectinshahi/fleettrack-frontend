// Full-bleed: the tracking map runs edge to edge under the navbar, so its placeholder has no
// radius or inset of its own.
export function MapSkeleton() {
  return <div className="h-full min-h-[300px] w-full animate-pulse bg-muted" />;
}
