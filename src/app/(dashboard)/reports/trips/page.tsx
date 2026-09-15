"use client";

import { useState } from "react";
import { Route as RouteIcon, Download } from "lucide-react";
import { toast } from "sonner";

import { useTripReport } from "@/hooks/use-trip-report";
import { exportTripSummaryReport } from "@/services/trip-report.service";
import { downloadResponse } from "@/lib/download";
import { TableSkeletonRows } from "@/components/ui/skeletons/table-skeleton";
import TripStatusBadge from "@/components/trips/trip-status-badge";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

const th =
  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground";
const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function TripReportPage() {
  const { report, filter, setFilter, loading, error } = useTripReport();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const apply = () =>
    setFilter({ from: from || undefined, to: to || undefined });

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportTripSummaryReport(filter);
      if (!res.ok) throw new Error("Export failed");
      await downloadResponse(res, "trip-summary-report.pdf");
    } catch (err) {
      console.log(err);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <RouteIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Trip Report</h1>
            <p className="mt-1 text-muted-foreground">
              Trip summary by status for a period
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting..." : "Export PDF"}
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          onClick={apply}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Apply
        </button>
      </div>

      {/* By status */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {loading ? "…" : error ? "—" : report.total}
          </p>
        </div>
        {report.byStatus.map((entry) => (
          <div
            key={entry.status}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {entry.status}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{entry.count}</p>
          </div>
        ))}
      </div>

      {/* Trips */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Trips</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className={th}>Trip</th>
                <th className={th}>Route</th>
                <th className={th}>Vehicle</th>
                <th className={th}>Driver</th>
                <th className={th}>Planned start</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows columns={6} rows={6} />
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-sm text-destructive"
                  >
                    Couldn&apos;t load report.{" "}
                    <button
                      onClick={() => setFilter({ ...filter })}
                      className="font-medium underline underline-offset-2"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : report.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No trips in range
                  </td>
                </tr>
              ) : (
                report.rows.map((row) => (
                  <tr
                    key={row.tripId}
                    className="border-b border-border last:border-none transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-mono font-medium">{row.reference}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.origin} → {row.destination}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {row.vehicleNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.driverName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(row.scheduledStart)}
                    </td>
                    <td className="px-4 py-3">
                      <TripStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
