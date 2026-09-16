"use client";

import { TripProgress } from "@/types/trip";
import { STATUS_CHIP } from "@/components/ui/status-chip";

interface Props {
  progress: TripProgress | null;
  /** True once the assigned vehicle's live position feed has updated progress. */
  live?: boolean;
}

function km(meters: number) {
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function TripProgressCard({ progress, live = false }: Props) {
  if (!progress) return null;

  const pct = Math.max(0, Math.min(100, progress.percentage));

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Route progress</h3>
          {live && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${STATUS_CHIP.signal}`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                <span className="relative inline-flex h-full w-full rounded-full bg-current" />
              </span>
              Live
            </span>
          )}
        </div>
        <span className="text-sm font-semibold">{pct}%</span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-sm font-semibold">{km(progress.coveredMeters)}</p>
          <p className="text-xs text-muted-foreground">Covered</p>
        </div>
        <div>
          <p className="text-sm font-semibold">
            {km(progress.remainingMeters)}
          </p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{km(progress.totalMeters)}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {!progress.hasVehiclePosition && (
        <p className="mt-3 text-xs text-muted-foreground">
          No live vehicle position yet — showing planned distance only.
        </p>
      )}
    </div>
  );
}
