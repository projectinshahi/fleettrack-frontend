import { apiFetch } from "@/lib/fetcher";
import {
  TripCostInput,
  TripCostResult,
  ZERO_VARIANCE,
} from "@/types/trip-cost";

/**
 * Trip cost service (TCM-01 / TCM-02 / TCM-04). Reads and upserts a trip's cost
 * breakdown; both estimated and actual go through the same PUT (no duplicate API),
 * and both responses carry the server-computed variance (no client-side variance
 * logic, nothing stored).
 *
 *   API: GET /trips/:id/cost -> { cost, variance }
 *        PUT /trips/:id/cost -> { cost, variance }
 */
export async function getTripCost(tripId: string): Promise<TripCostResult> {
  // apiFetch throws on non-2xx. A null cost is a real state ("nothing recorded yet"),
  // so a failed load must NOT collapse into it — the caller's error state owns that.
  const res = await apiFetch(`/trips/${tripId}/cost`);
  const data = await res.json();
  return { cost: data.cost ?? null, variance: data.variance ?? ZERO_VARIANCE };
}

export async function saveTripCost(
  tripId: string,
  input: TripCostInput,
): Promise<TripCostResult> {
  const res = await apiFetch(`/trips/${tripId}/cost`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error("Failed to save costs");
  }
  const data = await res.json();
  return { cost: data.cost ?? null, variance: data.variance ?? ZERO_VARIANCE };
}
