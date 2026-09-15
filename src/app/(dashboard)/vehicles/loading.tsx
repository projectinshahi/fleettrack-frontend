import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-10 w-48 bg-muted animate-pulse rounded-md mb-2"></div>
          <div className="h-5 w-64 bg-muted animate-pulse rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
      </div>
      <TableSkeleton rows={10} />
    </div>
  );
}
