"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/fetcher";

/** Minimal client shape for the ADMIN client selector (Slice D). */
export interface ClientOption {
  id: string;
  name: string;
}

/**
 * Loads the client list for the ADMIN direct-trip client selector (Slice D).
 *
 * `/clients` is an ADMIN-only endpoint, so `enabled` gates the fetch: the ADMIN
 * trip form passes `true`, a CLIENT-mode form passes `false` and never calls it
 * (avoiding a guaranteed 403). Fails soft (empty) so the selector degrades to an
 * empty list rather than blocking the form. Loads once on mount.
 */
export function useClients(enabled = true) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch("/clients");
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        if (ignore) return;
        setClients(data.clients || []);
      } catch (err) {
        if (ignore) return;
        console.log(err);
        setClients([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [enabled]);

  // When disabled, present a stable empty/idle state regardless of any prior fetch.
  return enabled ? { clients, loading } : { clients: [], loading: false };
}
