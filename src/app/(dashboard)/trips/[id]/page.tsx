"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";

import { useTrip } from "@/hooks/use-trip";
import { canEditStops, isEtaActive, TripStatus } from "@/types/trip";
import TripCostCard from "@/components/trips/trip-cost-card";
import TripPodCard from "@/components/trips/trip-pod-card";
import TripDetailsCard from "@/components/trips/trip-details-card";
import TripStatusControls from "@/components/trips/trip-status-controls";
import TripStopsModal from "@/components/trips/trip-stops-modal";
import TripTimeline from "@/components/trips/trip-timeline";
import TripMonitoringPanel from "@/components/trips/trip-monitoring-panel";
import TripPlayback from "@/components/trips/trip-playback";

export default function TripDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const {
    trip,
    timeline,
    route,
    progress,
    eta,
    vehiclePosition,
    live,
    loading,
    error,
    permissions,
    changeStatus,
    saveStops,
    completeStop,
  } = useTrip(id);

  const [stopsOpen, setStopsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Link
        href="/trips"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Trips
      </Link>

      {loading ? (
        <p className="text-muted-foreground">Loading trip...</p>
      ) : error || !trip ? (
        <p className="text-muted-foreground">{error ?? "Trip not found"}</p>
      ) : (
        <>
          <div>
            <h1 className="page-title">
              Trip {trip.reference}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {trip.origin} → {trip.destination}
            </p>
          </div>

          {trip.status === TripStatus.COMPLETED ? (
            <TripPlayback tripId={id} route={route} />
          ) : (
            <TripMonitoringPanel
              trip={trip}
              route={route}
              progress={progress}
              eta={eta}
              vehiclePosition={vehiclePosition}
              live={live}
            />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {permissions.canEdit && canEditStops(trip.status) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStopsOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    <MapPin className="h-4 w-4" />
                    Manage stops
                  </button>
                </div>
              )}
              <TripDetailsCard
                trip={trip}
                canComplete={
                  permissions.canManageLifecycle && isEtaActive(trip.status)
                }
                onCompleteStop={completeStop}
              />
              <TripStatusControls
                trip={trip}
                permissions={permissions}
                onChange={changeStatus}
              />
              <TripCostCard tripId={id} canEdit={permissions.canEdit} />
              <TripPodCard tripId={id} canEdit={permissions.canEdit} />
            </div>

            <div className="lg:col-span-1">
              <TripTimeline events={timeline} />
            </div>
          </div>

          {stopsOpen && (
            <TripStopsModal
              open
              onClose={() => setStopsOpen(false)}
              trip={trip}
              onSave={saveStops}
            />
          )}
        </>
      )}
    </div>
  );
}
