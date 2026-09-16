import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/ui/skeletons/page-header-skeleton";
import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";

// Mirrors the page: header (no action button), the search card, then the vehicle table.
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      </div>
      <TableSkeleton columns={7} rows={10} />
    </div>
  );
}
