"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch, isApiError } from "@/lib/fetcher";
import { socket } from "@/lib/socket";
import { acceptVehiclePacket, mergeVehicleUpdate } from "@/lib/vehicle-update";
import { useClientStore } from "@/store/client-store";
import TrackingMap from "@/components/tracking/tracking-map";
import VehicleList from "@/components/tracking/vehicle-list";
import CustomSelect from "@/components/ui/custom-select";
import { TrackingPageSkeleton } from "@/components/ui/skeletons/tracking-list-skeleton";

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

export default function TrackingPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | "api" | "network">(null);

  // Fleet Owner (ADMIN) client filter — reuses the global navbar client selector.
  // ADMIN's /vehicles returns every client's vehicles; selecting a client narrows
  // the map + list. CLIENT already only receives its own vehicles, so this is a no-op.
  const { selectedClient } = useClientStore();

  // RC11–RC13: per-vehicle high-water timestamp so duplicate / out-of-order /
  // timestamp-invalid packets are ignored. A ref — never triggers a re-render.
  const lastTimestampsRef = useRef<Record<string, number>>({});

  // Collapsing the Fleet Vehicles rail to hand its width to the map. Layout-only state:
  // it never touches `vehicles`, `selected` or the socket subscription, so collapsing
  // cannot reload data, drop a live update or reset the map viewport.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/vehicles");

      // apiFetch now rejects on non-2xx, so a 500 lands in the catch below. Kept as a
      // defensive guard: it also covers a non-ok response reaching here another way.
      if (!response.ok) {
        setError("api");
        return;
      }

      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (err) {
      // An ApiError means the server answered with a 4xx/5xx; anything else means
      // fetch itself rejected and the server was unreachable. Keeping them apart
      // preserves the two distinct messages below.
      console.error(err);
      setError(isApiError(err) ? "api" : "network");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    // RC10: named handler so cleanup removes only THIS listener. `socket.off` with no
    // handler drops every other component's vehicleLocationUpdate listener too.
    const handleLocationUpdate = (
      updatedVehicle: Vehicle & { timestamp?: number },
    ) => {
      // RC11–RC13: drop duplicate / out-of-order / invalid-timestamp packets.
      if (
        !acceptVehiclePacket(
          lastTimestampsRef.current,
          updatedVehicle?.id,
          updatedVehicle?.timestamp,
        )
      ) {
        return;
      }

      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === updatedVehicle.id
            ? mergeVehicleUpdate(vehicle, updatedVehicle)
            : vehicle,
        ),
      );

      setSelected((prev) => {
        if (prev && prev.id === updatedVehicle.id) {
          return mergeVehicleUpdate(prev, updatedVehicle);
        }

        return prev;
      });
    };

    socket.on("vehicleLocationUpdate", handleLocationUpdate);

    return () => {
      socket.off("vehicleLocationUpdate", handleLocationUpdate);
    };
  }, []);

  const visibleVehicles = useMemo(
    () =>
      selectedClient
        ? vehicles.filter((v) => v.client?.id === selectedClient.id)
        : vehicles,
    [vehicles, selectedClient],
  );

  const selectOptions = useMemo(() => {
    return [
      { value: "", label: "All Vehicles" },
      ...visibleVehicles.map((v) => ({
        value: v.id,
        label: v.vehicleNumber,
        sublabel: v.driverName,
        status: v.status,
      })),
    ];
  }, [visibleVehicles]);

  if (loading) {
    return <TrackingPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-foreground">
          {error === "network"
            ? "Can't reach the server. Check your connection."
            : "Something went wrong loading vehicles."}
        </p>
        <button
          onClick={fetchVehicles}
          className="cursor-pointer rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
      </div>
    );
  }

  // One layout for every breakpoint: the vehicle picker (a dropdown on mobile, the list
  // sidebar from md up) and then the map, which takes everything left over. The three
  // per-breakpoint blocks this replaced each mounted their own <TrackingMap>, so three
  // Google Maps instances and three sets of markers were live at once with two hidden.
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background md:flex-row">
      {/* MOBILE VEHICLE PICKER (< md) — the sidebar is too wide for a phone */}
      <div className="z-30 border-b border-border bg-background p-3.5 md:hidden">
        <CustomSelect
          value={selected?.id || ""}
          onChange={(val) => {
            setSelected(vehicles.find((item) => item.id === val) || null);
          }}
          options={selectOptions}
          placeholder="Select a vehicle..."
        />
      </div>

      {/* VEHICLE LIST (md and up).
          h-full + min-h-0 are explicit rather than relying on flex stretch alone, so the
          list's internal overflow always has a definite height to resolve against.
          Collapsing animates this rail's WIDTH; the list itself is never unmounted (see
          below), so search text, scroll position and selection all survive the toggle. */}
      <div
        className={`relative hidden h-full min-h-0 flex-shrink-0 bg-card transition-[width] duration-300 ease-in-out md:block ${
          sidebarCollapsed ? "w-11" : "w-[260px] xl:w-[280px]"
        }`}
      >
        {/* Collapse / expand control. Sits on the rail's inner edge, top-aligned — Google
            Maps puts its own controls at the top-right and bottom-right of the map, so
            nothing here overlaps them at any width. It straddles the rail and the map, so
            it wears the map chrome: a fixed dark fill that reads against both, with its
            focus ring drawn inside. */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          aria-expanded={!sidebarCollapsed}
          aria-controls="fleet-vehicles-panel"
          title={sidebarCollapsed ? "Show Fleet Vehicles" : "Hide Fleet Vehicles"}
          className="absolute -right-3 top-4 z-40 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-chrome-line bg-chrome-bg text-chrome-fg-dim outline-none transition-colors hover:bg-chrome-bg-2 hover:text-chrome-fg focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chrome-signal"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">
            {sidebarCollapsed ? "Show Fleet Vehicles" : "Hide Fleet Vehicles"}
          </span>
        </button>

        {/* Kept MOUNTED while collapsed and merely clipped to zero width. Unmounting it
            would throw away the search box's text and the list's scroll offset, and would
            remount every VehicleCard on expand. The socket lives on the page, so live
            updates continue regardless. */}
        <div
          id="fleet-vehicles-panel"
          aria-hidden={sidebarCollapsed}
          className={`h-full min-h-0 overflow-hidden ${
            sidebarCollapsed ? "pointer-events-none w-0 opacity-0" : "w-full opacity-100"
          }`}
        >
          <div className="h-full min-h-0 w-[260px] xl:w-[280px]">
            <VehicleList
              vehicles={visibleVehicles}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        </div>
      </div>

      {/* MAP — fills all remaining space; the selected vehicle's details now ride on the
          map as a compact popup instead of a side panel. min-w-0 lets this flex child
          shrink below its content width instead of pushing the sidebar off-screen. */}
      <div className="relative min-h-[300px] min-w-0 flex-1 overflow-hidden">
        <TrackingMap
          vehicles={visibleVehicles}
          selectedVehicle={selected}
          onVehicleSelect={(v) =>
            setSelected(v ? (vehicles.find((item) => item.id === v.id) ?? null) : null)
          }
          showVehicleCard
        />
      </div>
    </div>
  );
}
