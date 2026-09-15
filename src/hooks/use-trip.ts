"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  completeTripStop,
  getTrip,
  getTripEta,
  getTripProgress,
  getTripRoute,
  getTripTimeline,
  progressFromVehicle,
  updateTrip,
  updateTripStatus,
} from "@/services/trip.service";
import { socket } from "@/lib/socket";
import { computeEta } from "@/lib/trip-eta";
import {
  GeoPoint,
  getTripPermissions,
  isEtaActive,
  RoutePoint,
  Trip,
  TripEta,
  TripEvent,
  TripProgress,
  TripStatus,
} from "@/types/trip";
import { useAuthStore } from "@/store/auth-store";

/**
 * Loads a single trip + its lifecycle timeline for the detail page, and exposes
 * a role-aware status transition. Goes through the service only (never the mock).
 */
export function useTrip(id: string) {
  const { user } = useAuthStore();

  const permissions = useMemo(
    () => getTripPermissions(user?.role),
    [user?.role],
  );

  const [trip, setTrip] = useState<Trip | null>(null);
  const [timeline, setTimeline] = useState<TripEvent[]>([]);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [progress, setProgress] = useState<TripProgress | null>(null);
  const [eta, setEta] = useState<TripEta | null>(null);
  const [vehiclePosition, setVehiclePosition] = useState<GeoPoint | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Latest route, kept in a ref so the live socket handler always projects onto
  // the current route without re-subscribing on every refetch (route is stable).
  const routeRef = useRef<RoutePoint[]>(route);
  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  // Current status in a ref so the live socket handler applies the ETA status gate
  // without re-subscribing on every transition (mirrors routeRef).
  const statusRef = useRef<TripStatus | undefined>(trip?.status);
  useEffect(() => {
    statusRef.current = trip?.status;
  }, [trip?.status]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tripRes, timelineRes, routeRes, progressRes, etaRes] =
        await Promise.all([
          getTrip(id),
          getTripTimeline(id),
          getTripRoute(id),
          getTripProgress(id),
          getTripEta(id),
        ]);
      setTrip(tripRes.trip);
      setTimeline(timelineRes.events);
      setRoute(routeRes.points);
      setProgress(progressRes.progress);
      setEta(etaRes.eta);
      setVehiclePosition(progressRes.vehiclePosition);
    } catch (err) {
      console.log(err);
      setError("Trip not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load — inlined (not a call to refetch) to satisfy the
  // no-setState-in-effect lint rule, mirroring use-trips.
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setLive(false);
        const [tripRes, timelineRes, routeRes, progressRes, etaRes] =
          await Promise.all([
            getTrip(id),
            getTripTimeline(id),
            getTripRoute(id),
            getTripProgress(id),
            getTripEta(id),
          ]);
        setTrip(tripRes.trip);
        setTimeline(timelineRes.events);
        setRoute(routeRes.points);
        setProgress(progressRes.progress);
        setEta(etaRes.eta);
        setVehiclePosition(progressRes.vehiclePosition);
      } catch (err) {
        console.log(err);
        setError("Trip not found");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Live progress (Milestone 6): reuse the tracking socket feed instead of
  // polling. When the assigned vehicle broadcasts a new position, recompute
  // progress against the loaded route — all GPS maths stays in the service.
  const vehicleId = trip?.vehicleId ?? null;
  useEffect(() => {
    if (!vehicleId) return;

    const handler = (payload: {
      id: string;
      latitude?: number;
      longitude?: number;
      speed?: number;
    }) => {
      if (!payload || payload.id !== vehicleId) return;

      const next = progressFromVehicle(routeRef.current, payload);
      if (!next.vehiclePosition) return; // ignore updates without a usable fix

      setProgress(next.progress);
      setVehiclePosition(next.vehiclePosition);
      setLive(true);

      // Recompute the destination ETA from the live remaining distance + speed
      // (ETA-02.1) — same feed, pure maths, no refetch. Gated on the same active
      // statuses as the API's getEta, so socket updates never create or update an
      // ETA for a PLANNED / ASSIGNED / CANCELLED / COMPLETED trip.
      const status = statusRef.current;
      if (status && isEtaActive(status)) {
        setEta(
          next.progress.remainingMeters > 0
            ? computeEta(next.progress.remainingMeters, payload.speed, Date.now())
            : null,
        );
      }
    };

    socket.on("vehicleLocationUpdate", handler);
    return () => {
      socket.off("vehicleLocationUpdate", handler);
    };
  }, [vehicleId]);

  const changeStatus = useCallback(
    async (status: TripStatus) => {
      const res = await updateTripStatus(id, status);
      await refetch();
      return res.trip;
    },
    [id, refetch],
  );

  // Persist an edited stop list (TM-05.3). Full-list replace via the service;
  // refetch so the route, map and progress re-derive from the new stops.
  const saveStops = useCallback(
    async (stops: { address: string }[]) => {
      const res = await updateTrip(id, { stops });
      await refetch();
      return res.trip;
    },
    [id, refetch],
  );

  // Mark a stop reached (TM-02.2). The server enforces order/lifecycle/ownership;
  // refetch so the stop's completed state and the unlocked completion reflect at once.
  const completeStop = useCallback(
    async (stopId: string) => {
      const res = await completeTripStop(id, stopId);
      await refetch();
      return res.trip;
    },
    [id, refetch],
  );

  return {
    trip,
    timeline,
    route,
    progress,
    eta,
    vehiclePosition,
    live,
    loading,
    error,
    permissions,
    changeStatus,
    saveStops,
    completeStop,
    refetch,
  };
}
