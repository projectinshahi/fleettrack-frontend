/**
 * Customer delivery report (RPT-06), API-shaped. Per-customer delivery statistics over
 * a date range, derived server-side from Trip + Customer data (no schema, no new query
 * engine). CLIENT-only (customers are tenant-owned). On-time vs late reuse the app-wide
 * ETA-05.1 delay rule (as in DSH-04); "active" reuses the dashboard's
 * STARTED/ONGOING/DELAYED bucket.
 */
export interface CustomerDeliveryRow {
  customerId: string;
  customerName: string | null;
  customerType: string | null;
  totalDeliveries: number;
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

export interface CustomerDeliveryTotals {
  customers: number;
  deliveries: number;
  completed: number;
  active: number;
  cancelled: number;
  onTime: number;
  delayed: number;
  totalDistanceKm: number;
}

export interface CustomerDeliveryReport {
  range: { from: string | null; to: string | null };
  totals: CustomerDeliveryTotals;
  rows: CustomerDeliveryRow[];
}

/** Report filter — optional date range (by trip scheduled start). */
export interface CustomerReportFilter {
  from?: string;
  to?: string;
}

export const EMPTY_CUSTOMER_DELIVERY_REPORT: CustomerDeliveryReport = {
  range: { from: null, to: null },
  totals: {
    customers: 0,
    deliveries: 0,
    completed: 0,
    active: 0,
    cancelled: 0,
    onTime: 0,
    delayed: 0,
    totalDistanceKm: 0,
  },
  rows: [],
};
