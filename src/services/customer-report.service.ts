import { apiFetch } from "@/lib/fetcher";
import {
  CustomerDeliveryReport,
  CustomerReportFilter,
  EMPTY_CUSTOMER_DELIVERY_REPORT,
} from "@/types/customer-report";

/**
 * Customer delivery report service (RPT-06). Reads report data and returns the raw
 * PDF export Response for download — the server owns both the query and the PDF (same
 * pattern as the trip/driver/vehicle/cost reports), so there is no client-side report
 * or export logic. CLIENT-only, scoped server-side to the caller's own customers.
 *
 *   API: GET /customer-reports/deliveries         -> { range, totals, rows }
 *        GET /customer-reports/deliveries/export  -> application/pdf
 */
function queryString(filter: CustomerReportFilter): string {
  const params = new URLSearchParams();
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getCustomerDeliveryReport(
  filter: CustomerReportFilter,
): Promise<CustomerDeliveryReport> {
  const res = await apiFetch(
    `/customer-reports/deliveries${queryString(filter)}`,
  );
  // apiFetch throws on non-2xx — a failed report must reach the caller's error state,
  // never render as a real all-zero report.
  const data = await res.json();
  return {
    range: data.range ?? EMPTY_CUSTOMER_DELIVERY_REPORT.range,
    totals: data.totals ?? EMPTY_CUSTOMER_DELIVERY_REPORT.totals,
    rows: data.rows ?? [],
  };
}

export async function exportCustomerDeliveryReport(
  filter: CustomerReportFilter,
): Promise<Response> {
  return apiFetch(
    `/customer-reports/deliveries/export${queryString(filter)}`,
  );
}
