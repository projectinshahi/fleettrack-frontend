/**
 * Trip Request domain contract (frontend), mirroring the backend Slice 1 `TripRequest`
 * model + the relations a GET will include (client / vehicle / customer / reviewer /
 * resulting trip). Kept API-shaped so the dummy service can later be swapped for real
 * HTTP calls with no change to the UI.
 *
 * TripRequestStatus is SEPARATE from TripStatus — a request is not a trip. There is no
 * REQUESTED trip status and no Driver entity (driver stays a name/label, as elsewhere).
 */

import type { UserRole } from "@/types/user";
import type { TripClient, TripVehicle, TripCustomer } from "@/types/trip";

export enum TripRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

/** All statuses — handy for filter chips. */
export const TRIP_REQUEST_STATUSES: TripRequestStatus[] = [
  TripRequestStatus.PENDING,
  TripRequestStatus.APPROVED,
  TripRequestStatus.REJECTED,
];

/** An admin recorded as the reviewer on approve/reject. */
export interface TripRequestReviewer {
  id: string;
  name: string;
}

/** The Trip produced when a request is approved (for the deep-link on the detail page). */
export interface TripRequestResultTrip {
  id: string;
  reference: string;
}

/** An ordered stop captured on the request (address + optional geocoded coords). */
export interface TripRequestStop {
  address: string;
  lat?: number | null;
  lng?: number | null;
}

export interface TripRequest {
  id: string;
  status: TripRequestStatus;

  /* Owner (the client that submitted the request) */
  clientId: string;
  client: TripClient;

  /* Trip payload snapshot */
  reference: string | null;
  vehicleId: string | null;
  vehicle: TripVehicle | null;
  /**
   * Driver is NOT part of what a CLIENT submits — these stay null until an ADMIN enters
   * them in the approval modal, at which point they are saved here and on the Trip.
   */
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  customerId: string | null;
  customer: TripCustomer | null;

  origin: string;
  destination: string;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  stops: TripRequestStop[];
  distanceKm: number | null;
  durationMins: number | null;
  notes: string | null;

  scheduledStart: string;
  scheduledEnd: string;

  /* Review outcome (set on approve/reject) */
  tripId: string | null;
  trip: TripRequestResultTrip | null;
  reviewedById: string | null;
  reviewedBy: TripRequestReviewer | null;
  reviewedAt: string | null;
  rejectionReason: string | null;

  createdAt: string;
  updatedAt: string;
}

/** Capability flags: the CLIENT submits requests; the ADMIN reviews (approve/reject). */
export interface TripRequestPermissions {
  canView: boolean;
  canCreate: boolean;
  canReview: boolean;
}

export function getTripRequestPermissions(
  role: UserRole | undefined,
): TripRequestPermissions {
  return {
    canView: role === "ADMIN" || role === "CLIENT",
    canCreate: role === "CLIENT",
    canReview: role === "ADMIN",
  };
}
