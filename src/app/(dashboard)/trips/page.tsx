"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Route as RouteIcon, Download, Plus } from "lucide-react";
import { toast } from "sonner";

import { useTrips } from "@/hooks/use-trips";
import { createTripRequest } from "@/services/trip-request.service";
import TripTable from "@/components/trips/trip-table";
import TripFormModal from "@/components/trips/trip-form-modal";
import { PageHeaderSkeleton } from "@/components/ui/skeletons/page-header-skeleton";
import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  TripSummaryBucket,
  TRIP_SUMMARY_BUCKETS,
  TRIP_SUMMARY_BUCKET_LABELS,
} from "@/types/trip";
import { downloadCsv } from "@/lib/csv";
import { TRIP_CSV_COLUMNS } from "@/lib/csv-exports";

function TripsPageContent() {
  const { trips, loading, error, permissions, refetch } = useTrips();
  // CLIENT trip creation submits a trip REQUEST for admin approval (no Trip is created
  // directly) — the same form, routed through the trip-requests workflow. The service is
  // called directly: the hook used before also loaded GET /trip-requests on every visit to
  // this page and again after each submit, and nothing on this page shows that list.
  const [modalOpen, setModalOpen] = useState(false);

  // Drill-down from the dashboard (DSH-01.3): ?status=<bucket> narrows the list.
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const bucket =
    // An OWN key only: `?status=toString` matched through the prototype and crashed the filter.
    statusParam &&
    Object.prototype.hasOwnProperty.call(TRIP_SUMMARY_BUCKETS, statusParam)
      ? (statusParam as TripSummaryBucket)
      : null;

  const visibleTrips = useMemo(() => {
    if (!bucket) return trips;
    const statuses = TRIP_SUMMARY_BUCKETS[bucket];
    return trips.filter((t) => statuses.includes(t.status));
  }, [trips, bucket]);

  const [exporting, setExporting] = useState(false);

  /**
   * Export exactly what the table shows: `visibleTrips`, i.e. the full server-scoped list
   * with the ?status= drill-down applied. There is no pagination here — GET /trips returns
   * every trip the role may see in one response — so this is all matching records, not a
   * first page. Nothing is re-fetched; the CSV is built from data already in memory.
   */
  const handleExportCsv = () => {
    if (loading) return;
    if (visibleTrips.length === 0) {
      toast.error("No trips to export");
      return;
    }
    try {
      setExporting(true);
      downloadCsv("fleettrack-trips.csv", visibleTrips, TRIP_CSV_COLUMNS);
    } catch (err) {
      console.log(err);
      toast.error("Failed to export trips");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Stacks below sm and the actions wrap: side by side, the two buttons pushed past a
          360-390px screen. Same pattern as the trip-requests header. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <RouteIcon className="h-6 w-6 text-primary" />
          </div>

          <div>
            <h1 className="page-title">Trips</h1>
            <p className="mt-1 text-muted-foreground">
              Manage trips, assignments and lifecycle
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Trips CSV is a CLIENT export (canCreate is the CLIENT capability, the same
              flag the Request Trip button uses), so an ADMIN sees no button here. */}
          {permissions.canCreate && (
            <button
              onClick={handleExportCsv}
              disabled={loading || exporting}
              title={
                loading
                  ? "Trips are still loading"
                  : "Download the trips shown below as CSV"
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Preparing..." : "Download CSV"}
            </button>
          )}

          {permissions.canCreate && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Request Trip
            </button>
          )}
        </div>
      </div>

      {/* Active drill-down filter (DSH-01.3) */}
      {bucket && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtered by</span>
          <span className="rounded-full bg-muted px-3 py-1 font-medium">
            {TRIP_SUMMARY_BUCKET_LABELS[bucket]}
          </span>
          <Link href="/trips" className="text-primary hover:underline">
            Clear
          </Link>
        </div>
      )}

      {/* Table */}
      {error && !loading ? (
        <ErrorState message="Couldn't load trips." onRetry={refetch} />
      ) : (
        <TripTable trips={visibleTrips} loading={loading} />
      )}

      {/* Request modal (client only) — submits a trip request for admin approval */}
      {permissions.canCreate && (
        <TripFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreate={createTripRequest}
        />
      )}
    </div>
  );
}

export default function TripsPage() {
  // useSearchParams() requires a Suspense boundary for static prerender (Next 16).
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeaderSkeleton action />
          <TableSkeleton columns={6} rows={8} />
        </div>
      }
    >
      <TripsPageContent />
    </Suspense>
  );
}
