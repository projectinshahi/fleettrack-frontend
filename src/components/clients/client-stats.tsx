"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/fetcher";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

/**
 * Client directory stat cards.
 *
 * "Total Clients" is the real /clients count. The API's Client model has no
 * active/status field (see clients.service.findAll), so an "Active Clients"
 * count can't be derived — it's shown as unavailable rather than fabricated.
 * (Previously both cards rendered the same `count`, so "Active" just mirrored
 * "Total".) Wire it up once the backend exposes client activity.
 */
export default function ClientStats() {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // First statement is `await`, so calling this in the effect performs no
  // synchronous setState (keeps react-hooks/set-state-in-effect happy).
  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/clients");
      // apiFetch now rejects on non-2xx, so a failure reaches the catch and becomes an
      // error state rather than a silent zero count. Kept as a defensive guard.
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setTotal(data.clients?.length ?? 0);
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Inlined (not a call to `load`) to satisfy the no-setState-in-effect lint
  // rule; `load` stays for the ErrorState retry.
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiFetch("/clients");
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        setTotal(data.clients?.length ?? 0);
        setError(false);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {["Total Clients", "Active Clients"].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-5"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <Skeleton className="mt-2 h-9 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Couldn't load client stats."
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Total Clients</p>
        <h2 className="text-2xl font-semibold tabular-nums">{total}</h2>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Active Clients</p>
        <h2 className="text-2xl font-semibold text-muted-foreground">—</h2>
        <p className="mt-1 text-xs text-muted-foreground">Not tracked yet</p>
      </div>
    </div>
  );
}
