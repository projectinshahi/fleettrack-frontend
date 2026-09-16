import { VehicleDetailSkeleton } from "@/components/ui/skeletons/detail-skeleton";

// Without this, navigating to a vehicle showed the vehicles LIST skeleton from ../loading.tsx.
export default function Loading() {
  return <VehicleDetailSkeleton />;
}
