"use client";

import { useEffect, useState } from "react";

import { getCustomerDeliveryReport } from "@/services/customer-report.service";
import {
  CustomerDeliveryReport,
  CustomerReportFilter,
  EMPTY_CUSTOMER_DELIVERY_REPORT,
} from "@/types/customer-report";

/**
 * Loads the customer delivery report (RPT-06.3) for the current filter through the
 * service. Reloads whenever the filter changes; the backend scopes to the caller.
 */
export function useCustomerReport() {
  const [filter, setFilter] = useState<CustomerReportFilter>({});
  const [report, setReport] = useState<CustomerDeliveryReport>(
    EMPTY_CUSTOMER_DELIVERY_REPORT,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inlined async load (no-setState-in-effect lint rule); reload on filter change.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getCustomerDeliveryReport(filter);
        if (!active) return;
        setReport(data);
        setError(null);
      } catch (err) {
        console.log(err);
        if (active) setError("Failed to load customer report");
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
