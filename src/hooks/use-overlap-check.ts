"use client";

import { useEffect, useState } from "react";

import {
  checkDriverOverlap,
  checkVehicleOverlap,
} from "@/services/trip.service";
import { OverlapConflict } from "@/types/trip";

type OverlapResource = "vehicle" | "driver";

/**
 * Live double-booking check for the trip form, shared by vehicle and driver
 * validation (Milestones 7 & 8). Re-runs through the service whenever the
 * selected resource or schedule changes, so the client sees a clash before
 * submitting; components use this hook, never the service directly.
 *
 * Accepts raw form values (datetime-local or ISO strings); stays empty until the
 * resource is chosen and the window is valid (end after start).
 */
export function useOverlapCheck(
  resource: OverlapResource,
  input: {
    resourceId: string;
    scheduledStart: string;
    scheduledEnd: string;
    excludeTripId?: string;
    // ADMIN-only: scope the check to the selected client. A CLIENT omits it, so the
    // backend pins the check to its own trips via the JWT (query clientId ignored).
    clientId?: string;
  },
) {
  const { resourceId, scheduledStart, scheduledEnd, excludeTripId, clientId } =
    input;

  const [conflicts, setConflicts] = useState<OverlapConflict[]>([]);
  const [checking, setChecking] = useState(false);

  const enabled =
    !!resourceId &&
    !!scheduledStart &&
    !!scheduledEnd &&
    new Date(scheduledEnd) > new Date(scheduledStart);

  useEffect(() => {
    // A slower response for a PREVIOUS resource or window must not overwrite the current one:
    // a stale conflict could block submit, and a stale "available" could hide a real clash.
    let active = true;

    // Inlined (not a shared callback) to satisfy the no-setState-in-effect rule.
    async function run() {
      if (!enabled) {
        setConflicts([]);
        setChecking(false);
        return;
      }
      try {
        setChecking(true);
        const res =
          resource === "vehicle"
            ? await checkVehicleOverlap({
                vehicleId: resourceId,
                scheduledStart,
                scheduledEnd,
                excludeTripId,
                clientId,
              })
            : await checkDriverOverlap({
                driverId: resourceId,
                scheduledStart,
                scheduledEnd,
                excludeTripId,
                clientId,
              });
        if (active) setConflicts(res.conflicts);
      } catch (err) {
        console.log(err);
        if (active) setConflicts([]);
      } finally {
        if (active) setChecking(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [
    resource,
    resourceId,
    scheduledStart,
    scheduledEnd,
    excludeTripId,
    clientId,
    enabled,
  ]);

  return { hasOverlap: conflicts.length > 0, conflicts, checking };
}
