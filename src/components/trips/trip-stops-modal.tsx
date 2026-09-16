"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useRoutePreview } from "@/hooks/use-route-preview";
import { useRouteOptimization } from "@/hooks/use-route-optimization";
import TripRouteMap from "@/components/trips/trip-route-map";
import TripOptimizationPanel from "@/components/trips/trip-optimization-panel";
import { MAX_TRIP_STOPS, Trip } from "@/types/trip";
import {
  addStop,
  moveStop,
  removeStop,
  reorderStops,
  StopDraft,
  updateStopAddress,
} from "@/lib/trip-stops";

interface Props {
  open: boolean;
  onClose: () => void;
  trip: Trip;
  onSave: (stops: { address: string }[]) => Promise<unknown>;
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Manage a trip's stops after creation, before it starts (TM-05.2). Reuses the
 * same add / remove / reorder controls and manual "Optimize route" flow as the
 * creation modal, seeded from the trip's existing stops. Mounted only while open
 * so it re-seeds from the current trip each time. Saving replaces the whole stop
 * list through the service (never the mock).
 */
export default function TripStopsModal({ open, onClose, trip, onSave }: Props) {
  const {
    points: routePoints,
    loading: routeLoading,
    generate: generateRoute,
  } = useRoutePreview();

  const {
    result: optimization,
    loading: optimizing,
    optimize,
    clear: clearOptimization,
  } = useRouteOptimization();

  // Seed from the trip's existing stops (fresh each time the modal mounts).
  const [stops, setStops] = useState<StopDraft[]>(() =>
    trip.stops.map((s) => ({ id: s.id, address: s.address })),
  );
  const [preOptimizeStops, setPreOptimizeStops] = useState<StopDraft[] | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  // Need >= 2 filled stops to reorder; pickup/destination anchor the path.
  const canOptimize =
    stops.length >= 2 && stops.every((s) => s.address.trim().length > 0);

  const previewOrder = (nextStops: StopDraft[]) =>
    generateRoute({
      origin: trip.origin,
      destination: trip.destination,
      stops: nextStops.map((s) => s.address.trim()).filter((a) => a.length > 0),
    });

  // Manual only (constraint) — never auto-run when stops change.
  const handleOptimize = async () => {
    const res = await optimize({
      origin: trip.origin,
      destination: trip.destination,
      stops: stops.map((s) => s.address.trim()),
    });
    if (!res) return;

    setPreOptimizeStops(stops);
    const reordered = reorderStops(
      stops,
      res.optimizedStops.map((s) => s.originalIndex),
    );
    setStops(reordered);
    previewOrder(reordered); // reuse the existing route preview/map
  };

  const handleUndoOptimize = () => {
    if (preOptimizeStops) {
      setStops(preOptimizeStops);
      previewOrder(preOptimizeStops);
    }
    setPreOptimizeStops(null);
    clearOptimization();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleaned = stops
      .map((s) => ({ address: s.address.trim() }))
      .filter((s) => s.address.length > 0);

    try {
      setSubmitting(true);
      await onSave(cleaned);
      toast.success("Stops updated");
      onClose();
    } catch (err) {
      console.log(err);
      if (err instanceof Error && err.message === "STOPS_LOCKED") {
        toast.error("Stops can only be edited before the trip starts");
      } else if (err instanceof Error && err.message === "VEHICLE_OVERLAP") {
        toast.error(
          "This vehicle is already booked for an overlapping schedule",
        );
      } else if (err instanceof Error && err.message === "DRIVER_OVERLAP") {
        toast.error("This driver is already booked for an overlapping schedule");
      } else {
        toast.error("Failed to update stops");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Manage Stops</DialogTitle>
          <DialogDescription>
            Add, remove, or reorder stops for {trip.reference} ({trip.origin} →{" "}
            {trip.destination}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Stops (ordered — max 10) */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">Stops</span>
              <span className="text-xs text-muted-foreground">
                {stops.length}/{MAX_TRIP_STOPS}
              </span>
            </div>

            {stops.length > 0 ? (
              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-xs text-muted-foreground">
                      {index + 1}
                    </span>
                    <input
                      value={stop.address}
                      onChange={(e) =>
                        setStops((prev) =>
                          updateStopAddress(prev, stop.id, e.target.value),
                        )
                      }
                      placeholder={`Stop ${index + 1} address`}
                      aria-label={`Stop ${index + 1} address`}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setStops((prev) => moveStop(prev, index, -1))}
                      disabled={index === 0}
                      aria-label="Move stop up"
                      className="shrink-0 rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-40"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStops((prev) => moveStop(prev, index, 1))}
                      disabled={index === stops.length - 1}
                      aria-label="Move stop down"
                      className="shrink-0 rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-40"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStops((prev) => removeStop(prev, stop.id))}
                      aria-label="Remove stop"
                      className="shrink-0 rounded-lg border border-border p-2 text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No stops yet — add one below.
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStops((prev) => addStop(prev))}
                disabled={stops.length >= MAX_TRIP_STOPS}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add stop
              </button>

              <Button
                type="button"
                variant="outline"
                onClick={handleOptimize}
                disabled={!canOptimize}
                isLoading={optimizing}
                className="text-primary hover:bg-primary/10 border-primary/40"
              >
                <Sparkles className="mr-1 h-4 w-4" />
                Optimize route
              </Button>
            </div>

            {optimization && preOptimizeStops && (
              <TripOptimizationPanel
                result={optimization}
                originalStops={preOptimizeStops.map((s) => s.address)}
                onUndo={handleUndoOptimize}
              />
            )}
          </div>

          {/* Route preview (geocoded) */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">Route preview</span>
              <button
                type="button"
                onClick={() => previewOrder(stops)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Preview route
              </button>
            </div>

            {routePoints.length > 0 && (
              <TripRouteMap points={routePoints} loading={routeLoading} />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={submitting}
            >
              Save Stops
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
