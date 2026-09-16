"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { Popover as PopoverPrimitive } from "radix-ui";
import { useNotifications } from "@/hooks/use-notifications";
import NotificationItem from "./notification-item";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";

const PREVIEW_COUNT = 6;

/**
 * Navbar notification bell (NOT-04.2). Shows an unread badge and a dropdown preview of the
 * most recent notifications, refreshed live via the shared tracking socket (through the
 * hook). "View all" links to the full page. Reuses the same hook + row component as the
 * page — one notification data flow, one UI.
 *
 * The panel is a Radix Popover, not the DropdownMenu it used to be: a menu swallows Tab and
 * only arrow-keys between menu items, so the rows, "Mark all read" and "View all" (plain
 * links and buttons) could not be reached from the keyboard. It keeps the menu's surface.
 */
export default function NotificationBell() {
  const { notifications, unreadCount, loading, error, markRead, markAllRead } =
    useNotifications();
  const { user } = useAuthStore();

  const preview = notifications.slice(0, PREVIEW_COUNT);

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          // The button's name is all a screen reader reads, so the unread count belongs in it
          // (a label on the badge span is ignored).
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {/* The real unread count from the server, not the list length — the list is
              capped at the API's page size, so notifications.length would under-report
              once there are more unread than one page. It used to render "9+" past nine,
              which is why a true count of 10 showed as 9+. min-w-4 + px-1 lets the badge
              grow for a wider number instead of the count being clipped. */}
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold tabular-nums text-destructive-foreground"
            >
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={4}
          collisionPadding={8}
          aria-label="Notifications"
          className="z-50 max-h-(--radix-popover-content-available-height) w-80 max-w-[calc(100vw-2rem)] origin-(--radix-popover-content-transform-origin) overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-md outline-none duration-100 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-primary-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="block px-4 py-2.5 text-center text-xs font-medium text-primary-ink hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                View all notifications
              </Link>
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
