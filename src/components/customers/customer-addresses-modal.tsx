"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { STATUS_CHIP } from "@/components/ui/status-chip";
import { Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { apiErrorMessage, apiFetch } from "@/lib/fetcher";
import { AddressKind, Customer, CustomerAddress } from "@/types/customer";
import AddressForm from "./address-form";

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer;
}

type Filter = "ALL" | AddressKind;

const TABS: Filter[] = ["ALL", "PICKUP", "DELIVERY"];

/**
 * Manage a customer's reusable pickup/delivery addresses (CUS-05 / CUS-06).
 * Self-contained: fetches on open, filters by kind, add/edit via AddressForm,
 * inline delete confirmation. Mounted only while open (re-seeds each time).
 */
export default function CustomerAddressesModal({
  open,
  onClose,
  customer,
}: Props) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiFetch(`/customers/${customer.id}/addresses`);
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setAddresses(data.addresses || []);
    } catch (err) {
      // Without this, a fetch rejection here was an unhandled promise that
      // bubbled to the route error boundary and blanked the page.
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Inlined to satisfy the no-setState-in-effect lint rule.
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const res = await apiFetch(`/customers/${customer.id}/addresses`);
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        setAddresses(data.addresses || []);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customer.id]);

  const filtered = useMemo(
    () =>
      filter === "ALL"
        ? addresses
        : addresses.filter((a) => a.kind === filter),
    [addresses, filter],
  );

  const handleSaved = () => {
    setAdding(false);
    setEditing(null);
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/customers/${customer.id}/addresses/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Address deleted");
        fetchAddresses();
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      // apiFetch rejects on non-2xx — surface the API's message rather than a generic one.
      toast.error(apiErrorMessage(err, "Something went wrong"));
    } finally {
      setConfirmId(null);
    }
  };

  const showForm = adding || !!editing;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Addresses</DialogTitle>
          <DialogDescription>
            {customer.name} — pickup &amp; delivery address book
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  filter === t
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-muted"
                }`}
              >
                {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {!showForm && (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              Add address
            </button>
          )}
        </div>

        {showForm && (
          <div className="mt-3">
            <AddressForm
              customerId={customer.id}
              editAddress={editing}
              defaultKind={filter === "DELIVERY" ? "DELIVERY" : "PICKUP"}
              onSaved={handleSaved}
              onCancel={() => {
                setAdding(false);
                setEditing(null);
              }}
            />
          </div>
        )}

        <div className="mt-3 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <div className="py-6 text-center text-sm">
              <p className="text-muted-foreground">Couldn&apos;t load addresses.</p>
              <button
                onClick={fetchAddresses}
                className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No addresses
            </p>
          ) : (
            filtered.map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{a.label}</span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs font-bold uppercase text-muted-foreground">
                        {a.kind}
                      </span>
                      {a.isDefault && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${STATUS_CHIP.ok}`}
                        >
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {a.address}
                    </p>
                    {a.latitude != null && a.longitude != null && (
                      <p className="text-xs text-muted-foreground">
                        {a.latitude}, {a.longitude}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => {
                        setEditing(a);
                        setAdding(false);
                      }}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>

                    {confirmId === a.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="text-sm font-medium text-status-fault-ink hover:underline"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-sm font-medium text-muted-foreground hover:underline"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmId(a.id)}
                        className="text-sm font-medium text-status-fault-ink hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
