export interface TrailPoint {
  lat: number;
  lng: number;
  timestamp: number; // Unix ms
  heading?: number; // degrees 0–360
  speed?: number; // km/h
}

const EARTH_RADIUS_M = 6371000;

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);

  const y = Math.sin(dLng) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

const MIN_DISTANCE_METERS = 10;
const MAX_JUMP_DISTANCE = 500;

export function filterGPSNoise(
  points: TrailPoint[],
  minDistanceMeters = MIN_DISTANCE_METERS,
): TrailPoint[] {
  if (points.length === 0) return [];

  const filtered: TrailPoint[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prev = filtered[filtered.length - 1];
    const curr = points[i];

    if (!isValidCoordinate(curr.lat, curr.lng)) continue;

    const dist = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);

    if (dist >= minDistanceMeters && dist <= MAX_JUMP_DISTANCE) {
      filtered.push(curr);
    }
  }

  return filtered;
}

export function enrichWithHeadings(points: TrailPoint[]): TrailPoint[] {
  return points.map((p, i) => {
    if (i === 0) return { ...p, heading: p.heading ?? 0 };

    const prev = points[i - 1];
    const bearing = calculateBearing(prev.lat, prev.lng, p.lat, p.lng);
    return { ...p, heading: bearing };
  });
}

export interface TrailSegment {
  positions: [number, number][];
  opacity: number;
  weight: number;
}

export function buildFadedTrailSegments(points: TrailPoint[]): TrailSegment[] {
  if (points.length < 2) return [];

  const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
  const total = latLngs.length;

  const segments: TrailSegment[] = [];

  if (total <= 15) {
    // Short trail — single bright segment
    segments.push({ positions: latLngs, opacity: 0.95, weight: 5 });
    return segments;
  }

  // Recent segment: last 15 points
  segments.push({
    positions: latLngs.slice(total - 15),
    opacity: 0.95,
    weight: 5,
  });

  // Mid segment
  const midStart = Math.max(0, total - 60);
  if (total - 15 > midStart) {
    segments.push({
      positions: latLngs.slice(midStart, total - 14),
      opacity: 0.55,
      weight: 4,
    });
  }

  // Old segment
  if (midStart > 0) {
    segments.push({
      positions: latLngs.slice(0, midStart + 1),
      opacity: 0.25,
      weight: 3,
    });
  }

  return segments;
}
