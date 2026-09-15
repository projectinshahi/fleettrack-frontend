"use client";

import { useEffect } from "react";

import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth-store";
import {
  playNotificationSound,
  unlockNotificationSound,
} from "@/lib/notification-sound";

/**
 * F8 — chime on a genuinely NEW notification. Mount ONCE (in the navbar).
 *
 * It listens to the SAME realtime `notification:new` socket signal the notification hook
 * refetches on, so it plays only when a new notification actually arrives — never on
 * initial load, refresh, navigation, re-render, or mark-read (none of those emit that
 * event). Reuses the shared socket singleton (no new connection) and mirrors the
 * notification hook's CLIENT scoping. Audio failures never affect notification handling.
 */
export function useNotificationSound() {
  const { user } = useAuthStore();

  // Unlock audio on the first user gesture (browser autoplay policy). One-shot — it
  // removes itself after the first interaction and never prompts the user. If the user
  // never interacts, chimes are silently skipped and notifications still work.
  useEffect(() => {
    const unlock = () => {
      unlockNotificationSound();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    const handler = (payload: { clientId?: string | null }) => {
      // D2 audience routing: an admin-audience notification carries clientId == null; a
      // client-scoped one carries that client's id. ADMIN chimes only for the former, a
      // CLIENT only for its own — so an admin never hears every client's notification.
      const targetClientId = payload?.clientId ?? null;
      const forMe =
        user?.role === "ADMIN"
          ? targetClientId === null
          : user?.role === "CLIENT" && targetClientId === user.id;
      if (!forMe) return;
      playNotificationSound();
    };
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
    };
  }, [user]);
}
