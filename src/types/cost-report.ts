import { TripStatus } from "@/types/trip";
import { CostComponent } from "@/types/trip-cost";

/**
 * Cost report (TCM-05), API-shaped. Planned-vs-actual per trip, rolled up per
 * component and in grand totals — all derived server-side from TripCost.
 */
export interface CostReportRow {
  tripId: string;
  reference: string;
  origin: string;
  destination: string;
  status: TripStatus;
  estimatedTotal: number;
  actualTotal: number;
  variance: number;
}

export interface CostReportComponent {
  component: CostComponent;
  estimated: number;
  actual: number;
  variance: number;
}

export interface CostReportTotals {
  estimatedTotal: number;
  actualTotal: number;
  variance: number;
}

export interface CostReport {
  rows: CostReportRow[];
  byComponent: CostReportComponent[];
  totals: CostReportTotals;
}

/** Report filter — optional date range (by trip scheduled start). */
export interface CostReportFilter {
  from?: string;
  to?: string;
}

export const EMPTY_COST_REPORT: CostReport = {
  rows: [],
  byComponent: [],
  totals: { estimatedTotal: 0, actualTotal: 0, variance: 0 },
};
