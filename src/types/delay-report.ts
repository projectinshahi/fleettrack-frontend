/**
 * Delay analysis report (RPT-04), API-shaped — the DLY-04.1 `/delays/stats`
 * aggregation. No new query: the same buckets by category / driver / route / period.
 */
export type DelayPeriod = "day" | "week" | "month";

export interface DelayStatBucket {
  key: string;
  label: string;
  count: number;
  totalMinutes: number;
}

export interface DelayStats {
  range: { from: string | null; to: string | null; period: DelayPeriod };
  total: { count: number; totalMinutes: number };
  byCategory: DelayStatBucket[];
  byDriver: DelayStatBucket[];
  byRoute: DelayStatBucket[];
  byPeriod: DelayStatBucket[];
}

/** Report filter — grouping granularity + optional reportedAt range. */
export interface DelayReportFilter {
  period?: DelayPeriod;
  from?: string;
  to?: string;
}

export const EMPTY_DELAY_STATS: DelayStats = {
  range: { from: null, to: null, period: "month" },
  total: { count: 0, totalMinutes: 0 },
  byCategory: [],
  byDriver: [],
  byRoute: [],
  byPeriod: [],
};
