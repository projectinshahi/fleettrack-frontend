import { TripDetailSkeleton } from "@/components/ui/skeletons/detail-skeleton";

// Without this, navigating to a trip showed the trips LIST skeleton from ../loading.tsx.
export default function Loading() {
  return <TripDetailSkeleton />;
}
