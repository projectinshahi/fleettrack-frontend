/**
 * Delay domain contract (DLY-01) — mirrors the API's Delay shape (GET /delays).
 * A delay is always reported against a trip.
 */

export type DelayCategory =
  | "TRAFFIC"
  | "WEATHER"
  | "BREAKDOWN"
  | "ACCIDENT"
  | "LOADING"
  | "CUSTOMER"
  | "DOCUMENTATION"
  | "OTHER";

export const DELAY_CATEGORIES: DelayCategory[] = [
  "TRAFFIC",
  "WEATHER",
  "BREAKDOWN",
  "ACCIDENT",
  "LOADING",
  "CUSTOMER",
  "DOCUMENTATION",
  "OTHER",
];

/** The trip a delay is associated with, as embedded in a delay response. */
export interface DelayTripRef {
  id: string;
  reference: string;
  clientId?: string;
}

export interface Delay {
  id: string;
  tripId: string;
  trip?: DelayTripRef | null;
  category: DelayCategory;
  reason?: string | null;
  remarks?: string | null;
  durationMinutes: number;
  reportedAt: string;
  source: string;
  reportedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}
