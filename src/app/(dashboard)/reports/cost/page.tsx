"use client";

import { useState } from "react";
import { FileBarChart, Download } from "lucide-react";
import { toast } from "sonner";

import { useCostReport } from "@/hooks/use-cost-report";
import { exportCostReport } from "@/services/cost-report.service";
import { downloadResponse } from "@/lib/download";
import { TableSkeletonRows } from "@/components/ui/skeletons/table-skeleton";
import TripStatusBadge from "@/components/trips/trip-status-badge";

function formatMoney(value: number): string {
  return Math.round(value).toLocaleString();
}

function formatVariance(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded.toLocaleString()}`;
}

function varianceClass(value: number): string {
  if (value > 0) return "text-status-fault-ink";
  if (value < 0) return "text-status-ok-ink";
  return "text-muted-foreground";
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const th =
  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground";
const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function CostReportPage() {
  const { report, filter, setFilter, loading, error } = useCostReport();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const apply = () =>
    setFilter({ from: from || undefined, to: to || undefined });

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportCostReport(filter);
      if (!res.ok) throw new Error("Export failed");
      await downloadResponse(res, "trip-cost-report.pdf");
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
          <div className="rounded-lg border border-border bg-card p-3">
            <FileBarChart className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="page-title">Cost Report</h1>
            <p className="mt-1 text-muted-foreground">
              Planned vs actual trip costs
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
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <input
            type="date"
            aria-label="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <input
            type="date"
            aria-label="To"
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

      {/* Totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Estimated
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {loading ? "…" : error ? "—" : formatMoney(report.totals.estimatedTotal)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Actual
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {loading ? "…" : error ? "—" : formatMoney(report.totals.actualTotal)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Variance
          </p>
          <p
            className={`mt-2 text-2xl font-semibold tabular-nums ${varianceClass(
              report.totals.variance,
            )}`}
          >
            {loading ? "…" : error ? "—" : formatVariance(report.totals.variance)}
          </p>
        </div>
      </div>

      {/* By component */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">By component</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className={th}>Component</th>
                <th className={`${th} text-right`}>Estimated</th>
                <th className={`${th} text-right`}>Actual</th>
                <th className={`${th} text-right`}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {report.byComponent.map((c) => (
                <tr key={c.component} className="border-b border-border last:border-none">
                  <td className="px-4 py-3">{titleCase(c.component)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(c.estimated)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(c.actual)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${varianceClass(
                      c.variance,
                    )}`}
                  >
                    {formatVariance(c.variance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per trip */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Trips</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className={th}>Trip</th>
                <th className={th}>Route</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Estimated</th>
                <th className={`${th} text-right`}>Actual</th>
                <th className={`${th} text-right`}>Variance</th>
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
                    <td className="px-4 py-3">
                      <TripStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(row.estimatedTotal)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(row.actualTotal)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${varianceClass(
                        row.variance,
                      )}`}
                    >
                      {formatVariance(row.variance)}
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
