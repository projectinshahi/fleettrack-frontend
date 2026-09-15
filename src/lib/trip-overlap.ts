/**
 * Input shapes for the trip double-booking checks (TM-09 / TM-10).
 *
 * The overlap algorithm itself now lives on the server (GET /trips/overlap and the
 * create/update guards) so there is a single source of truth. These types just
 * describe what the client passes to trip.service's checkVehicleOverlap /
 * checkDriverOverlap.
 */

export interface OverlapCandidate {
  vehicleId: string;
  scheduledStart: string;
  scheduledEnd: string;
  /** Exclude this trip from the check (when editing an existing trip). */
  excludeTripId?: string;
  /** ADMIN-only: scope the check to the selected client. A CLIENT omits it (JWT-scoped). */
  clientId?: string;
}

export interface DriverOverlapCandidate {
  driverId: string;
  scheduledStart: string;
  scheduledEnd: string;
  /** Exclude this trip from the check (when editing an existing trip). */
  excludeTripId?: string;
  /** ADMIN-only: scope the check to the selected client. A CLIENT omits it (JWT-scoped). */
  clientId?: string;
}
