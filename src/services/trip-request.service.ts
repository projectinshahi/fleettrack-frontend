/**
 * Trip Request service — the ONLY module that touches trip-request data.
 *
 * Backend integration: reads AND writes hit the real NestJS API via `apiFetch`, following
 * the same conventions as trip.service.ts. The server owns ownership scoping (CLIENT sees
 * its own, ADMIN sees admin-audience), the atomic approval claim, the Trip it creates on
 * approval, and the notifications — all derived from the JWT.
 *
 *   Trip Request UI → use-trip-requests → trip-request.service → NestJS API
 *
 *   API (NestJS):
 *     GET   /trip-requests            -> { success, requests }   (CLIENT own / ADMIN audience)
 *     GET   /trip-requests/:id        -> { success, request }
 *     POST  /trip-requests            -> { success, request }    (CLIENT; no Trip created)
 *     PATCH /trip-requests/:id/approve-> { success, request, trip } (ADMIN)
 *     PATCH /trip-requests/:id/reject -> { success, request }    (ADMIN; body { reason })
 */

import type { CreateTripDto } from "@/types/trip";
import { TripRequest } from "@/types/trip-request";
import { apiFetch } from "@/lib/fetcher";

/** Extract the server error code/message (VEHICLE_OVERLAP, REQUEST_NOT_PENDING, …). */
async function errorMessage(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => null);
  return typeof err?.message === "string" ? err.message : fallback;
}

/**
 * List requests. Ownership scoping is server-side from the JWT (CLIENT own, ADMIN
 * audience), so no client-side filtering is needed. Throws on a non-2xx (apiFetch) so
 * the caller shows its error state instead of a convincing "no requests yet".
 */
export async function getTripRequests(): Promise<TripRequest[]> {
  // apiFetch throws on non-2xx — a failed load must reach the caller's error state,
  // never render as a genuine "no requests yet".
  const res = await apiFetch("/trip-requests");
  const data = await res.json();
  return (data.requests ?? []) as TripRequest[];
}

/** A single request by id (server enforces ownership; 404/403 → null). */
export async function getTripRequest(id: string): Promise<TripRequest | null> {
  const res = await apiFetch(`/trip-requests/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return (data.request ?? null) as TripRequest | null;
}

/**
 * Create a PENDING request from the existing trip-form payload. The server derives the
 * owning client from the JWT (any clientId in the body is ignored) and creates NO Trip.
 * Surfaces the server's error code (INVALID_VEHICLE / INVALID_CUSTOMER / …) to the form.
 */
export async function createTripRequest(
  dto: CreateTripDto,
): Promise<TripRequest> {
  const res = await apiFetch("/trip-requests", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Failed to submit trip request"));
  }
  const data = await res.json();
  return data.request as TripRequest;
}

/**
 * Approve a PENDING request. The server atomically claims it, creates the Trip (ASSIGNED)
 * via the reused trip-creation path, stores the tripId and notifies the client. The
 * response carries both { request, trip }; the hook returns the updated request. Surfaces
 * the server's code (REQUEST_NOT_PENDING / VEHICLE_OVERLAP / …).
 */
export async function approveTripRequest(
  id: string,
  driver: { driverName: string; driverPhone: string },
): Promise<TripRequest> {
  const res = await apiFetch(`/trip-requests/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify(driver),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Failed to approve request"));
  }
  const data = await res.json();
  return data.request as TripRequest;
}

/**
 * Delete a request. The server authorises it (ADMIN any, CLIENT only its own) and, for an
 * approved request, deletes the Trip it produced in the same transaction — so the trips
 * list must be treated as stale after this too.
 */
export async function deleteTripRequest(id: string): Promise<void> {
  const res = await apiFetch(`/trip-requests/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Failed to delete request"));
  }
}

/**
 * Reject a PENDING request with a required reason (the server trims and enforces it).
 * No Trip is created; the client is notified. Surfaces REQUEST_NOT_PENDING /
 * REJECTION_REASON_REQUIRED.
 */
export async function rejectTripRequest(
  id: string,
  reason: string,
): Promise<TripRequest> {
  const res = await apiFetch(`/trip-requests/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Failed to reject request"));
  }
  const data = await res.json();
  return data.request as TripRequest;
}
