"use client";

import { useCallback, useEffect, useState } from "react";

import { getPod, savePod } from "@/services/pod.service";
import { PodInput, ProofOfDelivery } from "@/types/pod";

/**
 * Loads a trip's proof-of-delivery record (POD-01/03/04) and exposes a save that
 * updates state in place. Service only (mirrors useTripCost).
 */
export function usePod(tripId: string) {
  const [pod, setPod] = useState<ProofOfDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inlined async load (no-setState-in-effect lint rule); reload on tripId change.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getPod(tripId);
        if (!active) return;
        setPod(result);
        setError(null);
      } catch (err) {
        console.log(err);
        if (active) setError("Failed to load proof of delivery");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [tripId]);

  const save = useCallback(
    async (input: PodInput) => {
      const result = await savePod(tripId, input);
      setPod(result);
      return result;
    },
    [tripId],
  );

  return { pod, loading, error, savePod: save };
}
