"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import {
  getNextStatuses,
  Trip,
  TripPermissions,
  TripStatus,
} from "@/types/trip";
import TripStatusBadge from "./trip-status-badge";

interface Props {
  trip: Trip;
  permissions: TripPermissions;
  onChange: (status: TripStatus) => Promise<unknown>;
}

const ACTION_LABEL: Record<TripStatus, string> = {
  [TripStatus.PLANNED]: "Mark Planned",
  [TripStatus.ASSIGNED]: "Assign",
  [TripStatus.STARTED]: "Start",
  [TripStatus.ONGOING]: "Mark Ongoing",
  [TripStatus.DELAYED]: "Mark Delayed",
  [TripStatus.COMPLETED]: "Complete",
  [TripStatus.CANCELLED]: "Cancel",
};

export default function TripStatusControls({
  trip,
  permissions,
  onChange,
}: Props) {
  const [pending, setPending] = useState<TripStatus | null>(null);
  const nextStatuses = getNextStatuses(trip.status);

  const handle = async (status: TripStatus) => {
    try {
      setPending(status);
      await onChange(status);
      toast.success(`Trip marked ${status}`);
    } catch (err) {
      console.log(err);
      toast.error("Failed to update status");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Status</h3>
        <TripStatusBadge status={trip.status} />
      </div>

      {!permissions.canManageLifecycle ? (
        <p className="mt-4 text-sm text-muted-foreground">
          You have read-only access to trips.
        </p>
      ) : nextStatuses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No further actions — this trip is {trip.status.toLowerCase()}.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {nextStatuses.map((status) => {
            const isDestructive = status === TripStatus.CANCELLED;
            const isSuccess = status === TripStatus.COMPLETED;

            return (
              <Button
                key={status}
                variant={status === TripStatus.COMPLETED ? "default" : status === TripStatus.CANCELLED ? "destructive" : "secondary"}
                onClick={() => handle(status)}
                isLoading={pending === status}
                disabled={pending !== null}
              >
                {ACTION_LABEL[status]}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
