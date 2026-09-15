"use client";

import {
  Car,
  MapPin,
  User,
  Cpu,
  Activity,
  ArrowLeft,
  FileDown,
} from "lucide-react";

import { roundSpeed } from "@/lib/utils/format-speed";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/fetcher";
import { DetailSkeleton } from "@/components/ui/skeletons/detail-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import VehicleStatusBadge from "@/components/vehicles/vehicle-status-badge";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import dynamic from "next/dynamic";
const VehicleMap = dynamic(() => import("@/components/vehicles/vehicle-map"), {
  ssr: false,
});

interface Vehicle {
  id: string;
  vehicleName: string;
  vehicleNumber: string;
  gpsDeviceId: string;
  driverName: string;
  status: string;
  latitude: number;
  longitude: number;
  speed: number;
  createdAt: string;
  updatedAt: string;

  client?: {
    id: string;
    name: string;
  };
}
export default function VehicleDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const downloadReport = async () => {
    if (!vehicle) return;

    try {
      setDownloading(true);

      const response = await apiFetch(`/vehicles/${vehicle.id}/report`);

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${vehicle.vehicleNumber}-${
        new Date().toISOString().split("T")[0]
      }-report.pdf`;
      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);

      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await apiFetch(`/vehicles/${params.id}`);

      // apiFetch now rejects on non-2xx, so a 500/network failure reaches the catch
      // and never falls through to "Vehicle not found". Kept as a defensive guard.
      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();

      setVehicle(data.vehicle ?? null);
    } catch (error) {
      console.log(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Inlined loader (not a call to `fetchVehicle`) to satisfy the
  // no-setState-in-effect lint rule; fetchVehicle stays for the retry button.
  useEffect(() => {
    if (!params.id) return;

    async function load() {
      try {
        setError(false);

        const response = await apiFetch(`/vehicles/${params.id}`);

        if (!response.ok) throw new Error("Request failed");

        const data = await response.json();

        setVehicle(data.vehicle ?? null);
      } catch (err) {
        console.log(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message="Couldn't load this vehicle."
          onRetry={fetchVehicle}
        />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Vehicle not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/vehicles"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Vehicles
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">
            {" "}
            {vehicle.vehicleName}
          </h1>

          <p className="mt-2 text-muted-foreground">
            Vehicle Number: {vehicle.vehicleNumber}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Last Updated: {new Date(vehicle.updatedAt).toLocaleString()}
          </p>
        </div>

        <div className="w-fit">
          <VehicleStatusBadge status={vehicle.status} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {/* Driver */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />

            <h3 className="text-sm font-semibold">Driver</h3>
          </div>

          <p className="mt-4 break-all text-lg font-semibold">
            {vehicle.driverName}
          </p>
        </div>

        {/* GPS */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-muted-foreground" />

            <h3 className="text-sm font-semibold">GPS Device</h3>
          </div>

          <p className="mt-4 break-all font-mono text-xl font-semibold">
            {vehicle.gpsDeviceId}
          </p>
        </div>

        {/* Client */}
        {user?.role === "ADMIN" && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Client</h3>
            </div>

            <p className="mt-4 break-all text-xl font-semibold">
              {vehicle.client?.name || "N/A"}
            </p>
          </div>
        )}
      </div>

      {/* Location + Stats. An "Active Now / Total Distance / Live Updates" bar and a "Current
          Trip Summary" card used to sit here, printing hardcoded values (12, 245 km, 5h 22m,
          29 May 2026) and a static "Connected" as if they were this vehicle's live data.
          Nothing on this page fetches those numbers, so they are removed, not left to mislead. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Location */}

        <div className="rounded-lg border border-border bg-card p-4 md:p-5">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />

            <h3 className="section-title">Live Vehicle Location</h3>
          </div>

          <div className="mt-6">
            {vehicle.latitude !== 0 && vehicle.longitude !== 0 ? (
              <div className="h-[320px] md:h-[420px]">
                <VehicleMap
                  latitude={vehicle.latitude}
                  longitude={vehicle.longitude}
                  vehicleName={vehicle.vehicleName}
                />
              </div>
            ) : (
              <div className="flex h-[320px] flex-col md:h-[420px] items-center justify-center rounded-lg border border-dashed border-border text-center">
                <MapPin className="h-8 w-8 text-muted-foreground" />

                <p className="mt-3 text-sm font-medium">
                  Live location unavailable
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Waiting for GPS updates
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Latitude</p>

              <h4 className="mt-1 font-mono text-sm font-semibold tabular-nums">{vehicle.latitude}</h4>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Longitude</p>

              <h4 className="mt-1 font-mono text-sm font-semibold tabular-nums">
                {vehicle.longitude}
              </h4>
            </div>
          </div>
        </div>
        {/* Speed */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-5">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-muted-foreground" />

            <h3 className="section-title">Live Statistics</h3>
          </div>

          <div className="mt-6">
            <p className="text-sm text-muted-foreground">Current Speed</p>

            <h2 className="mt-2 text-3xl font-semibold">
              {roundSpeed(vehicle.speed)}
              <span className="ml-2 text-xl">km/h</span>
            </h2>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/tracking/${vehicle.id}`}
              className="flex h-11 w-full items-center justify-center sm:w-auto rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Track Live
            </Link>

            {/* Trip pages are CLIENT-only (lib/role-routes.ts); for an ADMIN this bounced. */}
            {user?.role === "CLIENT" && (
              <Link
                href="/trips"
                className="flex h-11 w-full items-center justify-center sm:w-auto rounded-lg border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                Trips
              </Link>
            )}

            <button
              onClick={downloadReport}
              disabled={downloading}
              className="flex h-11 w-full items-center gap-2 justify-center sm:w-auto rounded-lg border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />

              {downloading ? "Generating..." : "Generate PDF"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
