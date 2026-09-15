import { apiFetch } from "@/lib/fetcher";
import { Delay } from "@/types/delay";

/**
 * Delay service (DLY-01.2/01.3). Consumes the existing delays API — no new
 * endpoints. The backend scopes results by role (ADMIN all; CLIENT own trips).
 *
 *   API: GET /delays -> { delays }
 */
export async function getDelays(): Promise<Delay[]> {
  const res = await apiFetch("/delays");
  if (!res.ok) {
    throw new Error("Failed to load delays");
  }
  const data = await res.json();
  return data.delays ?? [];
}
