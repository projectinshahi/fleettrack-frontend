import { TrackingDetailSkeleton } from "@/components/ui/skeletons/detail-skeleton";

// Without this, navigating to a vehicle's live view showed the fleet rail + map skeleton
// from ../loading.tsx.
export default function Loading() {
  return <TrackingDetailSkeleton />;
}
