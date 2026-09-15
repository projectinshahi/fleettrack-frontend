"use client";

import Link from "next/link";
import {
  Truck,
  Clock,
  CheckCircle2,
  PackageCheck,
  ClipboardList,
  ThumbsUp,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { AppNotification, NotificationType } from "@/types/notification";
import { STATUS_CHIP, type StatusTone } from "@/components/ui/status-chip";

interface Props {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
}

const ICON: Record<NotificationType, LucideIcon> = {
  TRIP_STARTED: Truck,
  TRIP_DELAYED: Clock,
  TRIP_COMPLETED: CheckCircle2,
  POD_UPLOADED: PackageCheck,
  TRIP_REQUESTED: ClipboardList,
  TRIP_REQUEST_APPROVED: ThumbsUp,
  TRIP_REQUEST_REJECTED: XCircle,
};

/**
 * Notification type → status tone. TRIP_COMPLETED is neutral, not green, for the same
 * reason the trip badge is: finishing is terminal, not good news. The icon itself is
 * already a non-colour cue here (CheckCircle2, XCircle, ThumbsUp…), so the tile only
 * has to carry the tone.
 */
const ICON_TONE: Record<NotificationType, StatusTone> = {
  TRIP_STARTED: "signal",
  TRIP_DELAYED: "attn",
  TRIP_COMPLETED: "neutral",
  POD_UPLOADED: "neutral",
  TRIP_REQUESTED: "neutral",
  TRIP_REQUEST_APPROVED: "ok",
  TRIP_REQUEST_REJECTED: "fault",
};

/**
 * Where a notification links when clicked. Request notifications open the request; the
 * approval opens the created trip; all others open their trip. Only linked when the
 * relevant id actually exists (never invents an id).
 */
function notificationHref(n: AppNotification): string | null {
  if (n.type === "TRIP_REQUESTED" || n.type === "TRIP_REQUEST_REJECTED") {
    return n.tripRequestId ? `/trip-requests/${n.tripRequestId}` : null;
  }
  // TRIP_REQUEST_APPROVED and the trip-lifecycle types link to the trip.
  return n.tripId ? `/trips/${n.tripId}` : null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * One notification row, shared by the navbar bell dropdown and the notifications page.
 * Clicking marks it read (once) and, when the notification links a trip, navigates there.
 */
export default function NotificationItem({ notification, onMarkRead }: Props) {
  const Icon = ICON[notification.type];

  const handleClick = () => {
    if (!notification.read) onMarkRead(notification.id);
  };

  const body = (
    <div
      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60 ${
        notification.read ? "" : "bg-primary/5"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${STATUS_CHIP[ICON_TONE[notification.type]]}`}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{notification.title}</p>
          {!notification.read && (
            <>
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span className="sr-only">Unread</span>
            </>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  const href = notificationHref(notification);
  if (href) {
    return (
      <Link href={href} onClick={handleClick} className="block">
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="block w-full text-left"
    >
      {body}
    </button>
  );
}
