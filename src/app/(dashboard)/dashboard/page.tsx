"use client";

import {
  Navigation,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  Percent,
} from "lucide-react";

import ActiveVehicles from "@/components/dashboard/active-vehicles";
import EtaOverview from "@/components/dashboard/eta-overview";
import FleetStatusChart from "@/components/dashboard/fleet-status-chart";
import LiveOperations from "@/components/dashboard/live-operations";
import StatsCard from "@/components/dashboard/stats-card";
import WeeklyActivityChart from "@/components/dashboard/weekly-activity-chart";

import { useDashboard } from "@/hooks/use-dashboard";
import {
  DashboardFleetSkeleton,
  DashboardKpiSkeleton,
} from "@/components/ui/skeletons/dashboard-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useAuthStore } from "@/store/auth-store";

// One bordered strip per KPI group. The strip is painted --border and its tiles --card, so
// the 1px gap between tiles IS the divider: correct at every column count, with no per-tile
// border to double up or orphan when the grid wraps.
const STRIP =
  "grid min-w-0 grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border";

const GROUP_LABEL =
  "mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export default function DashboardPage() {
  const {
    stats,
    vehicles,
    tripSummary,
    deliveryMetrics,
    weeklyActivity,
    loading,
    error,
    reload,
  } = useDashboard();

  // Trip pages are CLIENT-only (lib/role-routes.ts), so the drill-down links render only for a
  // CLIENT; an ADMIN following one was bounced straight back to this dashboard.
  const { user } = useAuthStore();
  const tripLink = (href: string) =>
    user?.role === "CLIENT" ? href : undefined;

  // Page order runs: operating state -> current operations -> fleet -> history.
  //
  // Only the aggregate blocks wait on useDashboard. LiveOperations and EtaOverview own their
  // own loading, error and empty states and fetch on mount, so they sit OUTSIDE both gates;
  // gating them would hold their requests until all five aggregate calls had finished.
  //
  // KPI tones follow the locked status semantics: in-transit trips are in progress (signal),
  // anything delayed is attention (amber), offline is fault. Only the tone of the cue changed;
  // every value, label, description and link below is exactly as it was.
  return (
    <div className="space-y-6">
      {/* Header: static, so it no longer disappears while loading or on error */}
      <div>
        <h1 className="page-title">Dashboard Overview</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your fleet performance and activity
        </p>
      </div>

      {loading ? (
        <DashboardKpiSkeleton />
      ) : error ? (
        <ErrorState message="Couldn't load the dashboard." onRetry={reload} />
      ) : (
        <div className="space-y-6">
          {/* Trip summary (DSH-01): each tile drills down to the filtered trip list */}
          <div>
            <h2 className={GROUP_LABEL}>Trip summary</h2>

            <div className={`${STRIP} sm:grid-cols-2 xl:grid-cols-4`}>
              <StatsCard
                title="Active Trips"
                value={tripSummary?.active ?? 0}
                description="In transit now"
                tone="signal"
                icon={Navigation}
                href={tripLink("/trips?status=active")}
              />

              <StatsCard
                title="Upcoming Trips"
                value={tripSummary?.upcoming ?? 0}
                description="Planned & assigned"
                icon={CalendarClock}
                href={tripLink("/trips?status=upcoming")}
              />

              <StatsCard
                title="Delayed Trips"
                value={tripSummary?.delayed ?? 0}
                description="Behind schedule"
                tone="attn"
                icon={AlertTriangle}
                href={tripLink("/trips?status=delayed")}
              />

              <StatsCard
                title="Completed Trips"
                value={tripSummary?.completed ?? 0}
                description="Finished"
                icon={CheckCircle2}
                href={tripLink("/trips?status=completed")}
              />
            </div>
          </div>

          {/* Delivery performance (DSH-04) */}
          <div>
            <h2 className={GROUP_LABEL}>Delivery performance</h2>

            <div className={`${STRIP} sm:grid-cols-2 lg:grid-cols-3`}>
              <StatsCard
                title="On-time Deliveries"
                value={deliveryMetrics?.onTime ?? 0}
                description="Arrived by schedule"
                tone="ok"
                icon={CheckCircle2}
              />

              <StatsCard
                title="Delayed Deliveries"
                value={deliveryMetrics?.delayed ?? 0}
                description="Arrived late"
                tone="attn"
                icon={AlertTriangle}
              />

              <StatsCard
                title="Completed Trips"
                value={deliveryMetrics?.completed ?? 0}
                description="Total delivered"
                icon={PackageCheck}
              />

              <StatsCard
                title="Completion Rate"
                value={`${deliveryMetrics?.completionRate ?? 0}%`}
                description="Completed of all trips"
                icon={Percent}
              />

              <StatsCard
                title="On-time Rate"
                value={`${deliveryMetrics?.onTimeRate ?? 0}%`}
                description="On-time of completed"
                tone="ok"
                icon={Percent}
              />

              <StatsCard
                title="Delayed Rate"
                value={`${deliveryMetrics?.delayedRate ?? 0}%`}
                description="Delayed of completed"
                tone="attn"
                icon={Percent}
              />
            </div>
          </div>

          {/* Fleet */}
          <div>
            <h2 className={GROUP_LABEL}>Fleet</h2>

            <div className={`${STRIP} md:grid-cols-3`}>
              <StatsCard
                title="Total Vehicles"
                value={Number(stats?.totalVehicles) || 0}
                description="Fleet size"
              />

              <StatsCard
                title="Active Vehicles"
                value={Number(stats?.activeVehicles) || 0}
                description="Currently moving"
                tone="ok"
              />

              <StatsCard
                title="Offline Vehicles"
                value={Number(stats?.offlineVehicles) || 0}
                description="No signal"
                tone="fault"
              />
            </div>
          </div>
        </div>
      )}

      {/* Live operations: ongoing trips + live driver/vehicle status (DSH-02) */}
      <LiveOperations />

      {/* Active trip ETAs (DSH-03) */}
      <EtaOverview />

      {loading ? (
        <DashboardFleetSkeleton />
      ) : error ? null : (
        <>
          {/* Fleet status beside the vehicles it summarises; this also fills the row that
              Active Vehicles used to occupy alone at half width. */}
          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
            <FleetStatusChart
              activeVehicles={Number(stats?.activeVehicles) || 0}
              offlineVehicles={Number(stats?.offlineVehicles) || 0}
              idleVehicles={Number(stats?.idleVehicles) || 0}
            />

            <div className="min-w-0 xl:col-span-2">
              <ActiveVehicles vehicles={vehicles} />
            </div>
          </div>

          {/* Supporting history, last */}
          <WeeklyActivityChart days={weeklyActivity} />
        </>
      )}
    </div>
  );
}
