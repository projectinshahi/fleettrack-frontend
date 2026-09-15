/**
 * Vehicle utilization report (RPT-03), API-shaped. Per-vehicle trip statistics over a
 * date range, derived server-side from Trip + Vehicle data (no schema, no new query
 * engine). On-time vs late reuse the app-wide ETA-05.1 delay rule (as in DSH-04);
 * "active" reuses the dashboard's STARTED/ONGOING/DELAYED bucket; utilizationPct is
 * busy time as a share of the reporting window.
 */
export interface VehicleUtilizationRow {
  vehicleId: string;
  vehicleNumber: string | null;
  vehicleName: string | null;
  totalTrips: number;
  completed: number;
  active: number;
  cancelled: number;
  onTime: number;
  delayed: number;
  completionRate: number;
  onTimeRate: number;
  utilizationPct: number;
  totalDistanceKm: number;
  avgDurationMins: number;
}

export interface VehicleUtilizationTotals {
  vehicles: number;
  trips: number;
  completed: number;
  active: number;
  cancelled: number;
  onTime: number;
  delayed: number;
  totalDistanceKm: number;
  avgUtilizationPct: number;
}

export interface VehicleUtilizationReport {
  range: { from: string | null; to: string | null };
  totals: VehicleUtilizationTotals;
  rows: VehicleUtilizationRow[];
}

/** Report filter — optional date range (by trip scheduled start; also the window). */
export interface VehicleReportFilter {
  from?: string;
  to?: string;
}

export const EMPTY_VEHICLE_UTILIZATION_REPORT: VehicleUtilizationReport = {
  range: { from: null, to: null },
  totals: {
    vehicles: 0,
    trips: 0,
    completed: 0,
    active: 0,
    cancelled: 0,
    onTime: 0,
    delayed: 0,
    totalDistanceKm: 0,
    avgUtilizationPct: 0,
  },
  rows: [],
};
