"use client";

import { useEffect, useState } from "react";

import { socket } from "@/lib/socket";
import { getTrips } from "@/services/trip.service";
import { getLiveVehicles, LiveVehicle } from "@/services/vehicle.service";
import { ETA_ACTIVE_STATUSES, isEtaActive, Trip } from "@/types/trip";
import { useAuthStore } from "@/store/auth-store";
import { useClientStore } from "@/store/client-store";

/**
 * Live operations feed (DSH-02). Reuses existing infrastructure only — no new
 * backend, no new socket connection, no polling:
 *  - ongoing trips from GET /trips (kept to ETA_ACTIVE_STATUSES);
 *  - a live vehicle/driver status map seeded from GET /vehicles and then patched
 *    from the shared tracking socket's `vehicleLocationUpdate` events.
 *
 * The trip set is fetched once per client scope (trips change on lifecycle events,
 * not every GPS tick); the near-real-time part — vehicle & driver status — is the
 * socket. One centralized subscription with specific-handler cleanup so it never
 * clobbers other listeners.
 */
export function useLiveOps() {
  const { user, hydrated } = useAuthStore();
  const { selectedClient } = useClientStore();

  // A CLIENT is pinned to its own trips; an ADMIN may narrow by the selected client.
  const clientId = user?.role === "CLIENT" ? user.id : selectedClient?.id;

  const [ongoingTrips, setOngoingTrips] = useState<Trip[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<Record<string, LiveVehicle>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial snapshot: ongoing trips + a seed of live vehicle status. Inlined async
  // (no-setState-in-effect lint rule); re-run on clientId change (ADMIN filter).
  useEffect(() => {
    // Auth hydrates in an effect (AuthProvider), and child effects run before parent
    // ones — so without this guard the first pass fetches with `user` still null, i.e.
    // unscoped, and hydration then re-runs it. Waiting costs nothing: `loading` starts
    // true, so the skeleton is already showing.
    if (!hydrated) return;

    let active = true;

    async function load() {
      try {
        // Same in-transit set as the ETA overview — matching URLs means the two
        // widgets still share one request via getTrips' in-flight de-duplication.
        const [tripsRes, vehicles] = await Promise.all([
          getTrips(clientId, ETA_ACTIVE_STATUSES),
          getLiveVehicles(),
        ]);
        if (!active) return;
        setOngoingTrips(tripsRes.trips.filter((t) => isEtaActive(t.status)));
        setLiveVehicles(
          Object.fromEntries(vehicles.map((v) => [v.id, v])),
        );
        setError(null);
      } catch (err) {
        // apiFetch rejects on non-2xx, so a failure (including a 403 on /trips) lands
        // here instead of silently resolving to an empty list. Without this the board
        // rendered "No ongoing trips" — indistinguishable from a genuinely quiet fleet.
        console.error(err);
        if (active) setError("Couldn't load live operations.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [clientId, hydrated]);

  // Live vehicle/driver status via the shared tracking socket (reused singleton —
  // not a new connection). Patches the status map in place on each broadcast.
  useEffect(() => {
    const handler = (payload: LiveVehicle) => {
      if (!payload?.id) return;
      setLiveVehicles((prev) => ({
        ...prev,
        [payload.id]: {
          id: payload.id,
          vehicleNumber: payload.vehicleNumber,
          driverName: payload.driverName,
          status: payload.status,
          speed: payload.speed,
          isOnline: payload.isOnline,
        },
      }));
    };

    socket.on("vehicleLocationUpdate", handler);

    return () => {
      socket.off("vehicleLocationUpdate", handler);
    };
  }, []);

  return { ongoingTrips, liveVehicles, loading, error };
}
