import { TripEta } from "@/types/trip";

/**
 * Destination ETA maths (ETA-01.1 / ETA-02.1) — pure, mirrors the backend
 * trip-eta.util so the live socket recompute stays client-side with no refetch.
 * Derived from the existing route-progress `remainingMeters` + effective speed;
 * no Maps travel time, no external calls.
 */

/** Fallback cruising speed when there's no usable live speed (km/h). */
export const DEFAULT_AVG_SPEED_KMH = 40;

/** Below this the vehicle is treated as stopped/idle, so we use the average. */
const MIN_LIVE_SPEED_KMH = 5;

/** The speed the ETA is based on: live speed when moving, else the average. */
export function effectiveSpeedKmh(liveSpeedKmh?: number | null): number {
  return typeof liveSpeedKmh === "number" && liveSpeedKmh > MIN_LIVE_SPEED_KMH
    ? liveSpeedKmh
    : DEFAULT_AVG_SPEED_KMH;
}

/**
 * Derive the destination ETA from remaining distance and (optional) live speed.
 * Callers guard for a live position and remaining > 0.
 */
export function computeEta(
  remainingMeters: number,
  liveSpeedKmh: number | null | undefined,
  now: number,
): TripEta {
  const basisSpeedKmh = effectiveSpeedKmh(liveSpeedKmh);
  const metersPerSecond = (basisSpeedKmh * 1000) / 3600;
  const etaSeconds = Math.round(remainingMeters / metersPerSecond);

  return {
    etaTimestamp: new Date(now + etaSeconds * 1000).toISOString(),
    etaSeconds,
    basisSpeedKmh,
    remainingMeters,
    hasVehiclePosition: true,
  };
}

/** Compact "2h 15m" / "8m" duration label for a remaining-time count. */
export function formatEtaDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
