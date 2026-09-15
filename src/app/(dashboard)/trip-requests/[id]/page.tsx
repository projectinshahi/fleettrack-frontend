"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardCheck,
  Info,
  MapPin,
} from "lucide-react";

import { useTripRequests } from "@/hooks/use-trip-requests";
import { DetailSkeleton } from "@/components/ui/skeletons/detail-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import TripRequestStatusBadge from "@/components/trip-requests/trip-request-status-badge";
import { STATUS_CHIP } from "@/components/ui/status-chip";
import TripRequestReviewActions from "@/components/trip-requests/trip-request-review-actions";
import { TripRequestStatus } from "@/types/trip-request";

function fmt(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

const panel = "rounded-lg border border-border bg-card p-5";

export default function TripRequestDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { requests, loading, error, role, approve, reject, refresh } =
    useTripRequests();

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message="Couldn't load this request." onRetry={refresh} />
      </div>
    );
  }

  const request = requests.find((r) => r.id === id);

  if (!request) {
    return (
      <div className="space-y-6">
        <Link
          href="/trip-requests"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trip Requests
        </Link>
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          Trip request not found
        </div>
      </div>
    );
  }

  const isAdmin = role === "ADMIN";
  const isPending = request.status === TripRequestStatus.PENDING;
  const durationLabel =
    request.durationMins != null
      ? `${Math.floor(request.durationMins / 60)}h ${
          request.durationMins % 60
        }m`
      : "—";

  return (
    <div className="space-y-6">
      <Link
        href="/trip-requests"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Trip Requests
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">{request.reference ?? "Trip Request"}</h1>
          <TripRequestStatusBadge status={request.status} />
        </div>
        <p className="text-muted-foreground">
          Submitted {fmt(request.createdAt)}
          {isAdmin ? ` · ${request.client.name}` : ""}
        </p>
      </div>

      {/* Pending banner */}
      {isPending && (
        <div className={`rounded-lg border px-5 py-4 text-sm ${STATUS_CHIP.attn}`}>
          {isAdmin
            ? "This request is awaiting your review."
            : "This request is waiting for admin review."}
        </div>
      )}

      {/* Admin review controls (ADMIN + PENDING only) */}
      {isAdmin && isPending && (
        <div className={panel}>
          <h3 className="mb-4 text-sm font-semibold">Review</h3>
          <TripRequestReviewActions
            request={request}
            onApprove={(driver) => approve(request.id, driver)}
            onReject={(reason) => reject(request.id, reason)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Request information */}
        <div className={panel}>
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Request information</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Reference" value={request.reference ?? "—"} />
            <Field
              label="Status"
              value={<TripRequestStatusBadge status={request.status} />}
            />
            <Field label="Client" value={request.client.name} />
            <Field
              label="Vehicle"
              value={
                request.vehicle
                  ? `${request.vehicle.vehicleNumber}${
                      request.vehicle.vehicleName
                        ? ` · ${request.vehicle.vehicleName}`
                        : ""
                    }`
                  : "—"
              }
            />
            <Field label="Driver" value={request.driverName ?? "—"} />
            <Field label="Driver phone" value={request.driverPhone ?? "—"} />
            <Field label="Customer" value={request.customer?.name ?? "—"} />
          </div>
        </div>

        {/* Route */}
        <div className={panel}>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Route</h3>
          </div>
          {/* The route map's shape language: a filled disc for the origin, a neutral disc per
              stop, a hollow ring for the destination. Hue never tells them apart. */}
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Origin
                </p>
                <p className="text-sm font-medium">{request.origin}</p>
              </div>
            </li>
            {/* stops is null on a request stored without one; the UI always sends [] */}
            {(request.stops ?? []).map((s, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-status-neutral" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Stop {i + 1}
                  </p>
                  <p className="text-sm font-medium">{s.address}</p>
                </div>
              </li>
            ))}
            <li className="flex gap-3">
              <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Destination
                </p>
                <p className="text-sm font-medium">{request.destination}</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Schedule */}
        <div className={panel}>
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Schedule</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Scheduled start" value={fmt(request.scheduledStart)} />
            <Field label="Scheduled end" value={fmt(request.scheduledEnd)} />
            <Field label="Duration" value={durationLabel} />
            <Field
              label="Distance"
              value={
                request.distanceKm != null ? `${request.distanceKm} km` : "—"
              }
            />
          </div>
        </div>

        {/* Additional information */}
        <div className={panel}>
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Additional information</h3>
          </div>
          <div className="space-y-4">
            <Field label="Notes" value={request.notes ?? "—"} />
            <Field label="Created" value={fmt(request.createdAt)} />
          </div>
        </div>
      </div>

      {/* Review information (reviewed requests) */}
      {!isPending && (
        <div className={panel}>
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Review information</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Outcome"
              value={<TripRequestStatusBadge status={request.status} />}
            />
            <Field label="Reviewed by" value={request.reviewedBy?.name ?? "—"} />
            <Field label="Reviewed at" value={fmt(request.reviewedAt)} />
            {request.status === TripRequestStatus.APPROVED && (
              <Field
                label="Resulting trip"
                value={request.trip?.reference ?? "—"}
              />
            )}
          </div>

          {request.status === TripRequestStatus.REJECTED && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Rejection reason
              </p>
              <p className="mt-1 text-sm font-medium text-destructive">
                {request.rejectionReason ?? "—"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
