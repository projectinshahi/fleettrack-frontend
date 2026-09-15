import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";
import { CardSkeleton } from "@/components/ui/skeletons/card-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-10 w-48 bg-muted animate-pulse rounded-md mb-2"></div>
          <div className="h-5 w-64 bg-muted animate-pulse rounded-md"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton rows={10} />
    </div>
  );
}
