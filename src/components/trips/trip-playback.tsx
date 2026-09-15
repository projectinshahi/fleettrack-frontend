"use client";

import { Pause, Play } from "lucide-react";

import { RoutePoint } from "@/types/trip";
import { useTripPlayback } from "@/hooks/use-trip-playback";
import TripRouteMap from "@/components/trips/trip-route-map";

interface Props {
  tripId: string;
  route: RoutePoint[];
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Route playback (TM-21.2) — replays a completed trip's travelled route on the
 * shared route map with a scrubbable timeline. Read-only; available to admin and
 * client. Falls back to the static route when no breadcrumbs exist.
 */
export default function TripPlayback({ tripId, route }: Props) {
  const {
    breadcrumbs,
    loading,
    index,
    isPlaying,
    current,
    trail,
    toggle,
    seek,
  } = useTripPlayback(tripId);

  const hasPlayback = breadcrumbs.length >= 2;

  return (
    <div className="space-y-3">
      <TripRouteMap
        points={route}
        vehiclePosition={
          current ? { lat: current.lat, lng: current.lng } : null
        }
        trail={trail}
        loading={loading}
      />

      {hasPlayback && current && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Route playback</h3>
            <span className="text-xs text-muted-foreground">
              {formatTime(current.timestamp)}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? "Pause playback" : "Play playback"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={breadcrumbs.length - 1}
              value={index}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Scrub playback timeline"
              className="w-full accent-primary"
            />
          </div>

          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>{formatTime(breadcrumbs[0].timestamp)}</span>
            <span>
              {formatTime(breadcrumbs[breadcrumbs.length - 1].timestamp)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
