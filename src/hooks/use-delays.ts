"use client";

import { useEffect, useState } from "react";

import { getDelays } from "@/services/delay.service";
import { Delay } from "@/types/delay";

/** Poll interval for the near-real-time list (no delay socket exists). */
const REFRESH_MS = 20000;

/**
 * Loads the delay list (DLY-01.2) through the service (GET /delays). Polls on an
 * interval so the list stays near-real-time without a dedicated socket event.
 */
export function useDelays() {
  const [delays, setDelays] = useState<Delay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inlined async load (satisfies the no-setState-in-effect lint rule); re-run on
  // an interval for a near-real-time list.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getDelays();
        if (!active) return;
        setDelays(data);
        setError(null);
      } catch (err) {
        console.log(err);
        if (active) setError("Failed to load delays");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return { delays, loading, error };
}
