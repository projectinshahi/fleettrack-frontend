"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { apiFetch, isApiError } from "@/lib/fetcher";
import TrackingMap from "@/components/tracking/tracking-map";
import VehicleDetails from "@/components/tracking/vehicle-details";
import { socket } from "@/lib/socket";
import { acceptVehiclePacket, mergeVehicleUpdate } from "@/lib/vehicle-update";
import { TrackingDetailSkeleton } from "@/components/ui/skeletons/detail-skeleton";

interface Vehicle {
  id: string;
  vehicleName: string;
  vehicleNumber: string;
  gpsDeviceId: string;
  driverName: string;
  clientName?: string;
  client?: { id: string; name: string };
  status: string;
  latitude: number;
  longitude: number;
  speed: number;
  updatedAt: string;
  ignition?: boolean;
  batteryVoltage?: number;
  charge?: boolean;
}

export default function SingleTrackingPage() {
  const params = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | "api" | "network">(null);
  const [centerTrigger, setCenterTrigger] = useState(0);

  // RC11–RC13: per-vehicle high-water timestamp (ref) to drop duplicate /
  // out-of-order / timestamp-invalid packets.
  const lastTimestampsRef = useRef<Record<string, number>>({});

  const handleCenterMap = () => {
    setCenterTrigger((prev) => prev + 1);
  };

  const fetchVehicle = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/vehicles/${params.id}`);

      // apiFetch now rejects on non-2xx, so a 500 lands in the catch below and never
      // shows "Vehicle not found". Kept as a defensive guard.
      if (!response.ok) {
        setError("api");
        return;
      }

      const data = await response.json();
      setVehicle(data.vehicle ?? null);
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
    if (params.id) {
      fetchVehicle();
    }
  }, [params.id]);

  useEffect(() => {
    // RC10: named handler so cleanup removes only THIS listener, not every other
    // component's vehicleLocationUpdate subscription.
    const handleLocationUpdate = (data: Vehicle & { timestamp?: number }) => {
      // RC11–RC13: drop duplicate / out-of-order / invalid-timestamp packets.
      if (
        !acceptVehiclePacket(lastTimestampsRef.current, data?.id, data?.timestamp)
      ) {
        return;
      }

      setVehicle((prev) => {
        if (!prev) {
          return prev;
        }
        if (data.id !== prev.id) {
          return prev;
        }
        return mergeVehicleUpdate(prev, data);
      });
    };

    socket.on("vehicleLocationUpdate", handleLocationUpdate);

    return () => {
      socket.off("vehicleLocationUpdate", handleLocationUpdate);
    };
  }, []);

  if (loading) {
    return <TrackingDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-foreground">
          {error === "network"
            ? "Can't reach the server. Check your connection."
            : "Something went wrong loading this vehicle."}
        </p>
        <button
          onClick={fetchVehicle}
          className="cursor-pointer rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Vehicle not found
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-background">
      <h1 className="sr-only">Live tracking: {vehicle.vehicleNumber}</h1>

      {/* MOBILE VIEW (< 768px / md) */}
      <div className="flex h-full flex-col md:hidden">
        {/* Map Area — ends where the sheet begins, so the map controls, the live status card
            and Google's logo and attribution all stay visible above it. */}
        <div className="relative flex-1 overflow-hidden min-h-[300px]">
          <TrackingMap
            vehicles={[vehicle]}
            selectedVehicle={vehicle}
            centerTrigger={centerTrigger}
          />
        </div>

        {/* Mobile bottom sheet drawer details. In the column flow rather than absolutely
            positioned over the map: overlaid, it covered the bottom 300+px of the map. It
            shrinks (and its body scrolls) on short screens before the map drops below 300px. */}
        <div className="flex min-h-0 flex-col animate-in slide-in-from-bottom duration-300">
          {/* The shadow is cast UPWARD because the sheet rises from the bottom edge, which no
              shadow-* utility does: the one arbitrary shadow in the app. Solid card fill, no blur. */}
          <div className="flex min-h-0 w-full flex-col rounded-t-lg border-t border-border bg-card shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
            {/* Drag Handle */}
            <div className="w-12 h-1.5 shrink-0 bg-muted rounded-full mx-auto my-3" />
            <div className="slim-scrollbar min-h-0 max-h-[50vh] overflow-y-auto px-4 pb-8">
              <VehicleDetails
                vehicle={vehicle}
                onCenterMap={handleCenterMap}
                mobile
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLET & DESKTOP VIEW (>= 768px / md) */}
      <div className="hidden md:grid h-full grid-cols-[1fr_340px]">
        {/* Map */}
        <div className="min-w-0 h-full overflow-hidden">
          <TrackingMap
            vehicles={[vehicle]}
            selectedVehicle={vehicle}
            centerTrigger={centerTrigger}
          />
        </div>

        {/* Details Panel Sidebar */}
        <div className="overflow-y-auto border-l border-border bg-card">
          <VehicleDetails
            vehicle={vehicle}
            onCenterMap={handleCenterMap}
          />
        </div>
      </div>
    </div>
  );
}
