"use client";

import { useCallback, useEffect, useState } from "react";

import { getTripCost, saveTripCost } from "@/services/trip-cost.service";
import {
  CostVariance,
  TripCost,
  TripCostInput,
  ZERO_VARIANCE,
} from "@/types/trip-cost";

/**
 * Loads a trip's cost breakdown + derived variance (TCM-01.4 / TCM-04.3) and
 * exposes a save (estimated + actual) that updates state in place. Service only.
 */
export function useTripCost(tripId: string) {
  const [cost, setCost] = useState<TripCost | null>(null);
  const [variance, setVariance] = useState<CostVariance>(ZERO_VARIANCE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inlined async load (no-setState-in-effect lint rule); reload on tripId change.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getTripCost(tripId);
        if (!active) return;
        setCost(result.cost);
        setVariance(result.variance);
        setError(null);
      } catch (err) {
        console.log(err);
        if (active) setError("Failed to load costs");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [tripId]);

  const saveCost = useCallback(
    async (input: TripCostInput) => {
      const result = await saveTripCost(tripId, input);
      setCost(result.cost);
      setVariance(result.variance);
      return result;
    },
    [tripId],
  );

  return { cost, variance, loading, error, saveCost };
}
