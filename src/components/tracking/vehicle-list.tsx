"use client";

import { useState } from "react";
import { Search, Layers3 } from "lucide-react";
import VehicleCard from "./vehicle-card";
import EmptyState from "@/components/ui/empty-state";
import { StatusCue } from "@/components/ui/status-chip";

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
  client?: { id: string; name: string };
}

interface VehicleListProps {
  vehicles: Vehicle[];

  selected: Vehicle | null;

  onSelect: (vehicle: Vehicle | null) => void;
}

export default function VehicleList({
  vehicles,
  selected,
  onSelect,
}: VehicleListProps) {
  const [query, setQuery] = useState("");

  const filtered = vehicles.filter(
    (vehicle) =>
      vehicle.vehicleNumber.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.driverName.toLowerCase().includes(query.toLowerCase()),
  );

  const movingCount = vehicles.filter(
    (vehicle) => vehicle.status === "MOVING",
  ).length;

  // Group the (filtered) list by owning client — the Fleet Owner (ADMIN) sees
  // vehicles from every client, so they're bucketed under each client's name. A
  // single-client list (a CLIENT login, or a client filter) collapses to one group
  // and is rendered flat (no header).
  const groups = (() => {
    const map = new Map<string, Vehicle[]>();
    for (const vehicle of filtered) {
      const key = vehicle.client?.name ?? vehicle.clientName ?? "Unassigned";
      const bucket = map.get(key);
      if (bucket) bucket.push(vehicle);
      else map.set(key, [vehicle]);
    }
    return [...map.entries()];
  })();

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <h2 className="section-title text-foreground">Fleet Vehicles</h2>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vehicles..."
            aria-label="Search vehicles"
            className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:bg-background"
          />
        </div>
      </div>

      {/* Vehicle List — min-h-0 lets this flex child shrink so it scrolls INTERNALLY
          instead of pushing the sidebar (and the page) taller.

          Uses `slim-scrollbar`, NOT `no-scrollbar`: a hidden scrollbar left a TV pointer
          with nothing to grab and no hint that the list continued below the fold, which
          is what made the lower vehicles unreachable there. */}
      <div className="slim-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain bg-background/30 p-3">
        {/* ALL VEHICLES CARD */}
        <button
          onClick={() => onSelect(null)}
          aria-current={selected === null ? "true" : undefined}
          className={`w-full rounded-lg border p-3 text-left transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            selected === null
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div>
              <h3 className="text-[13px] font-semibold leading-none text-foreground">All Vehicles</h3>

              <p className="mt-1.5 text-xs text-muted-foreground font-medium">
                Show all active units
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Layers3 className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-3.5 flex items-center gap-3.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <div>
              <span className="font-bold text-foreground">
                {vehicles.length}
              </span>{" "}
              Total
            </div>

            <div className="flex items-center gap-1">
              <StatusCue tone="ok" className="text-status-ok" />
              <span className="font-bold text-foreground">
                {movingCount}
              </span>{" "}
              Moving
            </div>
          </div>
        </button>

        {/* VEHICLES */}
        {filtered.length === 0 ? (
          <EmptyState title="No vehicles found." />
        ) : groups.length <= 1 ? (
          filtered.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              active={selected?.id === vehicle.id}
              onClick={() => onSelect(vehicle)}
            />
          ))
        ) : (
          groups.map(([clientName, list]) => (
            <div key={clientName} className="space-y-2.5">
              <p className="px-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {clientName} ({list.length})
              </p>

              {list.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  active={selected?.id === vehicle.id}
                  onClick={() => onSelect(vehicle)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
