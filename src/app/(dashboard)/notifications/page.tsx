"use client";

import { Bell, CheckCheck } from "lucide-react";

import { useNotifications } from "@/hooks/use-notifications";
import NotificationItem from "@/components/notifications/notification-item";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

/**
 * Notifications page (NOT-04.2 / NOT-04.3). Full list of the caller's scoped notifications
 * with mark-as-read (per item + all). Reuses the same hook and row component as the navbar
 * bell — one notification data flow, one row component.
 */
export default function NotificationsPage() {
  const { notifications, unreadCount, loading, error, reload, markRead, markAllRead } =
    useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="mt-1 text-muted-foreground">
              Trip and delivery activity
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          // Same rows as notifications/loading.tsx, so the route and page placeholders match
          // the real list (icon + title + time) instead of switching shape mid-load.
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 max-w-full" />
                  <Skeleton className="h-3 w-1/2 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error && notifications.length === 0 ? (
          <ErrorState message="Couldn't load notifications." onRetry={reload} />
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications yet" />
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={markRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
