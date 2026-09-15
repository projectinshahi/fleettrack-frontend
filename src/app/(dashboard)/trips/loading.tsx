import { PageHeaderSkeleton } from "@/components/ui/skeletons/page-header-skeleton";
import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action />
      <TableSkeleton columns={6} rows={8} />
    </div>
  );
}
