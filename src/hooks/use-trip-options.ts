"use client";

import { useEffect, useState } from "react";

import { getTripFormOptions } from "@/services/trip.service";
import { TripDriver, TripVehicle } from "@/types/trip";

/**
 * Loads assignable vehicles & drivers for the trip creation form.
 * Goes through the service (never the mock) so it swaps to the real API cleanly.
 *
 * `clientId` is ADMIN-only: passing a selected client loads THAT client's vehicles
 * & drivers, and the hook refetches whenever it changes. A CLIENT calls it with no
 * argument and keeps the existing JWT-scoped behavior. On a client switch the
 * previous client's lists are cleared before the new data arrives, and a superseded
 * in-flight response is ignored, so the form never shows another client's resources.
 */
const NO_VEHICLES: TripVehicle[] = [];
const NO_DRIVERS: TripDriver[] = [];

/** `enabled` false: no request, and an idle empty result (the form is closed). */
export function useTripOptions(clientId?: string, enabled = true) {
  const [vehicles, setVehicles] = useState<TripVehicle[]>([]);
  const [drivers, setDrivers] = useState<TripDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    // Ignore a response that a newer clientId has already superseded.
    let ignore = false;

    async function load() {
      setLoading(true);
      // Drop the previous client's resources up front so a switch never flashes
      // stale vehicles/drivers while the new client's lists load.
      setVehicles([]);
      setDrivers([]);
      try {
        const data = await getTripFormOptions(clientId);
        if (ignore) return;
        setVehicles(data.vehicles);
        setDrivers(data.drivers);
      } catch (err) {
        if (ignore) return;
        console.log(err);
        setVehicles([]);
        setDrivers([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [clientId, enabled]);

  return enabled
    ? { vehicles, drivers, loading }
    : { vehicles: NO_VEHICLES, drivers: NO_DRIVERS, loading: false };
}
