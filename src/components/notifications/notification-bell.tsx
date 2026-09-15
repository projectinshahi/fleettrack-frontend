"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import NotificationItem from "./notification-item";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";

const PREVIEW_COUNT = 6;

/**
 * Navbar notification bell (NOT-04.2). Shows an unread badge and a dropdown preview of the
 * most recent notifications, refreshed live via the shared tracking socket (through the
 * hook). "View all" links to the full page. Reuses the shared DropdownMenu, and the same
 * hook + row component as the page — one notification data flow, one UI.
 */
export default function NotificationBell() {
  const { notifications, unreadCount, loading, error, markRead, markAllRead } =
    useNotifications();
  const { user } = useAuthStore();

  const preview = notifications.slice(0, PREVIEW_COUNT);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {/* The real unread count from the server, not the list length — the list is
              capped at the API's page size, so notifications.length would under-report
              once there are more unread than one page. It used to render "9+" past nine,
              which is why a true count of 10 showed as 9+. min-w-4 + px-1 lets the badge
              grow for a wider number instead of the count being clipped. */}
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread notifications`}
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold tabular-nums text-destructive-foreground"
            >
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error && preview.length === 0 ? (
            <EmptyState title="Couldn't load notifications" className="py-6" />
          ) : preview.length === 0 ? (
            <EmptyState title="No notifications yet" className="py-6" />
          ) : (
            <div className="divide-y divide-border">
              {preview.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markRead}
                />
              ))}
            </div>
          )}
        </div>

        {/* The notifications page is CLIENT-only (lib/role-routes.ts); for an ADMIN this link
            bounced straight back to the dashboard. */}
        {user?.role === "CLIENT" && (
          <div className="border-t border-border">
            <Link
              href="/notifications"
              className="block px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted/60"
            >
              View all notifications
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
