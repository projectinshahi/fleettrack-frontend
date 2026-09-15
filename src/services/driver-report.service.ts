import { apiFetch } from "@/lib/fetcher";
import {
  DriverPerformanceReport,
  DriverReportFilter,
  EMPTY_DRIVER_PERFORMANCE_REPORT,
} from "@/types/driver-report";

/**
 * Driver performance report service (RPT-02). Reads report data and returns the raw
 * PDF export Response for download — the server owns both the query and the PDF (same
 * pattern as the trip/cost reports), so there is no client-side report or export logic.
 *
 *   API: GET /driver-reports/performance         -> { range, totals, rows }
 *        GET /driver-reports/performance/export  -> application/pdf
 */
function queryString(filter: DriverReportFilter): string {
  const params = new URLSearchParams();
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getDriverPerformanceReport(
  filter: DriverReportFilter,
): Promise<DriverPerformanceReport> {
  const res = await apiFetch(
    `/driver-reports/performance${queryString(filter)}`,
  );
  // apiFetch throws on non-2xx — a failed report must reach the caller's error state,
  // never render as a real all-zero report.
  const data = await res.json();
  return {
    range: data.range ?? EMPTY_DRIVER_PERFORMANCE_REPORT.range,
    totals: data.totals ?? EMPTY_DRIVER_PERFORMANCE_REPORT.totals,
    rows: data.rows ?? [],
  };
}

export async function exportDriverPerformanceReport(
  filter: DriverReportFilter,
): Promise<Response> {
  return apiFetch(`/driver-reports/performance/export${queryString(filter)}`);
}
