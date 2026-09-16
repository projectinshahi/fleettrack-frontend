import { Clock3, Gauge } from "lucide-react";

import { formatSpeed } from "@/lib/utils/format-speed";
import { formatFixTime, isOffline } from "@/lib/utils/vehicle-freshness";
import {
  STATUS_CHIP,
  StatusCue,
  type StatusTone,
} from "@/components/ui/status-chip";

interface Vehicle {
  id: string;
  vehicleName: string;
  vehicleNumber: string;
  gpsDeviceId: string;
  driverName: string;
  clientName: string;
  status: string;
  latitude: number;
  longitude: number;
  speed: number;
  lastProviderUpdate?: string | null;
  updatedAt: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  active?: boolean;
  onClick?: () => void;
}

export default function VehicleCard({
  vehicle,
  active = false,
  onClick,
}: VehicleCardProps) {
  const isIdle = vehicle.status === "IDLE";
  const offline = isOffline(vehicle);

  // Branch order preserved exactly as it was. NOTE this card's fall-through differs from
  // the dashboard widgets on purpose: an unrecognised status reads as OK here (the rail
  // only ever lists vehicles the tracking page already accepted), where the dashboard
  // treats an unknown status as a fault. Left as-is — changing it would change which
  // colour an unexpected provider value gets.
  const tone: StatusTone =
    vehicle.status === "OFFLINE" ? "fault" : isIdle ? "attn" : "ok";

  return (
    // A real button, so the rail works from the keyboard as well as the pointer; the click
    // handler is unchanged. aria-current names the selected vehicle for assistive tech, and
    // the selected edge changes lightness as well as hue, so it also survives greyscale.
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`block w-full cursor-pointer rounded-lg border p-3 text-left transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-[13px] font-semibold leading-none text-foreground">
            {vehicle.vehicleNumber}
          </h3>

          <p className="mt-1.5 truncate text-xs font-semibold text-muted-foreground">
            {vehicle.driverName}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tracking-wide uppercase border ${STATUS_CHIP[tone]}`}
        >
          <StatusCue tone={tone} />
          {vehicle.status}
        </span>
      </div>

      {/* An offline vehicle has no CURRENT speed — only a last known one. Showing that
          number here unqualified is what made "OFFLINE · 69 km/h" read as live. The
          value isn't hidden, it moves to the "Last seen" line where it belongs. */}
      <div className="mt-3 flex items-center gap-3.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
        <div className="flex items-center gap-1">
          <Gauge className="h-3.5 w-3.5" />
          <span>{offline ? "—" : formatSpeed(vehicle.speed)}</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          <span>
            {offline
              ? `Last seen ${formatFixTime(vehicle)}`
              : formatFixTime(vehicle, true)}
          </span>
        </div>
      </div>
    </button>
  );
}