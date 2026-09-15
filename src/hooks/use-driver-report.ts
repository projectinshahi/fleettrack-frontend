"use client";

import { useEffect, useState } from "react";

import { getDriverPerformanceReport } from "@/services/driver-report.service";
import {
  DriverPerformanceReport,
  DriverReportFilter,
  EMPTY_DRIVER_PERFORMANCE_REPORT,
} from "@/types/driver-report";

/**
 * Loads the driver performance report (RPT-02.3) for the current filter through the
 * service. Reloads whenever the filter changes; the backend scopes to the caller.
 */
export function useDriverReport() {
  const [filter, setFilter] = useState<DriverReportFilter>({});
  const [report, setReport] = useState<DriverPerformanceReport>(
    EMPTY_DRIVER_PERFORMANCE_REPORT,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inlined async load (no-setState-in-effect lint rule); reload on filter change.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getDriverPerformanceReport(filter);
        if (!active) return;
        setReport(data);
        setError(null);
      } catch (err) {
        console.log(err);
        if (active) setError("Failed to load driver report");
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
