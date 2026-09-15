"use client";

import { useEffect, useState } from "react";

import { getCostReport } from "@/services/cost-report.service";
import {
  CostReport,
  CostReportFilter,
  EMPTY_COST_REPORT,
} from "@/types/cost-report";

/**
 * Loads the cost report (TCM-05.3) for the current filter through the service.
 * Reloads whenever the filter changes; the backend scopes to the caller's trips.
 */
export function useCostReport() {
  const [filter, setFilter] = useState<CostReportFilter>({});
  const [report, setReport] = useState<CostReport>(EMPTY_COST_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inlined async load (no-setState-in-effect lint rule); reload on filter change.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getCostReport(filter);
        if (!active) return;
        setReport(data);
        setError(null);
      } catch (err) {
        console.log(err);
        if (active) setError("Failed to load cost report");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [filter]);

  return { report, filter, setFilter, loading, error };
}
