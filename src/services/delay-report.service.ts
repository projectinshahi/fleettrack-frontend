import { apiFetch } from "@/lib/fetcher";
import {
  DelayStats,
  DelayReportFilter,
  EMPTY_DELAY_STATS,
} from "@/types/delay-report";

/**
 * Delay analysis report service (RPT-04). Reuses the existing DLY-04.1 aggregation
 * endpoint for the data and its PDF export — no client-side aggregation, no new
 * delay query (same pattern as the trip/cost reports).
 *
 *   API: GET /delays/stats         -> { range, total, byCategory, byDriver, ... }
 *        GET /delays/stats/export  -> application/pdf
 */
function queryString(filter: DelayReportFilter): string {
  const params = new URLSearchParams();
  if (filter.period) params.set("period", filter.period);
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getDelayStats(
  filter: DelayReportFilter,
): Promise<DelayStats> {
  // apiFetch throws on non-2xx — a failed report must reach the caller's error state,
  // never render as a real all-zero report.
  const res = await apiFetch(`/delays/stats${queryString(filter)}`);
  const data = await res.json();
  return {
    range: data.range ?? EMPTY_DELAY_STATS.range,
    total: data.total ?? EMPTY_DELAY_STATS.total,
    byCategory: data.byCategory ?? [],
    byDriver: data.byDriver ?? [],
    byRoute: data.byRoute ?? [],
    byPeriod: data.byPeriod ?? [],
  };
}

export async function exportDelayStats(
  filter: DelayReportFilter,
): Promise<Response> {
  return apiFetch(`/delays/stats/export${queryString(filter)}`);
}
