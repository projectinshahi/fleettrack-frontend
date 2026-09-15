"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { apiFetch } from "@/lib/fetcher";
import { Customer } from "@/types/customer";
import { Trip } from "@/types/trip";
import TripTable from "@/components/trips/trip-table";

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer;
}

/**
 * Read-only trip history for a customer (CUS-07.2). Opened from the admin customer
 * table; reuses the shared TripTable (and its status badge). Mounted only while
 * open, so it refetches each time.
 */
export default function CustomerTripsModal({ open, onClose, customer }: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Inlined to satisfy the no-setState-in-effect lint rule.
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch(`/customers/${customer.id}/trips`);
        if (!res.ok) throw new Error("Failed to load trip history");
        const data = await res.json();
        setTrips(data.trips || []);
      } catch {
        setTrips([]);
        toast.error("Failed to load trip history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customer.id]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Trip History</DialogTitle>
          <DialogDescription>
            {customer.name} — trips placed for this customer
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3">
          <TripTable trips={trips} loading={loading} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
