import { TripStatus } from "@/types/trip";

/**
 * Trip summary report (RPT-01), API-shaped. Counts by status + per-trip rows over a
 * date range, derived server-side from Trip data (no schema, no new query engine).
 */
export interface TripReportStatusCount {
  status: TripStatus;
  count: number;
}

export interface TripReportRow {
  tripId: string;
  reference: string;
  origin: string;
  destination: string;
  status: TripStatus;
  scheduledStart: string;
  vehicleNumber: string | null;
  driverName: string | null;
}

export interface TripSummaryReport {
  range: { from: string | null; to: string | null };
  total: number;
  byStatus: TripReportStatusCount[];
  rows: TripReportRow[];
}

/** Report filter — optional date range (by trip scheduled start). */
export interface TripReportFilter {
  from?: string;
  to?: string;
}

export const EMPTY_TRIP_SUMMARY_REPORT: TripSummaryReport = {
  range: { from: null, to: null },
  total: 0,
  byStatus: [],
  rows: [],
};
