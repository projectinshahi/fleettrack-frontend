"use client";

import { useState } from "react";
import { Clock, Download } from "lucide-react";
import { toast } from "sonner";

import { useDelayReport } from "@/hooks/use-delay-report";
import { exportDelayStats } from "@/services/delay-report.service";
import { downloadResponse } from "@/lib/download";
import { DelayPeriod, DelayStatBucket } from "@/types/delay-report";
import { ErrorState } from "@/components/ui/error-state";

const th =
  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground";
const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function BucketTable({
  title,
  buckets,
}: {
  title: string;
  buckets: DelayStatBucket[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className={th}>Name</th>
              <th className={`${th} text-right`}>Delays</th>
              <th className={`${th} text-right`}>Minutes</th>
            </tr>
          </thead>
          <tbody>
            {buckets.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  No data
                </td>
              </tr>
            ) : (
              buckets.map((bucket) => (
                <tr
                  key={bucket.key}
                  className="border-b border-border last:border-none"
                >
                  <td className="px-4 py-3">{bucket.label}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{bucket.count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {bucket.totalMinutes}
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

export default function DelayReportPage() {
  const { stats, filter, setFilter, loading, error } = useDelayReport();
  const [period, setPeriod] = useState<DelayPeriod>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const apply = () =>
    setFilter({ period, from: from || undefined, to: to || undefined });

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportDelayStats(filter);
      if (!res.ok) throw new Error("Export failed");
      await downloadResponse(res, "delay-analysis-report.pdf");
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
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Delay Report</h1>
            <p className="mt-1 text-muted-foreground">
              Delay analysis by category, driver, route and period
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
            Group by
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as DelayPeriod)}
            className={inputClass}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
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

      {error && !loading ? (
        <ErrorState
          message="Couldn't load the delay report."
          onRetry={() => setFilter({ ...filter })}
        />
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total delays
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {loading ? "…" : stats.total.count}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total minutes
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {loading ? "…" : stats.total.totalMinutes}
              </p>
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BucketTable title="By category" buckets={stats.byCategory} />
            <BucketTable title="By driver" buckets={stats.byDriver} />
            <BucketTable title="By route" buckets={stats.byRoute} />
            <BucketTable title="By period" buckets={stats.byPeriod} />
          </div>
        </>
      )}
    </div>
  );
}
