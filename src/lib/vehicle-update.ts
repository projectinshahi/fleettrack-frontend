import { isValidCoordinate } from "@/lib/gps-utils";

/**
 * Apply a live `vehicleLocationUpdate` socket payload to an existing vehicle.
 *
 * RC2 — merge, never replace: fields absent from the (telemetry-only) payload keep
 * their existing value instead of becoming undefined.
 * RC1 — if the incoming coordinate is invalid, ignore just that sample and keep the
 * last valid position, so the marker never drops out of the map's validity filter.
 */
export function mergeVehicleUpdate<
  T extends { latitude: number; longitude: number },
>(existing: T, update: Partial<T>): T {
  const merged = { ...existing, ...update };

  if (!isValidCoordinate(merged.latitude, merged.longitude)) {
    merged.latitude = existing.latitude;
    merged.longitude = existing.longitude;
  }

  return merged;
}

/**
 * Packet gate for the live socket feed (RC11–RC13). Returns true — and records the
 * packet's timestamp as the vehicle's new high-water mark — only when the packet is
 * well-formed and strictly newer than the last one applied for that vehicle:
 *
 *  - RC13: a missing / non-finite `timestamp` is invalid → ignore the packet.
 *  - RC12: a re-delivered duplicate carries the same `timestamp` (`<=` last) → ignore.
 *  - RC11: an out-of-order packet carries an older `timestamp` (`<` last)  → ignore.
 *
 * `lastSeen` is a caller-owned per-vehicle map (held in a ref) and is mutated in place.
 * `timestamp` is the server emit time (Date.now()), which is monotonic per vehicle.
 */
export function acceptVehiclePacket(
  lastSeen: Record<string, number>,
  id: unknown,
  timestamp: unknown,
): boolean {
  if (typeof id !== "string") return false;
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return false;

  const last = lastSeen[id];
  if (last !== undefined && timestamp <= last) return false;

  lastSeen[id] = timestamp;
  return true;
}
