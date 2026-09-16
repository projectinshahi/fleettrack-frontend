"use client";

import { TripEta } from "@/types/trip";
import { formatEtaDuration } from "@/lib/trip-eta";
import { formatSpeed } from "@/lib/utils/format-speed";
import { STATUS_CHIP } from "@/components/ui/status-chip";

interface Props {
  eta: TripEta | null;
  /** True once the assigned vehicle's live position feed has updated the ETA. */
  live?: boolean;
}

function arrivalTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Live destination ETA (ETA-02.2). Derived from the trip's remaining distance and
 * the vehicle's live speed; mirrors the route-progress card styling and its Live
 * badge. Shows a muted placeholder until the trip is moving with a live position.
 */
export default function TripEtaCard({ eta, live = false }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Estimated arrival</h3>
          {live && eta && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${STATUS_CHIP.signal}`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                <span className="relative inline-flex h-full w-full rounded-full bg-current" />
              </span>
              Live
            </span>
          )}
        </div>
        {eta && (
          <span className="text-sm font-semibold">
            in {formatEtaDuration(eta.etaSeconds)}
          </span>
        )}
      </div>

      {eta ? (
        <>
          <p className="mt-3 text-2xl font-bold tracking-tight">
            {arrivalTime(eta.etaTimestamp)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(eta.remainingMeters / 1000).toFixed(1)} km remaining · based on{" "}
            {formatSpeed(eta.basisSpeedKmh)}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Not available yet — ETA is estimated once the trip is moving with a live
          vehicle position.
        </p>
      )}
    </div>
  );
}
