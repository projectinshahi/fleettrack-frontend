/**
 * In-portal notification (NOT-01…04), API-shaped. Raised by trip lifecycle events
 * (started / delayed / completed), proof-of-delivery confirmation, and the trip-request
 * approval workflow (requested / approved / rejected). `tripId` links back to a trip and
 * `tripRequestId` to a request when present. `clientId` is null for admin-audience
 * notifications (TRIP_REQUESTED). Named `AppNotification` to avoid colliding with the
 * browser's built-in `Notification` global.
 */
export type NotificationType =
  | "TRIP_STARTED"
  | "TRIP_DELAYED"
  | "TRIP_COMPLETED"
  | "POD_UPLOADED"
  | "TRIP_REQUESTED"
  | "TRIP_REQUEST_APPROVED"
  | "TRIP_REQUEST_REJECTED";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  // Null for admin-audience notifications (e.g. TRIP_REQUESTED); the owning client id otherwise.
  clientId: string | null;
  tripId: string | null;
  tripRequestId: string | null;
  read: boolean;
  createdAt: string;
}
