/**
 * Proof of delivery (POD), API-shaped. The delivery-confirmation record for a trip
 * (POD-01/03/04); "confirmed" means `deliveredAt` is set. Proof media (photos POD-02/05,
 * signature POD-06) is NOT here — it lives in the shared FileAsset store via the /uploads
 * API with category POD_PHOTO / POD_SIGNATURE.
 */
export interface ProofOfDelivery {
  id: string;
  tripId: string;
  recipientName: string | null;
  notes: string | null;
  deliveredAt: string | null;
  // POD-04.1/04.2 — delivery geolocation captured on confirmation (null when unavailable).
  deliveredLat: number | null;
  deliveredLng: number | null;
  deliveredLocationAccuracy: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Upsert payload — partial; setting `deliveredAt` confirms the delivery. */
export interface PodInput {
  recipientName?: string;
  notes?: string;
  deliveredAt?: string;
  // POD-04.1 — sent alongside the confirmation when the browser could get a fix.
  deliveredLat?: number;
  deliveredLng?: number;
  deliveredLocationAccuracy?: number;
}
