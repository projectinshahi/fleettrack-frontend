"use client";

import { ChevronDown, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/fetcher";
import { downloadCsv } from "@/lib/csv";
import {
  VEHICLE_CSV_COLUMNS,
  type VehicleExportRow,
} from "@/lib/csv-exports";
import { useAuthStore } from "@/store/auth-store";
import VehicleStatusBadge from "./vehicle-status-badge";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/ui/skeletons/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The subset of GET /vehicles this table renders, widened with the telemetry/identity
 * fields the CSV export includes. The endpoint already returns the whole Vehicle row —
 * these were simply untyped because no column displayed them. Extends VehicleExportRow so
 * the row type and the export's column definitions cannot drift apart.
 */
interface Vehicle extends VehicleExportRow {
  id: string;
  vehicleName: string;
  vehicleNumber: string;
  gpsDeviceId: string;
  driverName: string;
  status: string;
  createdAt: string;
  providerName?: string | null;

  client?: {
    id: string;
    name: string;
  };
}

interface VehicleTableProps {
  searchQuery?: string;
}

// Human-readable GPS provider label for the "GPS Device" column, from the existing
// providerName field. Unknown providers fall back to a capitalized form (never break).
const PROVIDER_LABELS: Record<string, string> = {
  airotrack: "AiroTrack",
  transight: "Transight",
};

function providerLabel(providerName?: string | null): string {
  if (!providerName) return "—";
  const key = providerName.toLowerCase();
  return (
    PROVIDER_LABELS[key] ??
    providerName.charAt(0).toUpperCase() + providerName.slice(1)
  );
}

export default function VehicleTable({
  searchQuery = "",
}: VehicleTableProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { user } = useAuthStore();
  const router = useRouter();

  const fetchVehicles = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await apiFetch("/vehicles");
      // Non-ok HTTP (e.g. 500) → error state with retry, not a false "empty".
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (err) {
      console.log(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Data fetching on mount is a standard pattern, state is set asynchronously
    fetchVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    let list = vehicles;

    if (statusFilter !== "ALL") {
      list = list.filter(
        (vehicle) => vehicle.status === statusFilter,
      );
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();

      list = list.filter(
        (vehicle) =>
          vehicle.vehicleNumber
            ?.toLowerCase()
            .includes(q) ||
          vehicle.vehicleName
            ?.toLowerCase()
            .includes(q) ||
          vehicle.driverName
            ?.toLowerCase()
            .includes(q) ||
          vehicle.client?.name
            ?.toLowerCase()
            .includes(q),
      );
    }

    return list;
  }, [vehicles, statusFilter, searchQuery]);

  const [exporting, setExporting] = useState(false);

  /**
   * Exports `filteredVehicles` — the page's search box and this table's status filter both
   * apply, so the sheet is what the user sees. Not a page slice: GET /vehicles returns the
   * whole role-scoped fleet in one response and there is no pagination, so this is every
   * matching vehicle. Built from data already in memory; nothing is re-fetched.
   *
   * Guarded on ADMIN as well as hidden for non-admins, so the handler cannot run for a
   * CLIENT even if the button were ever rendered by mistake.
   */
  const handleExportCsv = () => {
    if (user?.role !== "ADMIN") return;
    if (filteredVehicles.length === 0) {
      toast.error("No vehicles to export");
      return;
    }
    try {
      setExporting(true);
      downloadCsv(
        "fleettrack-vehicles.csv",
        filteredVehicles,
        VEHICLE_CSV_COLUMNS,
      );
    } catch (err) {
      console.log(err);
      toast.error("Failed to export vehicles");
    } finally {
      setExporting(false);
    }
  };

  if (loading)
    return (
      <TableSkeleton columns={user?.role === "ADMIN" ? 7 : 6} rows={8} />
    );

  if (error)
    return (
      <ErrorState message="Couldn't load vehicles." onRetry={fetchVehicles} />
    );

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="section-title text-muted-foreground">
          All Vehicles ({filteredVehicles.length})
        </h3>

        {/* ADMIN-only export, placed here rather than in the page header because the data
            and both filters (search + status) live in this component — no lifting, and the
            sheet always matches the rows on screen. */}
        {user?.role === "ADMIN" && (
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            title="Download the vehicles shown below as CSV"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Preparing..." : "Download CSV"}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 border-b border-border bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Vehicle
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Driver
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                GPS Device
              </th>

              {user?.role === "ADMIN" && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Client
                </th>
              )}

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex cursor-pointer select-none items-center gap-1 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Status
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() =>
                        setStatusFilter("ALL")
                      }
                    >
                      All
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() =>
                        setStatusFilter("MOVING")
                      }
                    >
                      Moving
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() =>
                        setStatusFilter("IDLE")
                      }
                    >
                      Idle
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() =>
                        setStatusFilter("OFFLINE")
                      }
                    >
                      Offline
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created
              </th>

              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {filteredVehicles.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    user?.role === "ADMIN"
                      ? 7
                      : 6
                  }
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  No vehicles found.
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="group border-b border-border last:border-none transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <div>
                      <h4 className="font-mono text-sm font-semibold text-foreground">
                        {vehicle.vehicleNumber}
                      </h4>

                      <p className="mt-1 text-sm text-muted-foreground font-medium">
                        {vehicle.vehicleName}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {vehicle.driverName}
                  </td>

                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {providerLabel(vehicle.providerName)}
                  </td>

                  {user?.role === "ADMIN" && (
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {vehicle.client?.name || "-"}
                    </td>
                  )}

                  <td className="px-4 py-3">
                    <VehicleStatusBadge
                      status={vehicle.status}
                    />
                  </td>

                  <td className="px-4 py-3 text-sm text-muted-foreground font-medium">
                    {new Date(
                      vehicle.createdAt,
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/vehicles/${vehicle.id}`,
                          )
                        }
                        className="text-sm font-medium text-primary-ink hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}