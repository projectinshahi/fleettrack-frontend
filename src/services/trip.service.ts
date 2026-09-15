import {
  CreateTripDto,
  GeoPoint,
  RoutePoint,
  ROUTE_DEVIATION_THRESHOLD_M,
  TripDriver,
  TripFormOptions,
  TripResponse,
  TripRouteResponse,
  TripsResponse,
  TripProgressResponse,
  TripEtaResponse,
  TripStatus,
  TripTimelineResponse,
  UpdateTripDto,
  OverlapResponse,
  VehicleOverlapResponse,
  DriverOverlapResponse,
  OptimizeStopsInput,
  RouteOptimizationResponse,
} from "@/types/trip";
import { getVehicles, toVehiclePosition } from "@/services/vehicle.service";
import { computeRouteProgress, routeTotalDistance } from "@/lib/route-progress";
import { optimizeStopOrder } from "@/lib/route-optimize";
import { OverlapCandidate, DriverOverlapCandidate } from "@/lib/trip-overlap";
import { TripBreadcrumbsResponse } from "@/lib/trip-breadcrumbs";
import { apiFetch } from "@/lib/fetcher";

/**
 * Trip service — the ONLY module that touches trip data.
 *
 * Backend integration: the full CRUD surface — reads AND writes — hits the real
 * NestJS API via `apiFetch`. Trips are sent as addresses; the server geocodes and
 * persists coordinates, so route/progress/deviation use real positions. The server
 * owns the reference, owning client, lifecycle validation and audit actor (all
 * from the JWT). Route preview + optimization geocode via the API's /geocode.
 *
 * The full surface — CRUD, the assignable vehicle + driver lookups, overlap,
 * geocoding, and breadcrumb playback — is served by the API. No mock data remains.
 *
 *   API (NestJS):
 *     GET    /trips                 -> { trips }
 *     GET    /trips/overlap         -> { hasOverlap, conflicts }
 *     GET    /trips/drivers         -> { drivers }
 *     GET    /trips/:id             -> { trip }
 *     GET    /trips/:id/timeline    -> { events }
 *     GET    /trips/:id/progress    -> { progress, vehiclePosition }
 *     GET    /trips/:id/breadcrumbs -> { breadcrumbs }
 *     POST   /trips                 -> { trip }
 *     PATCH  /trips/:id             -> { trip }
 *     PATCH  /trips/:id/status      -> { trip }
 *     DELETE /trips/:id             -> { success }
 *     POST   /geocode               -> { points }   (address batch → coordinates)
 */

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/**
 * List trips. When `clientId` is provided the result is scoped to that client
 * (this is how ADMIN filtering and CLIENT self-scoping both work).
 */
/**
 * In-flight de-duplication for the trip list. The dashboard mounts two independent
 * consumers of the same list in the same render (useEtaOverview and useLiveOps), which
 * meant two identical GET /trips every load. Concurrent callers now share one request.
 *
 * Deliberately NOT a timed cache: use-trips refetches immediately after create/update/
 * delete, and any TTL would hand that refetch the pre-mutation list. The entry is
 * dropped the moment the request settles, so nothing is ever served stale and a failure
 * is never cached — the next call is a real retry.
 */
const inFlightTrips = new Map<string, Promise<TripsResponse>>();

export async function getTrips(
  clientId?: string,
  statuses?: TripStatus[],
): Promise<TripsResponse> {
  // The backend scopes to the CLIENT via the JWT; clientId only narrows an ADMIN.
  // `statuses` is optional — omitted, the server returns the full list as before.
  const params = new URLSearchParams();
  if (clientId) params.set("clientId", clientId);
  if (statuses?.length) params.set("status", statuses.join(","));
  const query = params.toString();
  const path = `/trips${query ? `?${query}` : ""}`;

  // Keyed on the full path — an ADMIN switching client must never be handed the
  // previously selected client's list.
  const pending = inFlightTrips.get(path);
  if (pending) return pending;

  const request = (async (): Promise<TripsResponse> => {
    const res = await apiFetch(path);
    const data = await res.json();
    return { trips: data.trips ?? [] };
  })().finally(() => {
    inFlightTrips.delete(path);
  });

  inFlightTrips.set(path, request);
  return request;
}

export async function getTrip(id: string): Promise<TripResponse> {
  const res = await apiFetch(`/trips/${id}`);
  if (!res.ok) {
    throw new Error(`Trip not found: ${id}`);
  }
  const data = await res.json();
  return { trip: data.trip };
}

/**
 * Shared double-booking request (TM-09 / TM-10). Hits the real API, which scopes
 * conflicts to the caller's own trips and never counts COMPLETED/CANCELLED trips.
 * Normalises the (datetime-local) window to ISO so it aligns with stored trips,
 * and fails open (no conflicts) on a transient error so a blip can't block the form.
 *
 *   API: GET /trips/overlap?vehicleId=|driverId=&start=&end=&excludeTripId=
 */
async function requestOverlap(params: {
  vehicleId?: string;
  driverId?: string;
  scheduledStart: string;
  scheduledEnd: string;
  excludeTripId?: string;
  clientId?: string;
}): Promise<OverlapResponse> {
  const start = new Date(params.scheduledStart);
  const end = new Date(params.scheduledEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { hasOverlap: false, conflicts: [] };
  }

  const query = new URLSearchParams();
  if (params.vehicleId) query.set("vehicleId", params.vehicleId);
  if (params.driverId) query.set("driverId", params.driverId);
  query.set("start", start.toISOString());
  query.set("end", end.toISOString());
  if (params.excludeTripId) query.set("excludeTripId", params.excludeTripId);
  // ADMIN-only: scopes the check to the selected client. A CLIENT omits it and the
  // backend pins the check to its own trips via the JWT (query clientId ignored).
  if (params.clientId) query.set("clientId", params.clientId);

  // Deliberately fails OPEN: apiFetch throws on any non-2xx, but a transient error
  // (or an ADMIN with no client selected) must never block the form by reporting a
  // clash that wasn't checked. Trip creation re-runs this check server-side and is
  // the authoritative guard, so a missed pre-check can't create a double booking.
  try {
    const res = await apiFetch(`/trips/overlap?${query.toString()}`);
    const data = await res.json();
    return {
      hasOverlap: data.hasOverlap ?? false,
      conflicts: data.conflicts ?? [],
    };
  } catch {
    return { hasOverlap: false, conflicts: [] };
  }
}

/**
 * Vehicle availability check for double-booking (TM-09.1). Empty when the vehicle
 * is free; COMPLETED/CANCELLED trips never block.
 */
export async function checkVehicleOverlap(
  candidate: OverlapCandidate,
): Promise<VehicleOverlapResponse> {
  return requestOverlap({
    vehicleId: candidate.vehicleId,
    scheduledStart: candidate.scheduledStart,
    scheduledEnd: candidate.scheduledEnd,
    excludeTripId: candidate.excludeTripId,
    clientId: candidate.clientId,
  });
}

/**
 * Driver availability check for double-booking (TM-10.1). Empty when the driver is
 * free; COMPLETED/CANCELLED trips never block.
 */
export async function checkDriverOverlap(
  candidate: DriverOverlapCandidate,
): Promise<DriverOverlapResponse> {
  return requestOverlap({
    driverId: candidate.driverId,
    scheduledStart: candidate.scheduledStart,
    scheduledEnd: candidate.scheduledEnd,
    excludeTripId: candidate.excludeTripId,
    clientId: candidate.clientId,
  });
}

/* ------------------------------------------------------------------ */
/* Writes (CLIENT only — enforced in the UI now, on the API later)     */
/* ------------------------------------------------------------------ */

export async function createTrip(dto: CreateTripDto): Promise<TripResponse> {
  // Addresses only — the server geocodes them (single source of truth) and
  // persists coordinates for route/progress/deviation. The backend also derives
  // the owning client, reference, status and audit actor.
  const res = await apiFetch("/trips", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    // Surface the server's overlap code (VEHICLE_OVERLAP / DRIVER_OVERLAP) so the
    // create modal shows the matching message; fall back to a generic error.
    const err = await res.json().catch(() => null);
    throw new Error(
      typeof err?.message === "string" ? err.message : "Failed to create trip",
    );
  }
  const data = await res.json();
  return { trip: data.trip };
}

/**
 * Assignable drivers for the trip create form (TM-10.1). Real + tenant-scoped: the API
 * derives the distinct driver list from the caller's own vehicles, so a CLIENT never
 * sees another client's drivers. Each driver's `id` is the server's stable, name-derived
 * identifier — sent back verbatim as the trip's driverId so the DRIVER_OVERLAP guard
 * matches. Fails soft (empty) on a transient error so the form still opens.
 *
 * `clientId` is ADMIN-only: it targets a selected client's drivers
 * (GET /trips/drivers?clientId=). A CLIENT omits it — the JWT stays authoritative.
 *
 *   API: GET /trips/drivers -> { drivers }
 */
export async function getDrivers(clientId?: string): Promise<TripDriver[]> {
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  // Deliberately fails soft: this shares a Promise.all with getVehicles, and an ADMIN
  // with no client selected gets a 400 (CLIENT_REQUIRED) by design. Rethrowing would
  // drop the vehicle list too and leave the form with nothing.
  try {
    const res = await apiFetch(`/trips/drivers${query}`);
    const data = await res.json();
    return data.drivers ?? [];
  } catch {
    return [];
  }
}

/**
 * Reference data for the trip creation form: real vehicles + real drivers.
 * `clientId` is ADMIN-only (a selected client's resources); a CLIENT omits it and
 * both lists stay JWT-scoped.
 */
export async function getTripFormOptions(
  clientId?: string,
): Promise<TripFormOptions> {
  // Both are scoped to the client (CLIENT: JWT; ADMIN: the selected clientId); fetched
  // together so the form opens in a single round-trip.
  const [vehicles, drivers] = await Promise.all([
    getVehicles(clientId),
    getDrivers(clientId),
  ]);

  return { vehicles, drivers };
}

export async function updateTrip(
  id: string,
  dto: UpdateTripDto,
): Promise<TripResponse> {
  // Forward only the fields the API's UpdateTripDto accepts — clientId is
  // owner-derived and rejected by the backend's whitelist. Stops (TM-05) ARE
  // accepted: sent as an ordered address list; the server replaces them with a
  // fresh sequence + geocoded coords. Origin/destination re-geocode on change.
  const payload: Record<string, unknown> = { ...dto };
  delete payload.clientId;

  const res = await apiFetch(`/trips/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    // Surface the server's error code (STOPS_LOCKED / VEHICLE_OVERLAP /
    // DRIVER_OVERLAP) so the caller can show the matching message.
    const err = await res.json().catch(() => null);
    throw new Error(
      typeof err?.message === "string" ? err.message : "Failed to update trip",
    );
  }
  const data = await res.json();
  return { trip: data.trip };
}

export async function updateTripStatus(
  id: string,
  status: TripStatus,
): Promise<TripResponse> {
  // The server validates the transition against its lifecycle state machine and
  // records the STATUS_CHANGED audit event.
  const res = await apiFetch(`/trips/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error("Failed to update trip status");
  }
  const data = await res.json();
  return { trip: data.trip };
}

export async function completeTripStop(
  tripId: string,
  stopId: string,
): Promise<TripResponse> {
  // TM-02.2 — mark a stop reached. The server enforces order, lifecycle and
  // ownership, and records the completion plus a timeline event.
  const res = await apiFetch(`/trips/${tripId}/stops/${stopId}/complete`, {
    method: "PATCH",
  });
  if (!res.ok) {
    // Surface the server's code (STOP_OUT_OF_ORDER / STOP_NOT_COMPLETABLE / …).
    const err = await res.json().catch(() => null);
    throw new Error(
      typeof err?.message === "string"
        ? err.message
        : "Failed to complete stop",
    );
  }
  const data = await res.json();
  return { trip: data.trip };
}

export async function deleteTrip(id: string): Promise<{ success: boolean }> {
  const res = await apiFetch(`/trips/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("Failed to delete trip");
  }
  return { success: true };
}

/** Lifecycle timeline for a single trip. */
export async function getTripTimeline(
  tripId: string,
): Promise<TripTimelineResponse> {
  const res = await apiFetch(`/trips/${tripId}/timeline`);
  if (!res.ok) {
    throw new Error(`Timeline not found: ${tripId}`);
  }
  const data = await res.json();
  return { events: data.events ?? [] };
}

/* ------------------------------------------------------------------ */
/* Geocoding & route                                                   */
/* ------------------------------------------------------------------ */

/**
 * Batch-geocode addresses through the API's geocoder (the single source of truth).
 * Preserves input order; entries that can't be resolved come back as null. Fails
 * soft (all null) on a transient error so previews/optimization degrade gracefully.
 *
 *   API: POST /geocode { addresses } -> { points: (GeoPoint | null)[] }
 */
async function geocodeMany(addresses: string[]): Promise<(GeoPoint | null)[]> {
  if (addresses.length === 0) return [];

  // Deliberately fails soft (all null): an unresolvable address is already a valid
  // null, so a geocoder outage degrades the preview instead of breaking the form.
  try {
    const res = await apiFetch("/geocode", {
      method: "POST",
      body: JSON.stringify({ addresses }),
    });
    const data = await res.json();
    const points: (GeoPoint | null)[] = data.points ?? [];
    return addresses.map((_, i) => points[i] ?? null);
  } catch {
    return addresses.map(() => null);
  }
}

/**
 * Assemble ordered route points (pickup → stops → destination) from already
 * resolved coordinates. Points whose coordinates are missing are skipped, so a
 * partially geocoded route still renders.
 */
function toRoutePoints(input: {
  origin: string;
  originCoords?: GeoPoint;
  destination: string;
  destinationCoords?: GeoPoint;
  stops: { address: string; sequence: number; coords?: GeoPoint }[];
}): RoutePoint[] {
  const points: RoutePoint[] = [];

  if (input.originCoords) {
    points.push({
      type: "pickup",
      label: input.origin,
      sequence: null,
      coords: input.originCoords,
    });
  }

  input.stops.forEach((stop) => {
    if (stop.coords) {
      points.push({
        type: "stop",
        label: stop.address,
        sequence: stop.sequence,
        coords: stop.coords,
      });
    }
  });

  if (input.destinationCoords) {
    points.push({
      type: "destination",
      label: input.destination,
      sequence: null,
      coords: input.destinationCoords,
    });
  }

  return points;
}

/**
 * Geocoded, ordered route for a stored trip. Derived from the real trip (addresses
 * geocoded client-side where coords are absent) so use-trip's detail map keeps
 * working without a dedicated route endpoint.
 */
export async function getTripRoute(tripId: string): Promise<TripRouteResponse> {
  const { trip } = await getTrip(tripId);

  return {
    points: toRoutePoints({
      origin: trip.origin,
      originCoords: trip.originCoords,
      destination: trip.destination,
      destinationCoords: trip.destinationCoords,
      stops: trip.stops.map((s) => ({
        address: s.address,
        sequence: s.sequence,
        coords: s.coords,
      })),
    }),
  };
}

/**
 * GPS breadcrumb history for route playback (TM-21). Real breadcrumbs are recorded
 * server-side from the vehicle GPS feed while a trip is active, so a completed trip
 * replays its actual travelled route. Fails soft (empty) so playback degrades to
 * the static route when none were recorded.
 *
 *   API: GET /trips/:id/breadcrumbs -> { breadcrumbs }
 */
export async function getTripBreadcrumbs(
  tripId: string,
): Promise<TripBreadcrumbsResponse> {
  // Deliberately fails soft: no breadcrumbs is a normal state (nothing recorded), and
  // playback falls back to the static route either way.
  try {
    const res = await apiFetch(`/trips/${tripId}/breadcrumbs`);
    const data = await res.json();
    return { breadcrumbs: data.breadcrumbs ?? [] };
  } catch {
    return { breadcrumbs: [] };
  }
}

/** Geocode draft addresses (via the API) for a live route preview in the modal. */
export async function previewTripRoute(input: {
  origin: string;
  destination: string;
  stops: string[];
}): Promise<TripRouteResponse> {
  const coords = await geocodeMany([
    input.origin,
    ...input.stops,
    input.destination,
  ]);
  const originCoords = coords[0] ?? undefined;
  const destinationCoords = coords[coords.length - 1] ?? undefined;
  const stopCoords = coords.slice(1, -1);

  return {
    points: toRoutePoints({
      origin: input.origin,
      originCoords,
      destination: input.destination,
      destinationCoords,
      stops: input.stops.map((address, i) => ({
        address,
        sequence: i + 1,
        coords: stopCoords[i] ?? undefined,
      })),
    }),
  };
}

/**
 * Assemble progress metrics from an ordered route + a (possibly null) live
 * position. Pure and synchronous so the live socket feed can recompute on each
 * update without re-geocoding or re-fetching (see progressFromVehicle / use-trip).
 */
export function buildTripProgress(
  points: RoutePoint[],
  position: GeoPoint | null,
): TripProgressResponse {
  const progress = computeRouteProgress(
    points.map((point) => point.coords),
    position,
  );

  const hasVehiclePosition = position !== null;

  return {
    progress: {
      ...progress,
      hasVehiclePosition,
      isDeviating:
        hasVehiclePosition &&
        progress.deviationMeters > ROUTE_DEVIATION_THRESHOLD_M,
    },
    vehiclePosition: position,
  };
}

/**
 * Recompute progress from a raw live vehicle payload (the tracking socket feed).
 * Reuses vehicle.service's coordinate extraction — no duplicated GPS logic.
 */
export function progressFromVehicle(
  points: RoutePoint[],
  vehicle: { latitude?: unknown; longitude?: unknown } | null,
): TripProgressResponse {
  return buildTripProgress(points, toVehiclePosition(vehicle));
}

/* Mock: derive travel time from distance until the Routes API supplies real durations. */
const AVG_SPEED_KMH = 40;

function estimateDurationMins(meters: number): number {
  return Math.round((meters / 1000 / AVG_SPEED_KMH) * 60);
}

/**
 * Optimal multi-stop ordering (TM-06). Geocodes the addresses via the API, then
 * reorders the intermediate stops to minimise total distance with the
 * pickup/destination fixed, returning before/after distance & (estimated) time.
 * Requires every address to resolve; throws otherwise (the hook shows no result).
 *
 *   Future (Google Routes API): POST directions/v2:computeRoutes with
 *   optimizeWaypointOrder=true → read optimizedIntermediateWaypointIndex + legs.
 */
export async function optimizeTripRoute(
  input: OptimizeStopsInput,
): Promise<RouteOptimizationResponse> {
  const coords = await geocodeMany([
    input.origin,
    ...input.stops,
    input.destination,
  ]);
  if (coords.some((c) => c === null)) {
    throw new Error("Could not geocode all addresses for optimization");
  }
  const resolved = coords as GeoPoint[];
  const originCoords = resolved[0];
  const destinationCoords = resolved[resolved.length - 1];
  const stopCoords = resolved.slice(1, -1);

  const originalDistanceMeters = routeTotalDistance([
    originCoords,
    ...stopCoords,
    destinationCoords,
  ]);

  const order = optimizeStopOrder(originCoords, destinationCoords, stopCoords);
  const optimizedStops = order.map((originalIndex) => ({
    address: input.stops[originalIndex],
    originalIndex,
  }));
  const optimizedDistanceMeters = routeTotalDistance([
    originCoords,
    ...order.map((i) => stopCoords[i]),
    destinationCoords,
  ]);

  return {
    optimization: {
      optimizedStops,
      originalDistanceMeters,
      optimizedDistanceMeters,
      originalDurationMins: estimateDurationMins(originalDistanceMeters),
      optimizedDurationMins: estimateDurationMins(optimizedDistanceMeters),
    },
  };
}

/** Route progress + distance metrics, computed server-side from the live vehicle. */
export async function getTripProgress(
  tripId: string,
): Promise<TripProgressResponse> {
  const res = await apiFetch(`/trips/${tripId}/progress`);
  if (!res.ok) {
    throw new Error(`Progress not found: ${tripId}`);
  }
  const data = await res.json();
  return {
    progress: data.progress,
    vehiclePosition: data.vehiclePosition ?? null,
  };
}

/**
 * Destination ETA (ETA-01.2), derived server-side from remaining distance + the
 * vehicle's live speed. Fails soft (null) so a transient error never blocks the
 * detail page; the live socket recompute keeps it fresh thereafter.
 *
 *   API: GET /trips/:id/eta -> { eta }
 */
export async function getTripEta(tripId: string): Promise<TripEtaResponse> {
  // Deliberately fails soft: a null ETA is already a valid state (no live position),
  // and this shares a Promise.all with the trip/timeline/route/progress loads — a
  // rethrow here would blank the whole detail page over an optional value.
  try {
    const res = await apiFetch(`/trips/${tripId}/eta`);
    const data = await res.json();
    return { eta: data.eta ?? null };
  } catch {
    return { eta: null };
  }
}
