/**
 * Trip domain contract (API-shaped).
 *
 * These interfaces mirror the JSON the future NestJS + Prisma REST API will return,
 * so the mock data and the service layer can be swapped for real HTTP calls with no
 * changes to consumers. Keep field names aligned with the planned Prisma model.
 */

import type { UserRole } from "@/types/user";

/* ------------------------------------------------------------------ */
/* Roles & permissions                                                 */
/* ------------------------------------------------------------------ */

export type { UserRole };

/**
 * Capability flags for the trip module.
 *
 * Business rule: the CLIENT owns trip management (create / edit / delete /
 * lifecycle); the ADMIN is read-only (monitors all clients & trips). This is the
 * inverse of the vehicles convention, so it is declared explicitly here rather
 * than inferred at each call site.
 */
export interface TripPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageLifecycle: boolean;
}

export function getTripPermissions(
  role: UserRole | undefined,
): TripPermissions {
  const isClient = role === "CLIENT";
  const isAdmin = role === "ADMIN";

  return {
    canView: isAdmin || isClient,
    canCreate: isClient,
    canEdit: isClient,
    canDelete: isClient,
    canManageLifecycle: isClient,
  };
}

/* ------------------------------------------------------------------ */
/* Trip lifecycle                                                      */
/* ------------------------------------------------------------------ */

export enum TripStatus {
  PLANNED = "PLANNED",
  ASSIGNED = "ASSIGNED",
  STARTED = "STARTED",
  ONGOING = "ONGOING",
  DELAYED = "DELAYED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/** All statuses, in lifecycle order — handy for filter dropdowns. */
export const TRIP_STATUSES: TripStatus[] = [
  TripStatus.PLANNED,
  TripStatus.ASSIGNED,
  TripStatus.STARTED,
  TripStatus.ONGOING,
  TripStatus.DELAYED,
  TripStatus.COMPLETED,
  TripStatus.CANCELLED,
];

/**
 * Lifecycle state machine (TM-12.1): allowed next statuses per current status.
 * CANCELLED is reachable from any active state; COMPLETED and CANCELLED are terminal.
 */
export const TRIP_STATUS_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  [TripStatus.PLANNED]: [TripStatus.ASSIGNED, TripStatus.CANCELLED],
  [TripStatus.ASSIGNED]: [TripStatus.STARTED, TripStatus.CANCELLED],
  [TripStatus.STARTED]: [
    TripStatus.ONGOING,
    TripStatus.DELAYED,
    TripStatus.CANCELLED,
  ],
  [TripStatus.ONGOING]: [
    TripStatus.DELAYED,
    TripStatus.COMPLETED,
    TripStatus.CANCELLED,
  ],
  [TripStatus.DELAYED]: [
    TripStatus.ONGOING,
    TripStatus.COMPLETED,
    TripStatus.CANCELLED,
  ],
  [TripStatus.COMPLETED]: [],
  [TripStatus.CANCELLED]: [],
};

export function getNextStatuses(status: TripStatus): TripStatus[] {
  return TRIP_STATUS_TRANSITIONS[status];
}

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  return TRIP_STATUS_TRANSITIONS[from].includes(to);
}

/** Statuses in which a trip's stops may still be added / removed / reordered (TM-05). */
export const STOP_EDITABLE_STATUSES: TripStatus[] = [
  TripStatus.PLANNED,
  TripStatus.ASSIGNED,
];

/* ------------------------------------------------------------------ */
/* Dashboard trip summary buckets (DSH-01)                             */
/* ------------------------------------------------------------------ */

/** The four dashboard summary buckets; also the `?status=` drill-down keys. */
export type TripSummaryBucket =
  | "active"
  | "upcoming"
  | "delayed"
  | "completed";

/**
 * Bucket → lifecycle statuses. Mirrors the backend dashboard summary so a card's
 * count matches the drill-down list it links to. `delayed` is the DELAYED status
 * (the drill-down filters on status, not the ETA-05.1 prediction).
 */
export const TRIP_SUMMARY_BUCKETS: Record<TripSummaryBucket, TripStatus[]> = {
  active: [TripStatus.STARTED, TripStatus.ONGOING, TripStatus.DELAYED],
  upcoming: [TripStatus.PLANNED, TripStatus.ASSIGNED],
  delayed: [TripStatus.DELAYED],
  completed: [TripStatus.COMPLETED],
};

export const TRIP_SUMMARY_BUCKET_LABELS: Record<TripSummaryBucket, string> = {
  active: "Active",
  upcoming: "Upcoming",
  delayed: "Delayed",
  completed: "Completed",
};

/**
 * One day of the dashboard's weekly activity chart (DSH-05): how many trips are
 * scheduled to start that day. Days are bucketed server-side in a fixed timezone, so
 * `date` is already the correct calendar day and needs no client-side conversion.
 */
export interface WeeklyActivityDay {
  /** Calendar day, YYYY-MM-DD. */
  date: string;
  /** Short weekday name for the axis, e.g. "Wed". */
  label: string;
  /** Trips scheduled to start on this day. */
  value: number;
}

/** Dashboard trip summary counts (DSH-01.1) — one number per bucket. */
export interface TripSummary {
  active: number;
  upcoming: number;
  delayed: number;
  completed: number;
}

/**
 * Delivery performance metrics (DSH-04.1). Counts plus rates (0–100). On-time vs
 * delayed is measured from each completed trip's actual arrival (completedAt) vs
 * scheduledEnd, so onTime + delayed === completed.
 */
export interface DeliveryMetrics {
  total: number;
  completed: number;
  onTime: number;
  delayed: number;
  completionRate: number;
  onTimeRate: number;
  delayedRate: number;
}

/** Whether stops can be edited for a trip in this status (before it starts). */
export function canEditStops(status: TripStatus): boolean {
  return STOP_EDITABLE_STATUSES.includes(status);
}

/**
 * Statuses for which a destination ETA is meaningful — the trip is in transit.
 * Mirrors the API's `ETA_ACTIVE_STATUSES` so the live recompute and the endpoint
 * apply the exact same rule (ETA-01 / ETA-02).
 */
export const ETA_ACTIVE_STATUSES: TripStatus[] = [
  TripStatus.STARTED,
  TripStatus.ONGOING,
  TripStatus.DELAYED,
];

/** Whether a live destination ETA applies to a trip in this status. */
export function isEtaActive(status: TripStatus): boolean {
  return ETA_ACTIVE_STATUSES.includes(status);
}

/* ------------------------------------------------------------------ */
/* Entities (as embedded in a Trip response)                           */
/* ------------------------------------------------------------------ */

export interface TripClient {
  id: string;
  name: string;
}

export interface TripVehicle {
  id: string;
  vehicleNumber: string;
  vehicleName?: string;
}

export interface TripDriver {
  id: string;
  name: string;
}

/** Customer a trip is placed for (CUS-07) — embedded in a Trip response. */
export interface TripCustomer {
  id: string;
  name: string;
}

/** Reference data for the trip creation form (assignable vehicles & drivers). */
export interface TripFormOptions {
  vehicles: TripVehicle[];
  drivers: TripDriver[];
}

/** Maximum number of intermediate stops allowed on a trip. */
export const MAX_TRIP_STOPS = 10;

/** An ordered intermediate stop between a trip's origin and destination. */
export interface TripStop {
  id: string;
  address: string;
  /** 1-based order among the trip's stops. */
  sequence: number;
  /** Resolved via geocoding at creation (optional for legacy/mock trips). */
  coords?: GeoPoint;
  /** TM-02.2 — set (ISO) when the stop was marked reached; null until then. */
  completedAt?: string | null;
  /** Who marked the stop reached (actor name), when available. */
  completedBy?: string | null;
}

/** Stop input on create (order = array order; the API assigns id + sequence). */
export interface CreateTripStopInput {
  address: string;
}

/** A geographic coordinate (WGS84). */
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  reference: string;
  status: TripStatus;

  /* Owner (client that manages the trip) */
  clientId: string;
  client: TripClient;

  /* Assignment (nullable until the client assigns them) */
  vehicleId: string | null;
  vehicle: TripVehicle | null;
  driverId: string | null;
  driverName: string | null;
  /** Driver contact, entered by the ADMIN at direct-create or at request approval. */
  driverPhone: string | null;

  /* Customer this trip is for (CUS-07) — nullable */
  customerId: string | null;
  customer: TripCustomer | null;

  /* Route */
  origin: string;
  originCoords?: GeoPoint;
  destination: string;
  destinationCoords?: GeoPoint;
  /** Ordered intermediate stops between origin and destination (max 10). */
  stops: TripStop[];
  distanceKm: number;
  durationMins: number;

  /* Optional free-text notes */
  notes: string | null;

  /* Timeline — ISO 8601 strings, as the API serialises dates */
  scheduledStart: string;
  scheduledEnd: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Write payloads (DTOs)                                               */
/* ------------------------------------------------------------------ */

export interface CreateTripDto {
  /** Server may auto-generate; optional on the client. */
  reference?: string;
  /** Implicit (own) for a CLIENT; explicit for API shape. */
  clientId: string;
  vehicleId?: string | null;
  driverId?: string | null;
  /**
   * Driver name + phone. Both REQUIRED for an ADMIN direct create (enforced server-side);
   * a CLIENT trip request sends neither — the ADMIN supplies them when approving.
   */
  driverName?: string | null;
  driverPhone?: string | null;
  customerId?: string | null;
  origin: string;
  destination: string;
  stops?: CreateTripStopInput[];
  distanceKm?: number;
  durationMins?: number;
  scheduledStart: string;
  scheduledEnd: string;
  notes?: string;
}

export type UpdateTripDto = Partial<CreateTripDto>;

export interface UpdateTripStatusDto {
  status: TripStatus;
}

/* ------------------------------------------------------------------ */
/* Response envelopes (match existing `data.vehicles` / `data.clients`)*/
/* ------------------------------------------------------------------ */

export interface TripsResponse {
  trips: Trip[];
}

export interface TripResponse {
  trip: Trip;
}

/* ------------------------------------------------------------------ */
/* Audit log (trip activity events)                                    */
/* ------------------------------------------------------------------ */

/** What kind of action an audit event records. */
export type TripEventAction = "CREATED" | "UPDATED" | "STATUS_CHANGED";

/** Who performed the action. */
export type TripActorRole = "ADMIN" | "CLIENT" | "SYSTEM";

export interface TripActor {
  role: TripActorRole;
  name?: string | null;
}

/**
 * Map an authenticated user to an audit actor. On the real API the actor is
 * derived server-side from the JWT; here the client supplies it for the mock.
 */
export function toTripActor(
  role: UserRole | undefined,
  name?: string | null,
): TripActor {
  const actorRole: TripActorRole =
    role === "ADMIN" ? "ADMIN" : role === "CLIENT" ? "CLIENT" : "SYSTEM";
  return { role: actorRole, name: name ?? null };
}

export interface TripEvent {
  id: string;
  tripId: string;
  action: TripEventAction;
  /** Set for status changes (and the initial CREATED, which records PLANNED). */
  status: TripStatus | null;
  note: string | null;
  actor: TripActor;
  timestamp: string;
}

export interface TripTimelineResponse {
  events: TripEvent[];
}

/* ------------------------------------------------------------------ */
/* Route (geocoded preview)                                            */
/* ------------------------------------------------------------------ */

export type RoutePointType = "pickup" | "stop" | "destination";

export interface RoutePoint {
  type: RoutePointType;
  label: string;
  sequence: number | null;
  coords: GeoPoint;
}

export interface TripRouteResponse {
  points: RoutePoint[];
}

/* ------------------------------------------------------------------ */
/* Progress & distance metrics                                         */
/* ------------------------------------------------------------------ */

/** Alert when the live position strays more than this from the route (metres). */
export const ROUTE_DEVIATION_THRESHOLD_M = 2000;

export interface TripProgress {
  totalMeters: number;
  coveredMeters: number;
  remainingMeters: number;
  /** 0–100, derived from covered / total. */
  percentage: number;
  /** False when the assigned vehicle has no usable live position. */
  hasVehiclePosition: boolean;
  /** Shortest distance from the live position to the planned route (metres). */
  deviationMeters: number;
  /** True when deviationMeters exceeds ROUTE_DEVIATION_THRESHOLD_M. */
  isDeviating: boolean;
}

export interface TripProgressResponse {
  progress: TripProgress;
  vehiclePosition: GeoPoint | null;
}

/* ------------------------------------------------------------------ */
/* ETA (destination arrival estimate — ETA-01 / ETA-02)                */
/* ------------------------------------------------------------------ */

/** Destination ETA, derived from remaining distance + effective speed. */
export interface TripEta {
  /** Absolute estimated arrival time (ISO 8601). */
  etaTimestamp: string;
  /** Seconds until arrival, from when the estimate was made. */
  etaSeconds: number;
  /** Speed the estimate was based on (km/h) — live speed or the average fallback. */
  basisSpeedKmh: number;
  /** Distance still to cover (metres). */
  remainingMeters: number;
  /** False when the assigned vehicle has no usable live position. */
  hasVehiclePosition: boolean;
}

export interface TripEtaResponse {
  /** Null when the trip isn't in transit / has no live position / has arrived. */
  eta: TripEta | null;
}

/* ------------------------------------------------------------------ */
/* Resource overlap (double-booking) validation                        */
/* ------------------------------------------------------------------ */

/** An existing trip that clashes with a candidate schedule for the same resource. */
export interface OverlapConflict {
  tripId: string;
  reference: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: TripStatus;
}

/** Result of a double-booking check (shared by vehicle & driver validation). */
export interface OverlapResponse {
  hasOverlap: boolean;
  conflicts: OverlapConflict[];
}

export type VehicleOverlapResponse = OverlapResponse;
export type DriverOverlapResponse = OverlapResponse;

/* ------------------------------------------------------------------ */
/* Route optimization (multi-stop ordering)                            */
/* ------------------------------------------------------------------ */

export interface OptimizeStopsInput {
  origin: string;
  destination: string;
  /** Intermediate stop addresses in their current order. */
  stops: string[];
}

/** A stop in optimized order, tagged with its index in the original input. */
export interface OptimizedStop {
  address: string;
  originalIndex: number;
}

export interface RouteOptimization {
  optimizedStops: OptimizedStop[];
  originalDistanceMeters: number;
  optimizedDistanceMeters: number;
  originalDurationMins: number;
  optimizedDurationMins: number;
}

export interface RouteOptimizationResponse {
  optimization: RouteOptimization;
}
