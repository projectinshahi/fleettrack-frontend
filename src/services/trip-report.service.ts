import { apiFetch } from "@/lib/fetcher";
import {
  TripSummaryReport,
  TripReportFilter,
  EMPTY_TRIP_SUMMARY_REPORT,
} from "@/types/trip-report";

/**
 * Trip summary report service (RPT-01). Reads report data and returns the raw PDF
 * export Response for download — the server owns both the query and the PDF (same
 * pattern as the cost report), so there is no client-side report or export logic.
 *
 *   API: GET /trip-reports/summary         -> { range, total, byStatus, rows }
 *        GET /trip-reports/summary/export  -> application/pdf
 */
function queryString(filter: TripReportFilter): string {
  const params = new URLSearchParams();
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getTripSummaryReport(
  filter: TripReportFilter,
): Promise<TripSummaryReport> {
  // apiFetch throws on non-2xx — a failed report must reach the caller's error state,
  // never render as a real all-zero report.
  const res = await apiFetch(`/trip-reports/summary${queryString(filter)}`);
  const data = await res.json();
  return {
    range: data.range ?? EMPTY_TRIP_SUMMARY_REPORT.range,
    total: data.total ?? 0,
    byStatus: data.byStatus ?? [],
    rows: data.rows ?? [],
  };
}

export async function exportTripSummaryReport(
  filter: TripReportFilter,
): Promise<Response> {
  return apiFetch(`/trip-reports/summary/export${queryString(filter)}`);
}
