/**
 * Driver performance report (RPT-02), API-shaped. Per-driver trip statistics over a
 * date range, derived server-side from Trip data (no schema, no new query engine).
 * On-time vs late deliveries reuse the app-wide ETA-05.1 delay rule (as in DSH-04);
 * "active" reuses the dashboard's STARTED/ONGOING/DELAYED bucket.
 */
export interface DriverPerformanceRow {
  driverId: string;
  driverName: string | null;
  totalTrips: number;
  completed: number;
  active: number;
  cancelled: number;
  onTime: number;
  delayed: number;
  completionRate: number;
  onTimeRate: number;
  totalDistanceKm: number;
  avgDurationMins: number;
}

export interface DriverPerformanceTotals {
  drivers: number;
  trips: number;
  completed: number;
  active: number;
  cancelled: number;
  onTime: number;
  delayed: number;
  totalDistanceKm: number;
}

export interface DriverPerformanceReport {
  range: { from: string | null; to: string | null };
  totals: DriverPerformanceTotals;
  rows: DriverPerformanceRow[];
}

/** Report filter — optional date range (by trip scheduled start). */
export interface DriverReportFilter {
  from?: string;
  to?: string;
}

export const EMPTY_DRIVER_PERFORMANCE_REPORT: DriverPerformanceReport = {
  range: { from: null, to: null },
  totals: {
    drivers: 0,
    trips: 0,
    completed: 0,
    active: 0,
    cancelled: 0,
    onTime: 0,
    delayed: 0,
    totalDistanceKm: 0,
  },
  rows: [],
};
