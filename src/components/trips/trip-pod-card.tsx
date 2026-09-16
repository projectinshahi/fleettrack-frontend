"use client";

import { useState } from "react";
import { PackageCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { usePod } from "@/hooks/use-pod";
import { captureLocation, CapturedLocation } from "@/lib/geolocation";
import FileGallery from "@/components/upload/file-gallery";
import PodSignature from "./pod-signature";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeletons/card-skeleton";
import { STATUS_CHIP } from "@/components/ui/status-chip";

interface Props {
  tripId: string;
  /** CLIENT owns delivery confirmation (ADMIN is read-only), mirroring trip management. */
  canEdit: boolean;
}

function formatDateTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : "—";
}

/**
 * Proof of delivery (POD-01…06). Delivery-confirmation record (recipient / notes /
 * delivered-at) + proof media. Media reuses the shared upload infrastructure: photos via
 * <FileGallery category="POD_PHOTO"> and signature via <PodSignature> — no POD-specific
 * upload or storage code.
 */
export default function TripPodCard({ tripId, canEdit }: Props) {
  const { pod, loading, error, savePod } = usePod(tripId);
  const [editing, setEditing] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const confirmed = Boolean(pod?.deliveredAt);

  const openEdit = () => {
    setRecipientName(pod?.recipientName ?? "");
    setNotes(pod?.notes ?? "");
    setEditing(true);
  };

  const handleSave = async (confirm: boolean) => {
    try {
      setSaving(true);
      const firstConfirm = confirm && !confirmed;

      // POD-04.1 — capture the delivery location ONLY at the confirmation moment (never
      // on plain edits, so we don't re-prompt). Optional + non-blocking: a null fix
      // (denied / unavailable / timeout / unsupported) still confirms the delivery.
      let location: CapturedLocation | null = null;
      if (firstConfirm) {
        location = await captureLocation();
      }

      await savePod({
        recipientName: recipientName || undefined,
        notes: notes || undefined,
        // First confirmation stamps the delivery time (drives the timeline event).
        ...(firstConfirm ? { deliveredAt: new Date().toISOString() } : {}),
        ...(location
          ? {
              deliveredLat: location.lat,
              deliveredLng: location.lng,
              deliveredLocationAccuracy: location.accuracy,
            }
          : {}),
      });

      if (firstConfirm) {
        toast.success(
          location
            ? "Delivery confirmed — location captured"
            : "Delivery confirmed (location unavailable)",
        );
      } else {
        toast.success("Saved");
      }
      setEditing(false);
    } catch (err) {
      console.log(err);
      toast.error("Failed to save proof of delivery");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Proof of Delivery</h3>
          {confirmed && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_CHIP.ok}`}>
              <CheckCircle2 className="h-3 w-3" />
              Confirmed
            </span>
          )}
        </div>
        {canEdit && !editing && !error && (
          <button
            type="button"
            onClick={openEdit}
            className="text-sm font-medium text-primary-ink hover:underline"
          >
            {confirmed ? "Edit" : "Confirm delivery"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-4"><CardSkeleton /></div>
      ) : error ? (
        // No confirm or edit while the record failed to load: saving from that empty state
        // would stamp a NEW delivery time and location over a delivery already confirmed.
        <p className="mt-4 text-sm text-destructive">
          Couldn&apos;t load proof of delivery. Reload the page to try again.
        </p>
      ) : (
        <div className="mt-4 space-y-6">
          {/* Confirmation details / form */}
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Received by
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Recipient name"
                  aria-label="Received by"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Delivery notes (optional)"
                  aria-label="Notes"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => handleSave(!confirmed)}
                  isLoading={saving}
                  className="px-4"
                >
                  {confirmed ? "Save" : "Confirm delivery"}
                </Button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : confirmed ? (
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Received by</dt>
                <dd className="font-medium">{pod?.recipientName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Delivered at</dt>
                <dd className="font-medium">
                  {formatDateTime(pod?.deliveredAt ?? null)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Location</dt>
                <dd className="font-medium">
                  {pod?.deliveredLat != null && pod?.deliveredLng != null ? (
                    <span>
                      {pod.deliveredLat.toFixed(5)}, {pod.deliveredLng.toFixed(5)}
                      {pod.deliveredLocationAccuracy != null
                        ? ` (±${Math.round(pod.deliveredLocationAccuracy)} m)`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not captured</span>
                  )}
                </dd>
              </div>
              {pod?.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Notes</dt>
                  <dd>{pod.notes}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Delivery not yet confirmed.
            </p>
          )}

          {/* Proof media — reuses the shared upload infrastructure */}
          <FileGallery
            tripId={tripId}
            category="POD_PHOTO"
            canEdit={canEdit}
            title="Delivery photos"
            emptyLabel="No photos uploaded"
          />

          <PodSignature tripId={tripId} canEdit={canEdit} />
        </div>
      )}
    </div>
  );
}
