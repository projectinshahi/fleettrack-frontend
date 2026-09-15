"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/fetcher";
import { CustomerOption } from "@/types/customer";

/**
 * Loads the customers for the trip form's customer selector (CUS-07.1). Reuses the
 * tenant-scoped customers list (GET /customers), so a trip can only be linked to a
 * customer the owning client owns. Fails soft (empty) so the optional selector never
 * blocks trip creation.
 *
 * `clientId` is ADMIN-only: it targets a selected client's customers
 * (GET /customers?clientId=). A CLIENT omits it and stays JWT-scoped (the server
 * ignores the query for a CLIENT). On a client switch the previous client's list is
 * cleared before the new data arrives, and a superseded response is ignored, so the
 * selector never shows another client's customers.
 */
const NO_CUSTOMERS: CustomerOption[] = [];

/** `enabled` false: no request, and an idle empty result (the form is closed). */
export function useCustomerOptions(clientId?: string, enabled = true) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    // Ignore a response that a newer clientId has already superseded.
    let ignore = false;

    async function load() {
      setLoading(true);
      // Drop the previous client's customers up front so a switch never flashes a
      // stale list while the new client's customers load.
      setCustomers([]);
      try {
        const query = clientId
          ? `?clientId=${encodeURIComponent(clientId)}`
          : "";
        const res = await apiFetch(`/customers${query}`);
        const data = await res.json();
        if (ignore) return;
        setCustomers(data.customers || []);
      } catch (err) {
        if (ignore) return;
        console.log(err);
        setCustomers([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [clientId, enabled]);

  return enabled
    ? { customers, loading }
    : { customers: NO_CUSTOMERS, loading: false };
}
