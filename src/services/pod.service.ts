import { apiFetch } from "@/lib/fetcher";
import { PodInput, ProofOfDelivery } from "@/types/pod";

/**
 * Proof-of-delivery service (POD-01/03/04). Reads and upserts the delivery-confirmation
 * record; mirrors the trip cost service. Proof media goes through the shared upload
 * service (no duplicate API here).
 *
 *   API: GET /trips/:id/pod -> { pod }
 *        PUT /trips/:id/pod -> { pod }
 */
export async function getPod(tripId: string): Promise<ProofOfDelivery | null> {
  // apiFetch throws on non-2xx. A null POD is a real state ("not confirmed yet"), so a
  // failed load must NOT collapse into it — the caller's error state owns that.
  const res = await apiFetch(`/trips/${tripId}/pod`);
  const data = await res.json();
  return data.pod ?? null;
}

export async function savePod(
  tripId: string,
  input: PodInput,
): Promise<ProofOfDelivery | null> {
  const res = await apiFetch(`/trips/${tripId}/pod`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to save proof of delivery");
  const data = await res.json();
  return data.pod ?? null;
}
