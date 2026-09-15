"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Eye, Trash2 } from "lucide-react";

import { TripRequest } from "@/types/trip-request";
import TripRequestStatusBadge from "./trip-request-status-badge";
import EmptyState from "@/components/ui/empty-state";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { apiErrorMessage } from "@/lib/fetcher";

interface Props {
  requests: TripRequest[];
  /** ADMIN sees the owning client column; a CLIENT (own requests only) does not. */
  showClient: boolean;
  /**
   * Delete a request. Omitted → no delete control is rendered. The server is the real
   * authority (ADMIN any, CLIENT only its own). Deleting an APPROVED request also deletes
   * the Trip it created, in the same transaction; the confirm dialog says so.
   */
  onDelete?: (request: TripRequest) => Promise<void>;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const th =
  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground";

/**
 * Responsive Trip Request list: a bordered table on md+ (matching the existing table
 * language) and a stacked card list below md, so mobile never gets a squeezed wide table.
 * Both link a row to the request detail.
 */
export default function TripRequestTable({
  requests,
  showClient,
  onDelete,
}: Props) {
  const [pendingDelete, setPendingDelete] = useState<TripRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(pendingDelete);
      toast.success("Trip request deleted");
      setPendingDelete(null);
    } catch (err) {
      console.error(err);
      // Surfaces the server's own reason (e.g. "Not your request") rather than a generic one.
      toast.error(apiErrorMessage(err, "Couldn't delete this request"));
    } finally {
      setDeleting(false);
    }
  };

  const deleteButton = (r: TripRequest) =>
    onDelete ? (
      <button
        type="button"
        onClick={(e) => {
          // The mobile row is a Link — don't navigate when deleting from it.
          e.preventDefault();
          e.stopPropagation();
          setPendingDelete(r);
        }}
        className="inline-flex items-center gap-1 text-destructive hover:underline"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    ) : null;

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No trip requests found"
          description="Requests submitted by clients will appear here."
        />
      </div>
    );
  }

  const routeCell = (r: TripRequest) => (
    <>
      <div className="font-medium">{r.origin}</div>
      <div className="mt-0.5 text-muted-foreground">
        to {r.destination}
        {(r.stops?.length ?? 0) > 0 &&
          ` · ${r.stops.length} stop${r.stops.length > 1 ? "s" : ""}`}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className={th}>Reference</th>
                {showClient && <th className={th}>Client</th>}
                <th className={th}>Route</th>
                <th className={th}>Vehicle</th>
                <th className={th}>Scheduled</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-none transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/trip-requests/${r.id}`}
                      className="font-mono text-primary-ink hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {r.reference ?? "—"}
                    </Link>
                  </td>

                  {showClient && (
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.client.name}
                    </td>
                  )}

                  <td className="px-4 py-3">{routeCell(r)}</td>

                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {r.vehicle?.vehicleNumber ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {fmtDateTime(r.scheduledStart)}
                  </td>

                  <td className="px-4 py-3">
                    <TripRequestStatusBadge status={r.status} />
                  </td>

                  <td className="px-4 py-3 text-right tabular-nums">
                    <div className="inline-flex items-center gap-4">
                      <Link
                        href={`/trip-requests/${r.id}`}
                        className="inline-flex items-center gap-1 text-primary-ink hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                      {deleteButton(r)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {requests.map((r) => (
          <Link
            key={r.id}
            href={`/trip-requests/${r.id}`}
            className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono font-semibold">{r.reference ?? "—"}</span>
              <TripRequestStatusBadge status={r.status} />
            </div>

            {showClient && (
              <p className="mt-1 text-sm text-muted-foreground">
                {r.client.name}
              </p>
            )}

            <div className="mt-3 text-sm">{routeCell(r)}</div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{r.vehicle?.vehicleNumber ?? "No vehicle"}</span>
              <span>{fmtDateTime(r.scheduledStart)}</span>
            </div>

            {onDelete && (
              <div className="mt-3 border-t border-border pt-3 text-sm">
                {deleteButton(r)}
              </div>
            )}
          </Link>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete Trip Request"
        description={
          pendingDelete?.tripId
            ? "This request was approved, so deleting it also permanently deletes the trip it created, with that trip's costs, proof of delivery and files."
            : "Are you sure you want to delete this trip request?"
        }
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        loading={deleting}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </>
  );
}
