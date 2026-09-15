"use client";

import Link from "next/link";

import { Trip } from "@/types/trip";
import TripStatusBadge from "./trip-status-badge";
import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";

interface Props {
  trips: Trip[];
  loading?: boolean;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function TripTable({ trips, loading = false }: Props) {
  if (loading) return <TableSkeleton columns={6} rows={8} />;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Reference</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Route</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Vehicle</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Driver</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Planned start</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
            </tr>
          </thead>

          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No trips yet
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr
                  key={trip.id}
                  className="border-b border-border last:border-none transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="font-mono text-primary-ink hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {trip.reference}
                    </Link>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{trip.origin}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      to {trip.destination}
                      {trip.stops.length > 0 &&
                        ` · ${trip.stops.length} stop${
                          trip.stops.length > 1 ? "s" : ""
                        }`}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {trip.vehicle?.vehicleNumber ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {trip.driverName ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(trip.scheduledStart)}
                  </td>

                  <td className="px-4 py-3">
                    <TripStatusBadge status={trip.status} />
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
