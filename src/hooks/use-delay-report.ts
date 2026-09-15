"use client";

import { useEffect, useState } from "react";

import { getDelayStats } from "@/services/delay-report.service";
import {
  DelayStats,
  DelayReportFilter,
  EMPTY_DELAY_STATS,
} from "@/types/delay-report";

/**
 * Loads the delay analysis report (RPT-04.3) for the current filter through the
 * service (reusing DLY-04.1 /delays/stats). Reloads when the filter changes.
 */
export function useDelayReport() {
  const [filter, setFilter] = useState<DelayReportFilter>({});
  const [stats, setStats] = useState<DelayStats>(EMPTY_DELAY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inlined async load (no-setState-in-effect lint rule); reload on filter change.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getDelayStats(filter);
        if (!active) return;
        setStats(data);
        setError(null);
      } catch (err) {
        console.log(err);
        if (active) setError("Failed to load delay report");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [filter]);

  return { stats, filter, setFilter, loading, error };
}
