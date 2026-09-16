"use client";

import Link from "next/link";

import { roundSpeed } from "@/lib/utils/format-speed";
import { formatFixTime, isOffline } from "@/lib/utils/vehicle-freshness";
import { LocateFixed, Route, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import {
  STATUS_CHIP,
  StatusCue,
  type StatusTone,
} from "@/components/ui/status-chip";

/** Branch order and the catch-all fall-through are unchanged from the previous inline
 *  ternary; only the colours they resolve to moved. */
function statusTone(status?: string): StatusTone {
  if (status === "MOVING") return "ok";
  if (status === "IDLE") return "attn";
  return "fault";
}

interface Vehicle {
  id: string;
  vehicleName: string;
  vehicleNumber: string;
  gpsDeviceId: string;
  driverName: string;
  // The API returns `client { id, name }`; a vehicle row has no clientName, so reading only
  // that left the Client tile blank on /tracking/[id].
  clientName?: string;
  client?: { id: string; name: string } | null;
  status: string;
  latitude: number;
  longitude: number;
  speed: number;
  lastProviderUpdate?: string | null;
  updatedAt: string;
}

interface VehicleDetailsProps {
  vehicle: Vehicle;
  onCenterMap: () => void;
  /** Optional: the close button renders only when there is something to close. */
  onClose?: () => void;
  mobile?: boolean;
}

export default function VehicleDetails({
  vehicle,
  onCenterMap,
  onClose,
  mobile = false,
}: VehicleDetailsProps) {
  const offline = isOffline(vehicle);
  const { user } = useAuthStore();

  return (
    <div
      className={`
        flex flex-col bg-transparent
        ${mobile ? "p-1" : "h-full overflow-y-auto p-4"}
      `}
    >
      <div
        className="flex items-center justify-between mb-4"
      >
        <div>
          <h2 className="section-title font-mono text-foreground">{vehicle.vehicleNumber}</h2>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">{vehicle.driverName}</p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close vehicle details"
            className="
              flex h-8 w-8 items-center justify-center
              rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground
              transition-colors duration-150 cursor-pointer
            "
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}

      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-lg border border-border bg-muted/30 p-3.5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</p>

          <div className="mt-2.5">
            <span
              className={`
                inline-flex items-center gap-1.5 rounded-full
                px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase border

                ${STATUS_CHIP[statusTone(vehicle.status)]}
              `}
            >
              <StatusCue tone={statusTone(vehicle.status)} />
              {vehicle.status}
            </span>
          </div>
        </div>

        {/* Offline has no current speed — the label switches to "Last speed" so the
            number is never read as a live reading. Same rule as VehicleCard/popup. */}
        <div className="rounded-lg border border-border bg-muted/30 p-3.5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {offline ? "Last speed" : "Speed"}
          </p>

          <p className="mt-2 text-lg font-semibold text-foreground tracking-tight">
            {roundSpeed(vehicle.speed)} <span className="text-xs font-semibold text-muted-foreground">km/h</span>
          </p>

          {offline && (
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Last seen {formatFixTime(vehicle)}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3.5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client</p>

          <p className="mt-2 text-xs font-bold text-foreground truncate">{vehicle.client?.name ?? vehicle.clientName ?? "—"}</p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3.5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">GPS Device</p>

          <p className="mt-2 font-mono text-xs font-semibold text-foreground truncate">{vehicle.gpsDeviceId}</p>
        </div>
      </div>

      {/* Buttons */}

      <div className="mt-5 flex gap-3">
        {/* Trip pages are CLIENT-only (lib/role-routes.ts); for an ADMIN this bounced. */}
        {user?.role === "CLIENT" && (
          <Link
            href="/trips"
            className="
              flex h-9 flex-1 items-center justify-center
              gap-2 rounded-lg border border-border bg-card
              text-xs font-bold hover:bg-muted text-foreground
              transition-colors duration-150
            "
          >
            <Route className="h-4 w-4 text-muted-foreground" />
            Trips
          </Link>
        )}

        <button
          onClick={onCenterMap}
          className="
            flex h-9 flex-1 items-center justify-center
            gap-2 rounded-lg border border-border bg-card
            text-xs font-bold hover:bg-muted text-foreground
            transition-colors duration-150
            cursor-pointer
          "
        >
          <LocateFixed className="h-4 w-4 text-muted-foreground" />
          Center
        </button>
      </div>
    </div>
  );
}
