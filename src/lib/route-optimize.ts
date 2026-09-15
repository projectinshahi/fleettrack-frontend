import { GeoPoint } from "@/types/trip";
import { haversineDistance } from "@/lib/gps-utils";
import { routeTotalDistance } from "@/lib/route-progress";

/**
 * Optimal ordering of intermediate stops — an open-path TSP with fixed endpoints
 * (pickup fixed first, destination fixed last). Nearest-neighbour seed + 2-opt,
 * which is effectively exact for the small stop counts we allow (<= 10).
 *
 * Pure maths; reuses `haversineDistance` and `routeTotalDistance` so there is no
 * duplicated geometry. Mirrors Google Routes' `optimizeWaypointOrder`.
 *
 * @returns the stop indices (into `stops`) in optimized order.
 */
export function optimizeStopOrder(
  origin: GeoPoint,
  destination: GeoPoint,
  stops: GeoPoint[],
): number[] {
  const n = stops.length;
  if (n < 2) return stops.map((_, i) => i);

  // Nearest-neighbour seed, starting from the origin.
  const remaining = stops.map((_, i) => i);
  const seed: number[] = [];
  let from = origin;
  while (remaining.length > 0) {
    let bestK = 0;
    let bestDist = Infinity;
    for (let k = 0; k < remaining.length; k++) {
      const s = stops[remaining[k]];
      const d = haversineDistance(from.lat, from.lng, s.lat, s.lng);
      if (d < bestDist) {
        bestDist = d;
        bestK = k;
      }
    }
    const chosen = remaining.splice(bestK, 1)[0];
    seed.push(chosen);
    from = stops[chosen];
  }

  const fullPath = (order: number[]): GeoPoint[] => [
    origin,
    ...order.map((i) => stops[i]),
    destination,
  ];

  // 2-opt: reverse sub-segments while the whole path gets shorter.
  let best = seed;
  let bestDist = routeTotalDistance(fullPath(best));
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const candidate = best.slice();
        let lo = i;
        let hi = j;
        while (lo < hi) {
          [candidate[lo], candidate[hi]] = [candidate[hi], candidate[lo]];
          lo++;
          hi--;
        }
        const d = routeTotalDistance(fullPath(candidate));
        if (d < bestDist - 1e-6) {
          best = candidate;
          bestDist = d;
          improved = true;
        }
      }
    }
  }

  return best;
}
