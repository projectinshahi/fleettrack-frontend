"use client";

import Link from "next/link";
import { LocateFixed, Route, X } from "lucide-react";

import { roundSpeed } from "@/lib/utils/format-speed";
import { formatFixTime, isOffline } from "@/lib/utils/vehicle-freshness";
import type { Vehicle } from "./tracking-map";
import { useAuthStore } from "@/store/auth-store";
import {
  STATUS_CHIP,
  StatusCue,
  type StatusTone,
} from "@/components/ui/status-chip";

interface VehiclePopupCardProps {
  vehicle: Vehicle;
  onCenterMap: () => void;
  onClose: () => void;
}

/**
 * The compact map popup that replaced the full-height VehicleDetails drawer on /tracking.
 * It carries the same facts the drawer did (status, speed, client, device, last fix, and
 * the Trips / Center actions) at popup scale, so the map keeps the whole width.
 *
 * VehicleDetails is NOT deleted — /tracking/[id] is a single-vehicle page whose side panel
 * is the point of the route, so it still uses it.
 */
export default function VehiclePopupCard({
  vehicle,
  onCenterMap,
  onClose,
}: VehiclePopupCardProps) {
  const offline = isOffline(vehicle);
  const { user } = useAuthStore();

  // Branch order and the catch-all fall-through are unchanged from the previous inline
  // ternary; only the colours they resolve to moved. STATUS_CHIP holds full literal
  // class strings for the same reason the old object did — Tailwind scans source text,
  // so a class name assembled at runtime is never generated.
  const tone: StatusTone =
    vehicle.status === "MOVING"
      ? "ok"
      : vehicle.status === "IDLE"
        ? "attn"
        : "fault";

  return (
    // The click guard keeps a click INSIDE the card from reaching the map, which would
    // otherwise clear the selection and close the card the user is reading.
    //
    // Map chrome: the card floats over Google's tiles, so it wears the fixed dark layer in
    // both themes. It keeps its shadow because it genuinely floats above the markers.
    //
    // font-sans: the card is mounted inside Google's .gm-style, which sets Roboto for
    // everything under it; the identifier lines keep their own font-mono.
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-[248px] select-none font-sans rounded-lg border border-chrome-line bg-chrome-bg text-chrome-fg shadow-lg animate-in fade-in-50 zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-3 pt-3">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-[13px] font-semibold leading-none text-chrome-fg">
            {vehicle.vehicleNumber}
          </h3>
          <p className="mt-1.5 truncate text-xs font-semibold text-chrome-fg-dim">
            {vehicle.driverName}
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close vehicle details"
          className="-mr-1 -mt-1 flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-chrome-fg-dim outline-none transition-colors hover:bg-chrome-bg-2 hover:text-chrome-fg focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chrome-signal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Status + speed */}
      <div className="mt-3 flex items-center justify-between gap-2 px-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_CHIP[tone]}`}
        >
          <StatusCue tone={tone} />
          {vehicle.status}
        </span>

        {/* Offline = no current speed. The last reading is still available, but on the
            "Last speed" row below where it is explicitly labelled as historic — never
            in the live-reading slot next to the status pill. */}
        {offline ? (
          <p className="text-[13px] font-semibold text-chrome-fg-dim">—</p>
        ) : (
          <p className="text-[13px] font-semibold tabular-nums text-chrome-fg">
            {roundSpeed(vehicle.speed)}{" "}
            <span className="text-xs font-semibold text-chrome-fg-dim">
              km/h
            </span>
          </p>
        )}
      </div>

      {/* Facts */}
      <dl className="mt-3 space-y-1.5 border-t border-chrome-line px-3 pt-2.5 text-xs">
        {vehicle.client?.name && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="font-semibold text-chrome-fg-dim">Client</dt>
            <dd className="truncate font-semibold text-chrome-fg">
              {vehicle.client.name}
            </dd>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3">
          <dt className="font-semibold text-chrome-fg-dim">Device</dt>
          <dd className="truncate font-mono font-semibold text-chrome-fg">
            {vehicle.gpsDeviceId}
          </dd>
        </div>

        {offline && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="font-semibold text-chrome-fg-dim">Last speed</dt>
            <dd className="font-semibold tabular-nums text-chrome-fg">
              {roundSpeed(vehicle.speed)} km/h
            </dd>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3">
          <dt className="font-semibold text-chrome-fg-dim">
            {offline ? "Last seen" : "Last fix"}
          </dt>
          <dd className="font-semibold tabular-nums text-chrome-fg">
            {formatFixTime(vehicle, !offline)}
          </dd>
        </div>
      </dl>

      {/* Actions */}
      <div className="mt-3 flex gap-2 border-t border-chrome-line p-2.5">
        {/* Trip pages are CLIENT-only (lib/role-routes.ts); for an ADMIN this bounced. */}
        {user?.role === "CLIENT" && (
          <Link
            href="/trips"
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-chrome-line bg-chrome-bg text-xs font-bold text-chrome-fg transition-colors hover:bg-chrome-bg-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chrome-signal"
          >
            <Route className="h-3.5 w-3.5 text-chrome-fg-dim" />
            Trips
          </Link>
        )}

        <button
          onClick={onCenterMap}
          className="flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-chrome-line bg-chrome-bg text-xs font-bold text-chrome-fg outline-none transition-colors hover:bg-chrome-bg-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chrome-signal"
        >
          <LocateFixed className="h-3.5 w-3.5 text-chrome-fg-dim" />
          Center
        </button>
      </div>
    </div>
  );
}
