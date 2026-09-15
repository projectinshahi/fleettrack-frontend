"use client";

import { useEffect, useState } from "react";

import {
  getTrips,
  getTripEta,
  getTripProgress,
} from "@/services/trip.service";
import {
  ETA_ACTIVE_STATUSES,
  isEtaActive,
  Trip,
  TripEta,
  TripProgress,
} from "@/types/trip";
import { useAuthStore } from "@/store/auth-store";
import { useClientStore } from "@/store/client-store";

/** Poll interval for the near-real-time ETA overview (mirrors use-delays). */
const REFRESH_MS = 20000;

/** One active trip's live ETA + progress, composed from existing per-trip APIs. */
export interface EtaOverviewRow {
  trip: Trip;
  eta: TripEta | null;
  progress: TripProgress | null;
}

/**
 * ETA overview across all active trips (DSH-03). Composes existing endpoints only
 * — no new backend, no new ETA maths: lists trips (GET /trips), keeps the in-transit
 * ones (ETA_ACTIVE_STATUSES) and, per trip, reads its destination ETA
 * (GET /trips/:id/eta) and route progress (GET /trips/:id/progress). Polls on an
 * interval for near-real-time values — one loop, no per-trip socket subscriptions.
 */
export function useEtaOverview() {
  const { user, hydrated } = useAuthStore();
  const { selectedClient } = useClientStore();

  // A CLIENT is pinned to its own trips; an ADMIN may narrow by the selected client.
  const clientId = user?.role === "CLIENT" ? user.id : selectedClient?.id;

  const [rows, setRows] = useState<EtaOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inlined async load (satisfies the no-setState-in-effect lint rule); re-run on an
  // interval for a near-real-time overview, and on clientId change (ADMIN filter).
  useEffect(() => {
    // Wait for auth to hydrate before the first fetch — see use-live-ops for why.
    // This also keeps the poll timer from starting against an unscoped clientId.
    if (!hydrated) return;

    let active = true;

    async function loadRow(trip: Trip): Promise<EtaOverviewRow> {
      try {
        const [etaRes, progressRes] = await Promise.all([
          getTripEta(trip.id),
          getTripProgress(trip.id),
        ]);
        return { trip, eta: etaRes.eta, progress: progressRes.progress };
      } catch {
        // One trip's transient error must not drop the whole overview.
        return { trip, eta: null, progress: null };
      }
    }

    // A cycle costs 1 + 2N requests, so at a high trip count it can outlast the 20s
    // interval. setInterval doesn't wait, so ticks would pile up on each other; skip
    // a tick while one is still in flight rather than stacking overlapping loads.
    let inFlight = false;

    async function load() {
      if (inFlight) return;
      inFlight = true;
      try {
        // Ask the server for just the in-transit statuses instead of pulling every
        // trip (with all its stops) every 20s. The client-side filter stays as a
        // cheap guard so the row set is right even if the query is ever dropped.
        const { trips } = await getTrips(clientId, ETA_ACTIVE_STATUSES);
        const activeTrips = trips.filter((t) => isEtaActive(t.status));
        const next = await Promise.all(activeTrips.map(loadRow));
        if (!active) return;
        setRows(next);
        setError(null);
      } catch (err) {
        console.error(err);
        if (active) setError("Failed to load ETA overview");
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [clientId, hydrated]);

  return { rows, loading, error };
}
