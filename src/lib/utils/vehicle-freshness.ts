/**
 * Display rules for a vehicle whose telemetry may be stale.
 *
 * The backend decides WHETHER a vehicle is offline (it alone knows each provider's
 * reporting cadence). The frontend's job is only to stop presenting a stale reading as
 * a live one — an OFFLINE vehicle used to render its last speed in the same place, and
 * in the same style, as a moving vehicle's current speed:
 *
 *     OFFLINE   69 km/h   11:08 AM
 *
 * which reads as "offline and currently doing 69". The speed was real, but it was the
 * last value ever received, not the current one.
 */

export interface FreshnessFields {
  status: string;
  speed: number;
  /** Provider GPS fix time. Null when the device has never sent a usable timestamp. */
  lastProviderUpdate?: string | null;
  /** Row write time — when WE last touched the record, not when the vehicle reported. */
  updatedAt: string;
}

export function isOffline(vehicle: Pick<FreshnessFields, "status">): boolean {
  return vehicle.status === "OFFLINE";
}

/**
 * The moment the vehicle actually reported, preferring the provider's GPS fix time.
 *
 * `updatedAt` is a Prisma `@updatedAt` column, so it is rewritten on every sync pass —
 * it tracks our polling, not the vehicle, and every vehicle written in the same tick
 * shares the identical value. Showing it as "last fix" made three trucks all claim the
 * same second. It stays as a fallback only for rows predating the fix.
 */
export function lastFixAt(vehicle: FreshnessFields): Date | null {
  const raw = vehicle.lastProviderUpdate ?? vehicle.updatedAt;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Local-time clock label for a fix. Timestamps cross the wire as UTC ISO strings and are
 * rendered in the viewer's timezone by the platform — the comparison that decides
 * offline already happened server-side in UTC, so nothing here can create a false
 * offline through a timezone conversion.
 */
export function formatFixTime(
  vehicle: FreshnessFields,
  withSeconds = false,
): string {
  const d = lastFixAt(vehicle);
  if (!d) return "—";
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" as const } : {}),
  });
}
