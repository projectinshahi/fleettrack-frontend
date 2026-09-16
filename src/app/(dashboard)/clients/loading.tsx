import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/ui/skeletons/page-header-skeleton";
import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";

// Mirrors the page: header with Add Client, the two stat cards (as ClientStats draws them
// while loading), the search card, then the table.
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
      </div>
      <TableSkeleton columns={5} rows={8} />
    </div>
  );
}
