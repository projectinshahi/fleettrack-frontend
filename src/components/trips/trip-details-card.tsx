"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Trip } from "@/types/trip";
import { STATUS_CHIP } from "@/components/ui/status-chip";

interface Props {
  trip: Trip;
  /**
   * TM-02.2 — when true (CLIENT + trip in transit), the next incomplete stop shows a
   * "Mark reached" control. UX gating only; the server remains the source of truth.
   */
  canComplete?: boolean;
  onCompleteStop?: (stopId: string) => Promise<unknown> | void;
}

function formatDateTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium sm:text-right">{value}</span>
    </div>
  );
}

export default function TripDetailsCard({
  trip,
  canComplete = false,
  onCompleteStop,
}: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Stops complete strictly in order, so the only eligible stop is the first one
  // not yet reached (mirrors the server's order rule — UX only).
  const nextStopId = trip.stops.find((s) => !s.completedAt)?.id ?? null;

  const handleComplete = async (stopId: string) => {
    if (!onCompleteStop || pendingId) return;
    setPendingId(stopId);
    try {
      await onCompleteStop(stopId);
      toast.success("Stop marked as reached");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete stop",
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 className="section-title font-mono">{trip.reference}</h2>
        <p className="text-sm text-muted-foreground">
          {trip.origin} → {trip.destination}
        </p>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Row label="Pickup address" value={trip.origin} />
        <Row label="Delivery address" value={trip.destination} />
        <Row label="Vehicle" value={trip.vehicle?.vehicleNumber ?? "—"} />
        <Row label="Driver" value={trip.driverName ?? "—"} />
        <Row label="Planned start" value={formatDateTime(trip.scheduledStart)} />
        <Row label="Planned end" value={formatDateTime(trip.scheduledEnd)} />
        <Row
          label="Distance"
          value={trip.distanceKm ? `${trip.distanceKm} km` : "—"}
        />
        <Row label="Notes" value={trip.notes ?? "—"} />
      </div>

      {trip.stops.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">
            Stops ({trip.stops.length})
          </span>
          <ol className="space-y-2">
            {trip.stops.map((stop) => {
              const done = !!stop.completedAt;
              const isNext = canComplete && !done && stop.id === nextStopId;
              return (
                <li
                  key={stop.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="flex items-start gap-2">
                    <span className="text-muted-foreground">
                      {stop.sequence}.
                    </span>
                    <span
                      className={
                        done ? "text-muted-foreground line-through" : ""
                      }
                    >
                      {stop.address}
                    </span>
                  </span>

                  {done ? (
                    <span
                      title={
                        stop.completedBy
                          ? `Reached — ${stop.completedBy}`
                          : "Reached"
                      }
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CHIP.ok}`}
                    >
                      <Check className="h-3 w-3" />
                      Reached
                    </span>
                  ) : isNext ? (
                    <button
                      type="button"
                      onClick={() => handleComplete(stop.id)}
                      disabled={pendingId !== null}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-60"
                    >
                      {pendingId === stop.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Mark reached
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
