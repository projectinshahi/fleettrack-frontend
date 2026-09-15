import { TrackingPageSkeleton } from "@/components/ui/skeletons/tracking-list-skeleton";

// The same frame as the page's own loading state, so navigating in shows one skeleton
// instead of a page header and table that the full-bleed map then replaces.
export default function Loading() {
  return <TrackingPageSkeleton />;
}
