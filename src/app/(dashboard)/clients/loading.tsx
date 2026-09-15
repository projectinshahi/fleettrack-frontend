import { PageHeaderSkeleton } from "@/components/ui/skeletons/page-header-skeleton";
import { StatsCardSkeleton } from "@/components/ui/skeletons/card-skeleton";
import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton columns={5} rows={8} />
    </div>
  );
}
