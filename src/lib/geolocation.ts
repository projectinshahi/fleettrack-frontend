/**
 * POD-04.1 — one-shot browser geolocation capture for proof-of-delivery.
 *
 * Resolves to coordinates when a fix is obtained, or `null` on ANY failure
 * (unsupported browser, permission denied, position unavailable, timeout). It never
 * rejects, so callers can confirm the POD regardless — GPS is optional metadata, not a
 * gate. `maximumAge` lets a recent fix satisfy the request without re-prompting.
 */
export interface CapturedLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

export function captureLocation(
  timeoutMs = 8000,
): Promise<CapturedLocation | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      // permission denied / position unavailable / timeout → optional, non-blocking
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
