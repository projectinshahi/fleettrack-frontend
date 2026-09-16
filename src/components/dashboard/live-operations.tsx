"use client";

import Link from "next/link";

import { useLiveOps } from "@/hooks/use-live-ops";
import TripStatusBadge from "@/components/trips/trip-status-badge";
import { formatSpeed } from "@/lib/utils/format-speed";
import { TableSkeletonRows } from "@/components/ui/skeletons/table-skeleton";
import { useAuthStore } from "@/store/auth-store";
import {
  STATUS_CHIP,
  StatusCue,
  type StatusTone,
} from "@/components/ui/status-chip";

/** Live vehicle status → tone (mirrors the ActiveVehicles widget). Branch order and the
 *  catch-all fall-through are unchanged; only the colours they resolve to moved. */
function vehicleStatusTone(status?: string): StatusTone {
  if (status === "MOVING") return "ok";
  if (status === "IDLE") return "attn";
  return "fault";
}

const th =
  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground";

/**
 * Live operations monitor (DSH-02.2 / DSH-02.3). Ongoing trips with their driver
 * and vehicle's live status, updating in near real time from the shared tracking
 * socket (via useLiveOps — no new API, no new socket connection). Reuses
 * TripStatusBadge and the ActiveVehicles status-pill styling.
 */
export default function LiveOperations() {
  const { ongoingTrips, liveVehicles, loading, error } = useLiveOps();
  // Trip detail is CLIENT-only (lib/role-routes.ts); an ADMIN gets the reference as text.
  const { user } = useAuthStore();
  const canOpenTrip = user?.role === "CLIENT";

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="section-title">Live operations</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ongoing trips with live driver &amp; vehicle status
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className={th}>Trip</th>
              <th className={th}>Route</th>
              <th className={th}>Driver</th>
              <th className={th}>Vehicle</th>
              <th className={th}>Live status</th>
              {/* Distinct from the "Trip" reference column: two identical header names leave a
                  screen reader announcing the same label for different data. */}
              <th className={th}>Trip status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <TableSkeletonRows columns={6} rows={4} />
            ) : error ? (
              // An API failure must never read as "no ongoing trips" (mirrors EtaOverview).
              <tr>
                <td colSpan={6} className="py-10 text-center text-destructive">
                  {error}
                </td>
              </tr>
            ) : ongoingTrips.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No ongoing trips
                </td>
              </tr>
            ) : (
              ongoingTrips.map((trip) => {
                const live = trip.vehicleId
                  ? liveVehicles[trip.vehicleId]
                  : undefined;

                return (
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

                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {trip.driverName ?? live?.driverName ?? "—"}
                    </td>

                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                      {trip.vehicle?.vehicleNumber ??
                        live?.vehicleNumber ??
                        "—"}
                    </td>

                    <td className="px-4 py-3">
                      {live ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                              STATUS_CHIP[vehicleStatusTone(live.status)]
                            }`}
                          >
                            <StatusCue tone={vehicleStatusTone(live.status)} />
                            {live.status}
                          </span>
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {formatSpeed(live.speed)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No live signal
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <TripStatusBadge status={trip.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
