"use client";

import {
  GeoPoint,
  RoutePoint,
  Trip,
  TripEta,
  TripProgress,
  TripStatus,
} from "@/types/trip";
import TripStatusBadge from "./trip-status-badge";
import TripRouteMap from "./trip-route-map";
import TripDeviationAlert from "./trip-deviation-alert";
import TripProgressCard from "./trip-progress";
import TripEtaCard from "./trip-eta";

interface Props {
  trip: Trip;
  route: RoutePoint[];
  progress: TripProgress | null;
  eta: TripEta | null;
  vehiclePosition: GeoPoint | null;
  /** True once the live vehicle feed has updated progress/ETA. */
  live?: boolean;
}

/**
 * Per-trip ETA monitoring panel (ETA-07.1 / ETA-07.2). Composes the existing trip
 * data into a single surface — trip status, current vehicle location, live route
 * map, route progress + remaining distance, and destination ETA — reusing the
 * existing components and the use-trip hook state (which already loads from the
 * APIs and refreshes from the vehicleLocationUpdate socket). No new data, API or
 * socket. ETA is omitted for CANCELLED trips (mirrors the detail page rule).
 */
export default function TripMonitoringPanel({
  trip,
  route,
  progress,
  eta,
  vehiclePosition,
  live = false,
}: Props) {
  const showEta = trip.status !== TripStatus.CANCELLED;

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="section-title">Trip monitoring</h2>
          <TripStatusBadge status={trip.status} />
        </div>

        <span className="text-xs text-muted-foreground">
          {vehiclePosition
            ? `Location: ${vehiclePosition.lat.toFixed(5)}, ${vehiclePosition.lng.toFixed(5)}`
            : "Location: awaiting live position"}
        </span>
      </div>

      <TripRouteMap
        points={route}
        vehiclePosition={vehiclePosition}
        deviating={progress?.isDeviating}
      />

      <TripDeviationAlert progress={progress} />

      {showEta ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TripProgressCard progress={progress} live={live} />
          <TripEtaCard eta={eta} live={live} />
        </div>
      ) : (
        <TripProgressCard progress={progress} live={live} />
      )}
    </section>
  );
}
