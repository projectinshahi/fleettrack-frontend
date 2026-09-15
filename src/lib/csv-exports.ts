/**
 * Column definitions for FleetTrack's CSV exports.
 *
 * Kept out of the pages so a column is defined once and the pages stay presentational,
 * and out of `csv.ts` so that module stays domain-free.
 *
 * Every export reads the data the page ALREADY holds — no new endpoint, no widened query.
 * Authorization therefore stays exactly where it is: the server scopes
 * GET /trips, /trip-requests and /vehicles from the JWT (CLIENT sees only its own),
 * so a CSV can never contain a row the signed-in role could not already see on screen.
 *
 * Nothing here exports a credential: the Vehicle payload carries no provider token
 * (those live on GpsIntegration, which the UI never fetches) and the embedded client
 * object is `{ id, name }` only.
 */

import type { CsvColumn } from "@/lib/csv";
import { csvDateTime } from "@/lib/csv";
import type { Trip, TripStop } from "@/types/trip";
import type { TripRequest, TripRequestStop } from "@/types/trip-request";

/** Shown in the Stops column when a trip/request has none — clearer than an empty cell. */
const NO_STOPS = "No stops";

/**
 * Ordered, human-readable stop list for one cell.
 *
 * The two sources differ and are normalised here rather than at each call site:
 *   Trip.stops        → TripStop[]        (relational rows carrying an explicit `sequence`)
 *   TripRequest.stops → TripRequestStop[] (JSON array whose ORDER is the sequence)
 *
 * Trips are re-sorted by `sequence` defensively — the API already orders them, but the
 * numbering is the authoritative order and a client-side sort costs nothing. `csvCell`
 * quotes the result, so the " | " separator and any comma inside an address are safe.
 */
export function formatTripStops(stops: TripStop[] | null | undefined): string {
  if (!stops?.length) return NO_STOPS;
  return [...stops]
    .sort((a, b) => a.sequence - b.sequence)
    .map((s, i) => `Stop ${i + 1}: ${s.address}`)
    .join(" | ");
}

export function formatRequestStops(
  stops: TripRequestStop[] | null | undefined,
): string {
  // Defensive: `stops` is a JSON column server-side, so a legacy row could hold
  // something other than an array of objects. Anything unusable is skipped rather than
  // rendering "undefined" or throwing mid-export.
  if (!Array.isArray(stops) || stops.length === 0) return NO_STOPS;
  const labels = stops
    .map((s) => (typeof s?.address === "string" ? s.address.trim() : ""))
    .filter((address) => address !== "")
    .map((address, i) => `Stop ${i + 1}: ${address}`);
  return labels.length ? labels.join(" | ") : NO_STOPS;
}

/* ------------------------------------------------------------------ */
/* CLIENT — Trips                                                      */
/* ------------------------------------------------------------------ */

export const TRIP_CSV_COLUMNS: CsvColumn<Trip>[] = [
  { header: "Trip Reference", value: (t) => t.reference },
  { header: "Status", value: (t) => t.status },
  { header: "Vehicle", value: (t) => t.vehicle?.vehicleNumber },
  { header: "Driver", value: (t) => t.driverName },
  { header: "Driver Phone", value: (t) => t.driverPhone },
  { header: "Customer", value: (t) => t.customer?.name },
  { header: "Client", value: (t) => t.client?.name },
  { header: "Origin", value: (t) => t.origin },
  { header: "Destination", value: (t) => t.destination },
  { header: "Stops", value: (t) => formatTripStops(t.stops) },
  { header: "Stop Count", value: (t) => t.stops?.length ?? 0 },
  { header: "Distance (km)", value: (t) => t.distanceKm },
  { header: "Duration (mins)", value: (t) => t.durationMins },
  { header: "Scheduled Start", value: (t) => csvDateTime(t.scheduledStart) },
  { header: "Scheduled End", value: (t) => csvDateTime(t.scheduledEnd) },
  { header: "Started At", value: (t) => csvDateTime(t.startedAt) },
  { header: "Completed At", value: (t) => csvDateTime(t.completedAt) },
  { header: "Notes", value: (t) => t.notes },
  { header: "Created At", value: (t) => csvDateTime(t.createdAt) },
];

/* ------------------------------------------------------------------ */
/* Trip Requests                                                       */
/* ------------------------------------------------------------------ */

/** Fields both roles get. */
const REQUEST_BASE_COLUMNS: CsvColumn<TripRequest>[] = [
  { header: "Reference", value: (r) => r.reference },
  { header: "Status", value: (r) => r.status },
  { header: "Vehicle", value: (r) => r.vehicle?.vehicleNumber },
  { header: "Driver", value: (r) => r.driverName },
  { header: "Driver Phone", value: (r) => r.driverPhone },
  { header: "Customer", value: (r) => r.customer?.name },
  { header: "Origin", value: (r) => r.origin },
  { header: "Destination", value: (r) => r.destination },
  { header: "Stops", value: (r) => formatRequestStops(r.stops) },
  {
    header: "Stop Count",
    value: (r) => (Array.isArray(r.stops) ? r.stops.length : 0),
  },
  { header: "Distance (km)", value: (r) => r.distanceKm },
  { header: "Duration (mins)", value: (r) => r.durationMins },
  { header: "Requested Start", value: (r) => csvDateTime(r.scheduledStart) },
  { header: "Requested End", value: (r) => csvDateTime(r.scheduledEnd) },
  { header: "Notes", value: (r) => r.notes },
  { header: "Created At", value: (r) => csvDateTime(r.createdAt) },
];

/** Review outcome — meaningful to both roles (a CLIENT sees why its request was rejected). */
const REQUEST_REVIEW_COLUMNS: CsvColumn<TripRequest>[] = [
  { header: "Reviewed By", value: (r) => r.reviewedBy?.name },
  { header: "Reviewed At", value: (r) => csvDateTime(r.reviewedAt) },
  { header: "Rejection Reason", value: (r) => r.rejectionReason },
  { header: "Resulting Trip", value: (r) => r.trip?.reference },
];

/** CLIENT: its own requests — no Client column, since every row is the same client. */
export const CLIENT_TRIP_REQUEST_CSV_COLUMNS: CsvColumn<TripRequest>[] = [
  ...REQUEST_BASE_COLUMNS,
  ...REQUEST_REVIEW_COLUMNS,
];

/** ADMIN: every client's requests, so the owning client is the second column. */
export const ADMIN_TRIP_REQUEST_CSV_COLUMNS: CsvColumn<TripRequest>[] = [
  REQUEST_BASE_COLUMNS[0],
  { header: "Client", value: (r) => r.client?.name },
  ...REQUEST_BASE_COLUMNS.slice(1),
  ...REQUEST_REVIEW_COLUMNS,
];

/* ------------------------------------------------------------------ */
/* ADMIN — Vehicles                                                    */
/* ------------------------------------------------------------------ */

/**
 * The vehicle fields GET /vehicles returns. Declared here rather than reusing the table's
 * narrower row type: the endpoint sends the whole Vehicle row, but the table only types
 * the handful of columns it renders, so the export would otherwise have no types for
 * telemetry it can legitimately include.
 */
export interface VehicleExportRow {
  id: string;
  vehicleName?: string | null;
  vehicleNumber?: string | null;
  gpsDeviceId?: string | null;
  driverName?: string | null;
  status?: string | null;
  isOnline?: boolean | null;
  speed?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  ignition?: boolean | null;
  batteryVoltage?: number | null;
  imei?: string | null;
  providerName?: string | null;
  providerVehicleId?: string | null;
  lastProviderUpdate?: string | null;
  lastSeenAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  client?: { id: string; name: string } | null;
}

export const VEHICLE_CSV_COLUMNS: CsvColumn<VehicleExportRow>[] = [
  { header: "Vehicle Number", value: (v) => v.vehicleNumber },
  { header: "Vehicle Name", value: (v) => v.vehicleName },
  { header: "Driver", value: (v) => v.driverName },
  { header: "Client", value: (v) => v.client?.name ?? "Unassigned" },
  { header: "Status", value: (v) => v.status },
  { header: "Online", value: (v) => (v.isOnline ? "Yes" : "No") },
  { header: "Speed (km/h)", value: (v) => v.speed },
  { header: "Ignition", value: (v) => (v.ignition ? "On" : "Off") },
  { header: "Latitude", value: (v) => v.latitude },
  { header: "Longitude", value: (v) => v.longitude },
  { header: "Provider", value: (v) => v.providerName },
  { header: "Provider Vehicle ID", value: (v) => v.providerVehicleId },
  { header: "IMEI", value: (v) => v.imei },
  { header: "GPS Device ID", value: (v) => v.gpsDeviceId },
  { header: "Battery Voltage", value: (v) => v.batteryVoltage },
  {
    header: "Last GPS Fix",
    value: (v) => csvDateTime(v.lastProviderUpdate),
  },
  { header: "Last Seen", value: (v) => csvDateTime(v.lastSeenAt) },
  { header: "Created At", value: (v) => csvDateTime(v.createdAt) },
  { header: "Updated At", value: (v) => csvDateTime(v.updatedAt) },
];
