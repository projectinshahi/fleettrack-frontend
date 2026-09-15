"use client";

import { useCallback, useEffect, useState } from "react";

import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth-store";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";
import { AppNotification } from "@/types/notification";

/**
 * In-portal notifications (NOT-04.2 / NOT-04.3). Loads the caller's scoped list + unread
 * count from REST, then refreshes on the shared tracking socket's `notification:new`
 * signal — reusing the existing socket singleton (no new connection, no polling). A CLIENT
 * only refreshes for its own scope; ADMIN refreshes on any signal. Mark-read is optimistic
 * and reconciled by the next reload. Shared by the navbar bell and the notifications page.
 */
export function useNotifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(false);
    } catch (err) {
      console.log(err);
      // Background refresh failure stays silent so a good list isn't blown away;
      // the initial-load path below owns the visible error state.
    }
  }, []);

  // Initial load. Inlined async with an unmount guard (no-setState-after-unmount).
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getNotifications();
        if (!active) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setError(false);
      } catch (err) {
        console.log(err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  // Live refresh via the shared tracking socket (reused singleton). The cleanup removes
  // only this handler, so it never clobbers the tracking listeners.
  useEffect(() => {
    const handler = (payload: { clientId?: string }) => {
      if (user?.role === "CLIENT" && payload?.clientId !== user.id) return;
      reload();
    };

    socket.on("notification:new", handler);

    return () => {
      socket.off("notification:new", handler);
    };
  }, [user, reload]);

  // Optimistic — callers only invoke this for an unread notification.
  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.log(err);
    }
  }, []);

  return { notifications, unreadCount, loading, error, reload, markRead, markAllRead };
}
