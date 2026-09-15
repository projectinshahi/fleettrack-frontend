import { apiFetch } from "@/lib/fetcher";
import {
  CostReport,
  CostReportFilter,
  EMPTY_COST_REPORT,
} from "@/types/cost-report";

/**
 * Cost report service (TCM-05). Reads planned-vs-actual report data and returns the
 * raw export Response (a PDF) for download — the server owns both the query and the
 * PDF, so there is no client-side report or export logic to duplicate.
 *
 *   API: GET /trip-costs/report         -> { rows, byComponent, totals }
 *        GET /trip-costs/report/export  -> application/pdf
 */
function queryString(filter: CostReportFilter): string {
  const params = new URLSearchParams();
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getCostReport(
  filter: CostReportFilter,
): Promise<CostReport> {
  // apiFetch throws on non-2xx — a failed report must reach the caller's error state,
  // never render as a real all-zero report.
  const res = await apiFetch(`/trip-costs/report${queryString(filter)}`);
  const data = await res.json();
  return {
    rows: data.rows ?? [],
    byComponent: data.byComponent ?? [],
    totals: data.totals ?? EMPTY_COST_REPORT.totals,
  };
}

export async function exportCostReport(
  filter: CostReportFilter,
): Promise<Response> {
  return apiFetch(`/trip-costs/report/export${queryString(filter)}`);
}
