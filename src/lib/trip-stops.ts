import { MAX_TRIP_STOPS } from "@/types/trip";

/**
 * Pure add / remove / reorder helpers for managing an ordered list of stops
 * (TM-05.1). Backend-agnostic — used by the creation modal's local state now,
 * reusable for a real stops API later. No drag-and-drop; reordering is index-based.
 */

export interface StopDraft {
  id: string;
  address: string;
}

export function createStopDraft(address = ""): StopDraft {
  return { id: `stop-${crypto.randomUUID()}`, address };
}

export function addStop(stops: StopDraft[]): StopDraft[] {
  if (stops.length >= MAX_TRIP_STOPS) return stops;
  return [...stops, createStopDraft()];
}

export function removeStop(stops: StopDraft[], id: string): StopDraft[] {
  return stops.filter((stop) => stop.id !== id);
}

export function updateStopAddress(
  stops: StopDraft[],
  id: string,
  address: string,
): StopDraft[] {
  return stops.map((stop) => (stop.id === id ? { ...stop, address } : stop));
}

/** Move the stop at `index` by `direction` (-1 up, +1 down); clamped, no-op at edges. */
export function moveStop(
  stops: StopDraft[],
  index: number,
  direction: -1 | 1,
): StopDraft[] {
  const target = index + direction;
  if (target < 0 || target >= stops.length) return stops;

  const next = [...stops];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Reorder stops by a permutation of their current indices (e.g. optimized order). */
export function reorderStops(stops: StopDraft[], order: number[]): StopDraft[] {
  return order.map((i) => stops[i]).filter(Boolean);
}
