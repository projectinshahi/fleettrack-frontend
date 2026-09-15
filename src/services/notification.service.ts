import { apiFetch } from "@/lib/fetcher";
import { AppNotification } from "@/types/notification";

/**
 * In-portal notification service (NOT-04.3). Reads the caller's scoped notifications and
 * updates read state; notifications are created by backend triggers, so there is no create
 * here. Mirrors the other dashboard services (thin apiFetch wrappers).
 *
 *   API: GET   /notifications?unread=&limit=  -> { notifications, unreadCount }
 *        PATCH /notifications/:id/read
 *        PATCH /notifications/read-all
 */
export interface NotificationList {
  notifications: AppNotification[];
  unreadCount: number;
}

export async function getNotifications(
  limit?: number,
): Promise<NotificationList> {
  const qs = limit ? `?limit=${limit}` : "";
  // apiFetch throws on non-2xx — a failed load must reach the caller's error state so
  // the bell shows "Couldn't load notifications", not a convincing "No notifications yet".
  const res = await apiFetch(`/notifications${qs}`);
  const data = await res.json();
  return {
    notifications: data.notifications ?? [],
    unreadCount: data.unreadCount ?? 0,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch(`/notifications/read-all`, { method: "PATCH" });
}
