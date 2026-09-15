"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createTrip as createTripApi,
  deleteTrip as deleteTripApi,
  getTrips,
  updateTrip as updateTripApi,
  updateTripStatus as updateTripStatusApi,
} from "@/services/trip.service";

import {
  CreateTripDto,
  getTripPermissions,
  Trip,
  TripStatus,
  UpdateTripDto,
} from "@/types/trip";

import { useAuthStore } from "@/store/auth-store";
import { useClientStore } from "@/store/client-store";

/**
 * Single access point for trip data. Components consume this hook only — they never
 * import the service or the mock directly.
 *
 * Role-based scoping:
 *  - CLIENT → pinned to their own trips (their user id is the client id on login).
 *  - ADMIN  → sees all trips, or filters by the selected client (like use-dashboard).
 */
export function useTrips() {
  const { user } = useAuthStore();
  const { selectedClient } = useClientStore();

  const permissions = useMemo(
    () => getTripPermissions(user?.role),
    [user?.role],
  );

  // A client is scoped to itself; an admin may narrow by the selected client.
  const clientId = user?.role === "CLIENT" ? user.id : selectedClient?.id;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual reload, reused by the mutation wrappers below.
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTrips(clientId);
      setTrips(data.trips);
    } catch (err) {
      console.log(err);
      setError("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Initial load + reload when the scoped client changes. Kept inline (not a call
  // to `refetch`) to satisfy the no-setState-in-effect lint rule, mirroring use-dashboard.
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTrips(clientId);
        setTrips(data.trips);
      } catch (err) {
        console.log(err);
        setError("Failed to load trips");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [clientId]);

  /* Mutations — thin wrappers that refetch so the list stays in sync. */

  const createTrip = useCallback(
    async (dto: CreateTripDto) => {
      const res = await createTripApi(dto);
      await refetch();
      return res.trip;
    },
    [refetch],
  );

  const updateTrip = useCallback(
    async (id: string, dto: UpdateTripDto) => {
      const res = await updateTripApi(id, dto);
      await refetch();
      return res.trip;
    },
    [refetch],
  );

  const changeStatus = useCallback(
    async (id: string, status: TripStatus) => {
      const res = await updateTripStatusApi(id, status);
      await refetch();
      return res.trip;
    },
    [refetch],
  );

  const removeTrip = useCallback(
    async (id: string) => {
      await deleteTripApi(id);
      await refetch();
    },
    [refetch],
  );

  return {
    trips,
    loading,
    error,
    permissions,
    refetch,
    createTrip,
    updateTrip,
    changeStatus,
    removeTrip,
  };
}
