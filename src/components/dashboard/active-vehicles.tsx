import { formatSpeed } from "@/lib/utils/format-speed";
import {
  STATUS_CHIP,
  StatusCue,
  type StatusTone,
} from "@/components/ui/status-chip";

interface ActiveVehiclesProps {
  vehicles: any[];
}

/** Branch order and the catch-all fall-through are unchanged from the previous inline
 *  ternary; only the colours they resolve to moved. */
function statusTone(status?: string): StatusTone {
  if (status === "MOVING") return "ok";
  if (status === "IDLE") return "attn";
  return "fault";
}

/**
 * Recently reporting vehicles as a ledger: one hairline-divided row per vehicle. No
 * card-within-card and no repeated per-row icon, so registration, status and speed are the
 * only things on the row competing for attention.
 */
export default function ActiveVehicles({
  vehicles,
}: ActiveVehiclesProps) {
  return (
    <div className="h-full rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="section-title text-foreground">
          Active Vehicles
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">Real-time status of active fleet units</p>
      </div>

      {!vehicles?.length ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No active vehicles
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {vehicles.map((vehicle) => {
            const tone = statusTone(vehicle.status);

            return (
              <li
                key={vehicle.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold leading-none text-foreground">
                    {vehicle.vehicleNumber}
                  </p>

                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {vehicle.driverName}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_CHIP[tone]}`}
                  >
                    <StatusCue tone={tone} />
                    {vehicle.status}
                  </span>

                  {/* Fixed width + tabular figures: speeds form a right-aligned column down
                      the list, and the chips beside them keep a common right edge. */}
                  <span className="w-16 text-right text-sm font-medium tabular-nums text-foreground">
                    {formatSpeed(vehicle.speed)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
