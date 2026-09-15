"use client";

import { useEffect, useState } from "react";

import { getTripSummaryReport } from "@/services/trip-report.service";
import {
  TripSummaryReport,
  TripReportFilter,
  EMPTY_TRIP_SUMMARY_REPORT,
} from "@/types/trip-report";

/**
 * Loads the trip summary report (RPT-01.3) for the current filter through the
 * service. Reloads whenever the filter changes; the backend scopes to the caller.
 */
export function useTripReport() {
  const [filter, setFilter] = useState<TripReportFilter>({});
  const [report, setReport] = useState<TripSummaryReport>(
    EMPTY_TRIP_SUMMARY_REPORT,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inlined async load (no-setState-in-effect lint rule); reload on filter change.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getTripSummaryReport(filter);
        if (!active) return;
        setReport(data);
        setError(null);
      } catch (err) {
        console.log(err);
        if (active) setError("Failed to load trip report");
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
