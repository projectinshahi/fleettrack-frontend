"use client";

import Link from "next/link";

import { useEtaOverview } from "@/hooks/use-eta-overview";
import TripStatusBadge from "@/components/trips/trip-status-badge";
import { formatEtaDuration } from "@/lib/trip-eta";
import { TripEta, TripProgress } from "@/types/trip";
import { TableSkeletonRows } from "@/components/ui/skeletons/table-skeleton";
import { useAuthStore } from "@/store/auth-store";

function arrivalTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function remainingKm(eta: TripEta | null, progress: TripProgress | null): string {
  const meters = eta?.remainingMeters ?? progress?.remainingMeters;
  return typeof meters === "number" ? `${(meters / 1000).toFixed(1)} km` : "—";
}

const th =
  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground";

/**
 * ETA overview across active trips (DSH-03.1 / DSH-03.2). Data comes from
 * useEtaOverview, which composes the existing trips + per-trip ETA/progress
 * endpoints (no new API, no new ETA maths). Reuses TripStatusBadge and the shared
 * formatEtaDuration; a compact row is used instead of the full TripEtaCard /
 * TripProgressCard, which aren't practical per-row in a multi-trip list.
 */
export default function EtaOverview() {
  const { rows, loading, error } = useEtaOverview();
  // Trip detail is CLIENT-only (lib/role-routes.ts); an ADMIN gets the reference as text.
  const { user } = useAuthStore();
  const canOpenTrip = user?.role === "CLIENT";

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="section-title">Active trip ETAs</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Destination ETA, distance and progress across in-transit trips
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className={th}>Trip</th>
              <th className={th}>Route</th>
              <th className={th}>Status</th>
              <th className={th}>Progress</th>
              <th className={th}>Remaining</th>
              <th className={th}>ETA</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <TableSkeletonRows columns={6} rows={4} />
            ) : error ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-destructive">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No active trips
                </td>
              </tr>
            ) : (
              rows.map(({ trip, eta, progress }) => (
                <tr
                  key={trip.id}
                  className="border-b border-border last:border-none transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium text-sm">
                    {canOpenTrip ? (
                      <Link
                        href={`/trips/${trip.id}`}
                        className="font-mono text-primary-ink hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {trip.reference}
                      </Link>
                    ) : (
                      <span className="font-mono">{trip.reference}</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{trip.origin}</div>
                    <div className="text-sm text-muted-foreground">
                      to {trip.destination}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <TripStatusBadge status={trip.status} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-primary/15">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${progress?.percentage ?? 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium tabular-nums text-muted-foreground">
                        {Math.round(progress?.percentage ?? 0)}%
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                    {remainingKm(eta, progress)}
                  </td>

                  <td className="px-4 py-3">
                    {eta ? (
                      <div>
                        <div className="text-sm font-semibold tabular-nums">
                          {arrivalTime(eta.etaTimestamp)}
                        </div>
                        <div className="text-sm tabular-nums text-muted-foreground">
                          in {formatEtaDuration(eta.etaSeconds)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Awaiting position
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
