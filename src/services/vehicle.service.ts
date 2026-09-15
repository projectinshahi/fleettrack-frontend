import { apiFetch } from "@/lib/fetcher";
import { isValidCoordinate } from "@/lib/gps-utils";
import { GeoPoint, TripVehicle } from "@/types/trip";

/**
 * Shared vehicle fetch for the FleetTrack API.
 *
 * The backend scopes `/vehicles` to the authenticated user via the JWT, so a
 * CLIENT receives only their own vehicles — no clientId argument needed. This
 * centralises the fetch so trip creation reuses it instead of duplicating the
 * inline `apiFetch("/vehicles")` calls in the vehicles/tracking pages.
 *
 * `clientId` is ADMIN-only: it narrows the list to a selected client's vehicles
 * (GET /vehicles?clientId=). A CLIENT omits it — the JWT stays authoritative, so
 * it can never be used to read another tenant's vehicles.
 */

interface ApiVehicle {
  id: string;
  vehicleNumber: string;
  vehicleName: string;
}

export async function getVehicles(clientId?: string): Promise<TripVehicle[]> {
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  const response = await apiFetch(`/vehicles${query}`);
  const data = await response.json();
  const vehicles: ApiVehicle[] = data.vehicles ?? [];

  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    vehicleNumber: vehicle.vehicleNumber,
    vehicleName: vehicle.vehicleName,
  }));
}

/**
 * Live operational status for a vehicle + its driver (DSH-02). Same shape the
 * tracking socket's `vehicleLocationUpdate` broadcasts, so the live-ops board can
 * seed from this snapshot and then patch it from the socket with no reshaping.
 */
export interface LiveVehicle {
  id: string;
  vehicleNumber: string;
  driverName: string;
  status: string;
  speed: number;
  isOnline: boolean;
}

interface ApiLiveVehicle {
  id: string;
  vehicleNumber: string;
  driverName: string;
  status: string;
  speed: number;
  isOnline: boolean;
}

/**
 * Snapshot of every vehicle's live status/driver (DSH-02.1 needs no new endpoint —
 * this reuses the existing GET /vehicles, just projecting the operational fields
 * getVehicles() drops). The tracking socket keeps it current thereafter.
 */
export async function getLiveVehicles(): Promise<LiveVehicle[]> {
  const response = await apiFetch("/vehicles");
  const data = await response.json();
  const vehicles: ApiLiveVehicle[] = data.vehicles ?? [];

  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    vehicleNumber: vehicle.vehicleNumber,
    driverName: vehicle.driverName,
    status: vehicle.status,
    speed: vehicle.speed,
    isOnline: vehicle.isOnline,
  }));
}

/**
 * Normalise a raw vehicle record's coordinates to a GeoPoint, or null if the
 * position is missing/invalid. Pure and synchronous so it is reused for both the
 * REST snapshot below and the live socket feed (see trip.service).
 */
export function toVehiclePosition(
  vehicle: { latitude?: unknown; longitude?: unknown } | null | undefined,
): GeoPoint | null {
  if (
    !vehicle ||
    typeof vehicle.latitude !== "number" ||
    typeof vehicle.longitude !== "number" ||
    !isValidCoordinate(vehicle.latitude, vehicle.longitude)
  ) {
    return null;
  }

  return { lat: vehicle.latitude, lng: vehicle.longitude };
}

/** Current live position of a vehicle (snapshot); null if unknown/invalid. */
export async function getVehiclePosition(
  vehicleId: string,
): Promise<GeoPoint | null> {
  const response = await apiFetch(`/vehicles/${vehicleId}`);
  const data = await response.json();
  return toVehiclePosition(data.vehicle);
}
