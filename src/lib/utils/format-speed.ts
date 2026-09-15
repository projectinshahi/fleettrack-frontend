/**
 * Speed display helpers. Display-only — never mutates the underlying value.
 *
 * Vehicle speeds arrive as raw floats (e.g. 29.99998148); the UI should always
 * read as a whole number. Invalid input (null/undefined/NaN/non-numeric) → 0.
 */

/** Whole-number speed (rounded); 0 for null/undefined/NaN/invalid. */
export function roundSpeed(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
}

/** Speed formatted for display: whole number + " km/h" (e.g. "30 km/h"). */
export function formatSpeed(value: number | string | null | undefined): string {
  return `${roundSpeed(value)} km/h`;
}
