"use client";

import { useEffect, useState } from "react";

import { getVehicleUtilizationReport } from "@/services/vehicle-report.service";
import {
  VehicleUtilizationReport,
  VehicleReportFilter,
  EMPTY_VEHICLE_UTILIZATION_REPORT,
} from "@/types/vehicle-report";

/**
 * Loads the vehicle utilization report (RPT-03.3) for the current filter through the
 * service. Reloads whenever the filter changes; the backend scopes to the caller.
 */
export function useVehicleReport() {
  const [filter, setFilter] = useState<VehicleReportFilter>({});
  const [report, setReport] = useState<VehicleUtilizationReport>(
    EMPTY_VEHICLE_UTILIZATION_REPORT,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inlined async load (no-setState-in-effect lint rule); reload on filter change.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getVehicleUtilizationReport(filter);
        if (!active) return;
        setReport(data);
        setError(null);
      } catch (err) {
        console.log(err);
        if (active) setError("Failed to load vehicle report");
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
