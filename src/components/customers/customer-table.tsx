"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { apiErrorMessage, apiFetch } from "@/lib/fetcher";
import { Customer } from "@/types/customer";
import AddCustomerModal from "./add-customer-modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import CustomerTypeBadge from "./customer-type-badge";
import CustomerAddressesModal from "./customer-addresses-modal";
import CustomerTripsModal from "./customer-trips-modal";
import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";

interface Props {
  searchQuery?: string;
  /** Bumped by the page-level Add modal so the table refetches its own data. */
  refreshKey?: number;
}

/**
 * Customer directory table (CUS-02.2) — hand-rolled table with search, edit
 * (reuses the add/edit modal) and delete. Mirrors client-table.
 */
export default function CustomerTable({
  searchQuery = "",
  refreshKey = 0,
}: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addressesFor, setAddressesFor] = useState<Customer | null>(null);
  const [tripsFor, setTripsFor] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const mounted = useRef(false);

  // Only the first load shows the skeleton; mutations / refreshKey do a silent refetch.
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    try {
      const res = await apiFetch("/customers");
      // Non-ok HTTP (e.g. 500) → error state with retry, not a false "empty".
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);
      if (!silent) setError(true);
      else toast.error("Couldn't refresh customers");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load(mounted.current);
    mounted.current = true;
  }, [refreshKey]);

  const confirmDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const res = await apiFetch(`/customers/${deleteId}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("Customer deleted");
        setDeleteId(null);
        await load(true);
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch (error) {
      console.error(error);
      // apiFetch rejects on non-2xx — surface the API's message rather than a generic one.
      toast.error(apiErrorMessage(error, "Something went wrong"));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q),
    );
  }, [customers, searchQuery]);

  if (loading) return <TableSkeleton columns={6} rows={8} />;

  if (error)
    return (
      <ErrorState message="Couldn't load customers." onRetry={() => load()} />
    );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No customers found
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border last:border-none transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium">{customer.name}</td>

                  <td className="px-4 py-3">
                    <CustomerTypeBadge type={customer.type} />
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {customer.email || "—"}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {customer.phone || "—"}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <AddCustomerModal
                        editCustomer={customer}
                        onSuccess={() => load(true)}
                      >
                        <button className="text-sm font-medium text-primary-ink hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Edit
                        </button>
                      </AddCustomerModal>

                      <button
                        onClick={() => setAddressesFor(customer)}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        Addresses
                      </button>

                      <button
                        onClick={() => setTripsFor(customer)}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        Trips
                      </button>

                      <button
                        onClick={() => setDeleteId(customer.id)}
                        className="text-sm font-medium text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Customer?"
        description="This action cannot be undone. This will permanently delete the customer."
        loading={deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      {addressesFor && (
        <CustomerAddressesModal
          open
          onClose={() => setAddressesFor(null)}
          customer={addressesFor}
        />
      )}

      {tripsFor && (
        <CustomerTripsModal
          open
          onClose={() => setTripsFor(null)}
          customer={tripsFor}
        />
      )}
    </div>
  );
}
