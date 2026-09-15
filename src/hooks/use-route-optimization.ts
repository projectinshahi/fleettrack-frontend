"use client";

import { useCallback, useState } from "react";

import { optimizeTripRoute } from "@/services/trip.service";
import { OptimizeStopsInput, RouteOptimization } from "@/types/trip";

/**
 * On-demand multi-stop route optimization for the creation modal. Mirrors
 * useRoutePreview: imperative `optimize`, through the service only. Returns the
 * before/after result (or null on failure); components never call the service.
 */
export function useRouteOptimization() {
  const [result, setResult] = useState<RouteOptimization | null>(null);
  const [loading, setLoading] = useState(false);

  const optimize = useCallback(async (input: OptimizeStopsInput) => {
    try {
      setLoading(true);
      const res = await optimizeTripRoute(input);
      setResult(res.optimization);
      return res.optimization;
    } catch (err) {
      console.log(err);
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResult(null), []);

  return { result, loading, optimize, clear };
}
