import { GeoPoint } from "@/types/trip";
import { haversineDistance } from "@/lib/gps-utils";

/**
 * Route progress maths. Reuses `haversineDistance` from the tracking utilities —
 * the only new logic here is projecting a live position onto the route to work
 * out how far along it is.
 */

export interface RouteProgress {
  totalMeters: number;
  coveredMeters: number;
  remainingMeters: number;
  percentage: number;
  /** Shortest distance from the position to the route polyline (metres). */
  deviationMeters: number;
}

/** Total route length in metres (sum of great-circle hops between points). */
export function routeTotalDistance(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineDistance(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng,
    );
  }
  return total;
}

/**
 * Projection fraction of point P onto segment A→B (0..1, clamped) and the
 * perpendicular distance to it, using a local equirectangular approximation
 * (accurate enough over trip-segment scales).
 */
function projectFraction(
  a: GeoPoint,
  b: GeoPoint,
  p: GeoPoint,
): { t: number; distToSegment: number } {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const cosLat = Math.cos(toRad(a.lat));

  // Local metres relative to A.
  const bx = R * toRad(b.lng - a.lng) * cosLat;
  const by = R * toRad(b.lat - a.lat);
  const px = R * toRad(p.lng - a.lng) * cosLat;
  const py = R * toRad(p.lat - a.lat);

  const segLen2 = bx * bx + by * by;
  let t = segLen2 === 0 ? 0 : (px * bx + py * by) / segLen2;
  t = Math.max(0, Math.min(1, t));

  const distToSegment = Math.hypot(px - t * bx, py - t * by);
  return { t, distToSegment };
}

/**
 * Covered / remaining / percentage progress of a live position along an ordered
 * route. Picks the closest segment, then measures distance from the route start
 * to the projected point. Returns 0% covered when no position is available.
 */
export function computeRouteProgress(
  points: GeoPoint[],
  position: GeoPoint | null,
): RouteProgress {
  const total = routeTotalDistance(points);

  if (!position || points.length < 2 || total === 0) {
    return {
      totalMeters: total,
      coveredMeters: 0,
      remainingMeters: total,
      percentage: 0,
      deviationMeters: 0,
    };
  }

  let cumulative = 0;
  let bestCovered = 0;
  let bestDist = Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const segLen = haversineDistance(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng,
    );
    const { t, distToSegment } = projectFraction(
      points[i],
      points[i + 1],
      position,
    );

    if (distToSegment < bestDist) {
      bestDist = distToSegment;
      bestCovered = cumulative + t * segLen;
    }
    cumulative += segLen;
  }

  const covered = Math.max(0, Math.min(bestCovered, total));
  const remaining = Math.max(0, total - covered);
  const percentage = Math.round((covered / total) * 100);

  return {
    totalMeters: total,
    coveredMeters: covered,
    remainingMeters: remaining,
    percentage,
    // bestDist is the min perpendicular distance to the route — i.e. the deviation.
    deviationMeters: Number.isFinite(bestDist) ? bestDist : 0,
  };
}
