import { RouteOptimization } from "@/types/trip";

interface Props {
  result: RouteOptimization;
  /** Stop addresses in their order before optimization (for the before/after view). */
  originalStops: string[];
  onUndo: () => void;
}

function km(meters: number) {
  return (meters / 1000).toFixed(1);
}

/**
 * Before/after stop order + distance/time savings for a route optimization
 * (TM-06.3). Read-only display; the reorder itself is applied to the form.
 */
export default function TripOptimizationPanel({
  result,
  originalStops,
  onUndo,
}: Props) {
  const distanceSaved =
    result.originalDistanceMeters - result.optimizedDistanceMeters;
  const timeSaved = result.originalDurationMins - result.optimizedDurationMins;
  const pct =
    result.originalDistanceMeters > 0
      ? Math.round((distanceSaved / result.originalDistanceMeters) * 100)
      : 0;
  const improved = distanceSaved > 1; // more than a metre

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Route optimization</h4>
        <button
          type="button"
          onClick={onUndo}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Undo
        </button>
      </div>

      {improved ? (
        <p className="mt-1 text-sm font-medium text-status-ok-ink">
          Reordered stops save {km(distanceSaved)} km (~{timeSaved} min · {pct}%
          shorter).
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          Stops are already in the shortest order — no change needed.
        </p>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Before</p>
          <ol className="mt-1 space-y-0.5 text-sm">
            {originalStops.map((address, i) => (
              <li key={`${address}-${i}`} className="truncate">
                {i + 1}. {address}
              </li>
            ))}
          </ol>
          <p className="mt-1 text-xs text-muted-foreground">
            {km(result.originalDistanceMeters)} km · ~
            {result.originalDurationMins} min
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">After</p>
          <ol className="mt-1 space-y-0.5 text-sm">
            {result.optimizedStops.map((stop, i) => (
              <li key={stop.originalIndex} className="truncate">
                {i + 1}. {stop.address}
                {stop.originalIndex !== i && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (was #{stop.originalIndex + 1})
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-1 text-xs text-muted-foreground">
            {km(result.optimizedDistanceMeters)} km · ~
            {result.optimizedDurationMins} min
          </p>
        </div>
      </div>
    </div>
  );
}
