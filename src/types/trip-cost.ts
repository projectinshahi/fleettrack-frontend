/**
 * Trip cost domain (TCM-01 / TCM-02 / TCM-04), API-shaped. One TripCost per trip
 * holding both estimated and actual amounts per fixed component; variance (TCM-04)
 * is derived server-side (actual − estimated), never stored.
 */

export type CostComponent =
  | "fuel"
  | "tolls"
  | "allowance"
  | "parking"
  | "maintenance"
  | "misc";

export interface TripCost {
  id: string;
  tripId: string;

  estimatedFuel: number;
  estimatedTolls: number;
  estimatedAllowance: number;
  estimatedParking: number;
  estimatedMaintenance: number;
  estimatedMisc: number;

  actualFuel: number;
  actualTolls: number;
  actualAllowance: number;
  actualParking: number;
  actualMaintenance: number;
  actualMisc: number;

  createdAt: string;
  updatedAt: string;
}

/** Cost write payload (TCM-01.3 estimated + TCM-02.2 actual) — one upsert. */
export interface TripCostInput {
  estimatedFuel: number;
  estimatedTolls: number;
  estimatedAllowance: number;
  estimatedParking: number;
  estimatedMaintenance: number;
  estimatedMisc: number;

  actualFuel: number;
  actualTolls: number;
  actualAllowance: number;
  actualParking: number;
  actualMaintenance: number;
  actualMisc: number;
}

/** Derived variance (TCM-04): actual − estimated per component + per-trip totals. */
export interface CostVariance {
  fuel: number;
  tolls: number;
  allowance: number;
  parking: number;
  maintenance: number;
  misc: number;
  estimatedTotal: number;
  actualTotal: number;
  total: number;
}

/** GET /trips/:id/cost — the stored cost (or null) plus its computed variance. */
export interface TripCostResult {
  cost: TripCost | null;
  variance: CostVariance;
}

export const ZERO_VARIANCE: CostVariance = {
  fuel: 0,
  tolls: 0,
  allowance: 0,
  parking: 0,
  maintenance: 0,
  misc: 0,
  estimatedTotal: 0,
  actualTotal: 0,
  total: 0,
};

/**
 * Per-component metadata driving the cost card and form generically, so the
 * estimated (TCM-01), actual (TCM-02) and variance (TCM-04) surfaces all read the
 * component set from one place.
 */
export interface CostComponentMeta {
  key: CostComponent;
  label: string;
  estimatedField: keyof TripCost;
  actualField: keyof TripCost;
}

export const COST_COMPONENT_META: CostComponentMeta[] = [
  {
    key: "fuel",
    label: "Fuel",
    estimatedField: "estimatedFuel",
    actualField: "actualFuel",
  },
  {
    key: "tolls",
    label: "Tolls",
    estimatedField: "estimatedTolls",
    actualField: "actualTolls",
  },
  {
    key: "allowance",
    label: "Allowance",
    estimatedField: "estimatedAllowance",
    actualField: "actualAllowance",
  },
  {
    key: "parking",
    label: "Parking",
    estimatedField: "estimatedParking",
    actualField: "actualParking",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    estimatedField: "estimatedMaintenance",
    actualField: "actualMaintenance",
  },
  {
    key: "misc",
    label: "Misc",
    estimatedField: "estimatedMisc",
    actualField: "actualMisc",
  },
];

/** Safe numeric accessor for a cost component field (0 when absent). */
export function costAmount(
  cost: TripCost | null,
  field: keyof TripCost,
): number {
  const value = cost?.[field];
  return typeof value === "number" ? value : 0;
}
