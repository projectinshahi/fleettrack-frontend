"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Sparkles, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuthStore } from "@/store/auth-store";
import { useTripOptions } from "@/hooks/use-trip-options";
import { useCustomerOptions } from "@/hooks/use-customer-options";
import { useClients } from "@/hooks/use-clients";
import { useRoutePreview } from "@/hooks/use-route-preview";
import { useOverlapCheck } from "@/hooks/use-overlap-check";
import { useRouteOptimization } from "@/hooks/use-route-optimization";
import TripRouteMap from "@/components/trips/trip-route-map";
import OverlapNotice from "@/components/trips/overlap-notice";
import TripOptimizationPanel from "@/components/trips/trip-optimization-panel";
import { CreateTripDto, MAX_TRIP_STOPS } from "@/types/trip";
import {
  addStop,
  moveStop,
  removeStop,
  reorderStops,
  StopDraft,
  updateStopAddress,
} from "@/lib/trip-stops";

type TripFormMode = "request" | "admin-create";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (dto: CreateTripDto) => Promise<unknown>;
  /**
   * "request" (default): CLIENT submits a trip REQUEST for its OWN client — no client
   *   selector, JWT-scoped resources. Existing behavior, unchanged (parent injects
   *   createTripRequest → POST /trip-requests).
   * "admin-create": ADMIN creates a trip DIRECTLY on behalf of a SELECTED client — a
   *   required client selector gates the resources (parent injects createTrip → POST
   *   /trips). Slice E supplies that ADMIN entry point.
   */
  mode?: TripFormMode;
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function TripFormModal({
  open,
  onClose,
  onCreate,
  mode = "request",
}: Props) {
  const isAdmin = mode === "admin-create";
  const { user } = useAuthStore();
  // Prefix for the label/control id pairs below (unique per mounted form).
  const fieldId = useId();

  // ADMIN direct-create: the selected client whose resources the form operates on.
  // Empty until the admin picks one; every resource selector stays disabled until then.
  const [adminClientId, setAdminClientId] = useState("");
  // Only ADMIN mode targets a specific client; request mode stays JWT-scoped (undefined),
  // so every option/overlap hook below behaves exactly as before for a CLIENT.
  const selectedClientId = isAdmin ? adminClientId || undefined : undefined;

  // Client list for the ADMIN selector — fetched only in admin mode so a CLIENT never
  // hits the ADMIN-only /clients endpoint.
  const { clients, loading: clientsLoading } = useClients(isAdmin && open);

  // `drivers` is deliberately not read: the driver is typed in (ADMIN) or assigned at
  // approval, so there is no driver list to select from any more.
  //
  // Options load only while the form is OPEN, and in admin mode only once a client is picked.
  // The modal stays mounted on its page, so these used to run on every page visit, and an
  // ADMIN with no client selected got a guaranteed 400 from /trips/drivers and /customers.
  const optionsEnabled = open && (!isAdmin || !!adminClientId);
  const { vehicles, loading: optionsLoading } = useTripOptions(
    selectedClientId,
    optionsEnabled,
  );
  const { customers, loading: customersLoading } = useCustomerOptions(
    selectedClientId,
    optionsEnabled,
  );
  const {
    points: routePoints,
    loading: routeLoading,
    generate: generateRoute,
    clear: clearRoute,
  } = useRoutePreview();

  const [reference, setReference] = useState("");
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  // ADMIN direct-create only: the driver is typed in, not picked. A CLIENT request
  // carries no driver at all — the ADMIN assigns one when approving it.
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [stops, setStops] = useState<StopDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [preOptimizeStops, setPreOptimizeStops] = useState<StopDraft[] | null>(
    null,
  );

  // Live double-booking checks (TM-09 / TM-10) — through the service, never the mock.
  const vehicleOverlap = useOverlapCheck("vehicle", {
    resourceId: vehicleId,
    scheduledStart: start,
    scheduledEnd: end,
    clientId: selectedClientId,
  });
  // No driver overlap check any more: a driver is now a typed name rather than a
  // selectable resource with an id, so there is nothing to check availability against.

  // Multi-stop route optimization (TM-06) — through the service, never the mock.
  const {
    result: optimization,
    loading: optimizing,
    optimize,
    clear: clearOptimization,
  } = useRouteOptimization();

  const scheduleValid = !!start && !!end && new Date(end) > new Date(start);

  // Need pickup + delivery to anchor the path and >= 2 filled stops to reorder.
  const canOptimize =
    !!pickup &&
    !!delivery &&
    stops.length >= 2 &&
    stops.every((s) => s.address.trim().length > 0);

  const previewOrder = (nextStops: StopDraft[]) =>
    generateRoute({
      origin: pickup,
      destination: delivery,
      stops: nextStops.map((s) => s.address.trim()).filter((a) => a.length > 0),
    });

  const handleOptimize = async () => {
    const res = await optimize({
      origin: pickup,
      destination: delivery,
      stops: stops.map((s) => s.address.trim()),
    });
    if (!res) return;

    setPreOptimizeStops(stops);
    const reordered = reorderStops(
      stops,
      res.optimizedStops.map((s) => s.originalIndex),
    );
    setStops(reordered);
    previewOrder(reordered); // reuse the existing route preview/map
  };

  const handleUndoOptimize = () => {
    if (preOptimizeStops) {
      setStops(preOptimizeStops);
      previewOrder(preOptimizeStops);
    }
    setPreOptimizeStops(null);
    clearOptimization();
  };

  const resetForm = () => {
    setAdminClientId("");
    setReference("");
    setPickup("");
    setDelivery("");
    setStart("");
    setEnd("");
    setVehicleId("");
    setDriverName("");
    setDriverPhone("");
    setCustomerId("");
    setNotes("");
    setStops([]);
    setPreOptimizeStops(null);
    clearRoute();
    clearOptimization();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ADMIN direct-create requires a selected client first — it is the source of the
    // owning clientId AND of every resource the form listed (backend re-validates).
    if (isAdmin && !adminClientId) {
      toast.error("Please select a client");
      return;
    }

    if (!reference || !pickup || !delivery || !start || !end || !vehicleId) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Driver is ADMIN-only and mandatory there; a CLIENT request has no driver at all.
    if (isAdmin && !driverName.trim()) {
      toast.error("Driver name is required");
      return;
    }
    if (isAdmin && !driverPhone.trim()) {
      toast.error("Driver phone is required");
      return;
    }

    if (new Date(end) <= new Date(start)) {
      toast.error("Planned end must be after planned start");
      return;
    }

    if (vehicleOverlap.hasOverlap) {
      toast.error("This vehicle is already booked for an overlapping schedule");
      return;
    }

    const dto: CreateTripDto = {
      reference,
      // ADMIN: the selected client (backend validates it owns the resources). CLIENT:
      // its own id for API shape — the backend ignores it and uses the JWT.
      clientId: isAdmin ? adminClientId : user?.id ?? "",
      vehicleId,
      // Driver only travels on the ADMIN direct-create payload. The CLIENT request omits
      // it entirely, and the backend nulls anything a client sends anyway.
      ...(isAdmin
        ? {
            driverName: driverName.trim(),
            driverPhone: driverPhone.trim(),
          }
        : {}),
      customerId: customerId || undefined,
      origin: pickup,
      destination: delivery,
      stops: stops
        .map((s) => ({ address: s.address.trim() }))
        .filter((s) => s.address.length > 0),
      scheduledStart: new Date(start).toISOString(),
      scheduledEnd: new Date(end).toISOString(),
      notes: notes || undefined,
    };

    try {
      setSubmitting(true);
      await onCreate(dto);
      toast.success(
        isAdmin
          ? "Trip created successfully"
          : "Trip request submitted successfully",
      );
      resetForm();
      onClose();
    } catch (err) {
      console.log(err);
      if (err instanceof Error && err.message === "VEHICLE_OVERLAP") {
        toast.error(
          "This vehicle is already booked for an overlapping schedule",
        );
      } else if (err instanceof Error && err.message === "DRIVER_OVERLAP") {
        toast.error(
          "This driver is already booked for an overlapping schedule",
        );
      } else {
        toast.error(
          isAdmin ? "Failed to create trip" : "Failed to submit trip request",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {isAdmin ? "Create Trip" : "Request Trip"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Create a trip directly on behalf of a selected client."
              : "Submit a trip request for admin approval. No trip is created until an admin approves it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* ADMIN direct-create: pick the client first — it scopes every resource
              selector below and becomes the trip's owning client. */}
          {isAdmin && (
            <div>
              <label htmlFor={`${fieldId}-client`} className="mb-1 block text-sm font-medium">Client</label>
              <select
                id={`${fieldId}-client`}
                value={adminClientId}
                onChange={(e) => {
                  setAdminClientId(e.target.value);
                  // Changing client invalidates any resource chosen for the previous
                  // one — clear them so a stale id can't be submitted. (Slice C option
                  // hooks discard the previous client's in-flight responses.)
                  setVehicleId("");
                  setCustomerId("");
                }}
                disabled={clientsLoading || clients.length === 0}
                className={inputClass}
              >
                <option value="">
                  {clientsLoading
                    ? "Loading clients…"
                    : clients.length === 0
                      ? "No clients found"
                      : "Select a client"}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor={`${fieldId}-reference`} className="mb-1 block text-sm font-medium">Reference</label>
            <input
              id={`${fieldId}-reference`}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="TRIP-2026-0001"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${fieldId}-pickup`} className="mb-1 block text-sm font-medium">
                Pickup address
              </label>
              <input
                id={`${fieldId}-pickup`}
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Pickup location"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={`${fieldId}-delivery`} className="mb-1 block text-sm font-medium">
                Delivery address
              </label>
              <input
                id={`${fieldId}-delivery`}
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                placeholder="Delivery location"
                className={inputClass}
              />
            </div>
          </div>

          {/* Stops (optional, ordered — max 10) */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">Stops (optional)</span>
              <span className="text-xs text-muted-foreground">
                {stops.length}/{MAX_TRIP_STOPS}
              </span>
            </div>

            {stops.length > 0 && (
              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-xs text-muted-foreground">
                      {index + 1}
                    </span>
                    <input
                      value={stop.address}
                      onChange={(e) =>
                        setStops((prev) =>
                          updateStopAddress(prev, stop.id, e.target.value),
                        )
                      }
                      placeholder={`Stop ${index + 1} address`}
                      aria-label={`Stop ${index + 1} address`}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setStops((prev) => moveStop(prev, index, -1))
                      }
                      disabled={index === 0}
                      aria-label="Move stop up"
                      className="shrink-0 rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-40"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStops((prev) => moveStop(prev, index, 1))
                      }
                      disabled={index === stops.length - 1}
                      aria-label="Move stop down"
                      className="shrink-0 rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-40"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStops((prev) => removeStop(prev, stop.id))
                      }
                      aria-label="Remove stop"
                      className="shrink-0 rounded-lg border border-border p-2 text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStops((prev) => addStop(prev))}
                disabled={stops.length >= MAX_TRIP_STOPS}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add stop
              </button>

              <button
                type="button"
                onClick={handleOptimize}
                disabled={!canOptimize || optimizing}
                className="inline-flex items-center gap-1 rounded-lg border border-primary/40 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {optimizing ? "Optimizing…" : "Optimize route"}
              </button>
            </div>

            {optimization && preOptimizeStops && (
              <TripOptimizationPanel
                result={optimization}
                originalStops={preOptimizeStops.map((s) => s.address)}
                onUndo={handleUndoOptimize}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${fieldId}-start`} className="mb-1 block text-sm font-medium">
                Planned start
              </label>
              <input
                id={`${fieldId}-start`}
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={`${fieldId}-end`} className="mb-1 block text-sm font-medium">
                Planned end
              </label>
              <input
                id={`${fieldId}-end`}
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${fieldId}-vehicle`} className="mb-1 block text-sm font-medium">Vehicle</label>
              <select
                id={`${fieldId}-vehicle`}
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={optionsLoading || (isAdmin && !adminClientId)}
                className={inputClass}
              >
                <option value="">
                  {isAdmin && !adminClientId
                    ? "Select a client first"
                    : "Select vehicle"}
                </option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber}
                    {v.vehicleName ? ` — ${v.vehicleName}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {/* Driver — ADMIN direct-create only. A CLIENT submits no driver; the ADMIN
                enters one in the approval modal when the request is reviewed. */}
            {isAdmin && (
              <div>
                <label htmlFor={`${fieldId}-driver-name`} className="mb-1 block text-sm font-medium">
                  Driver Name <span className="text-destructive">*</span>
                </label>
                <input
                  id={`${fieldId}-driver-name`}
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {isAdmin && (
            <div>
              <label htmlFor={`${fieldId}-driver-phone`} className="mb-1 block text-sm font-medium">
                Driver Phone <span className="text-destructive">*</span>
              </label>
              <input
                id={`${fieldId}-driver-phone`}
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className={inputClass}
              />
            </div>
          )}

          {/* Customer (optional) — links the trip to a customer (CUS-07.1) */}
          <div>
            <label htmlFor={`${fieldId}-customer`} className="mb-1 block text-sm font-medium">
              Customer (optional)
            </label>
            <select
              id={`${fieldId}-customer`}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={customersLoading || (isAdmin && !adminClientId)}
              className={inputClass}
            >
              <option value="">
                {isAdmin && !adminClientId
                  ? "Select a client first"
                  : "No customer"}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle & driver availability (overlap validation) */}
          <OverlapNotice
            label="Vehicle"
            show={!!vehicleId && scheduleValid}
            checking={vehicleOverlap.checking}
            hasOverlap={vehicleOverlap.hasOverlap}
            conflicts={vehicleOverlap.conflicts}
          />

          <div>
            <label htmlFor={`${fieldId}-notes`} className="mb-1 block text-sm font-medium">
              Notes (optional)
            </label>
            <textarea
              id={`${fieldId}-notes`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special instructions"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Route preview (geocoded) */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">Route preview</span>
              <button
                type="button"
                onClick={() =>
                  generateRoute({
                    origin: pickup,
                    destination: delivery,
                    stops: stops
                      .map((s) => s.address.trim())
                      .filter((a) => a.length > 0),
                  })
                }
                disabled={!pickup || !delivery}
                className="text-xs font-medium text-primary hover:underline disabled:no-underline disabled:opacity-50"
              >
                Preview route
              </button>
            </div>

            {routePoints.length > 0 && (
              <TripRouteMap points={routePoints} loading={routeLoading} />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                vehicleOverlap.hasOverlap ||
                (isAdmin && !adminClientId)
              }
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting
                ? isAdmin
                  ? "Creating..."
                  : "Submitting..."
                : isAdmin
                  ? "Create Trip"
                  : "Submit request"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
