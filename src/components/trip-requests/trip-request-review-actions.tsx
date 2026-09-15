"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { apiErrorMessage } from "@/lib/fetcher";
import { TripRequest } from "@/types/trip-request";

interface Props {
  request: TripRequest;
  onApprove: (driver: {
    driverName: string;
    driverPhone: string;
  }) => Promise<unknown>;
  onReject: (reason: string) => Promise<unknown>;
}

const modalInputClass =
  "mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

/**
 * ADMIN approve/reject controls for a PENDING request. Uses the shared ConfirmDialog for
 * both actions (approve = primary confirm, reject = destructive + required reason input)
 * and the app's toast system — never a browser alert(). The parent renders this only for
 * ADMIN + PENDING, so already-reviewed requests show no controls.
 */
export default function TripRequestReviewActions({
  request,
  onApprove,
  onReject,
}: Props) {
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    if (submitting) return;
    setDialog(null);
    setReason("");
    setDriverName("");
    setDriverPhone("");
  };

  const handleApprove = async () => {
    // The client never supplies a driver, so approval is where one is assigned — both
    // fields are required and validated before the request is sent.
    const name = driverName.trim();
    const phone = driverPhone.trim();
    if (!name) {
      toast.error("Driver name is required");
      return;
    }
    if (!phone) {
      toast.error("Driver phone is required");
      return;
    }

    setSubmitting(true);
    try {
      await onApprove({ driverName: name, driverPhone: phone });
      toast.success(`Request ${request.reference ?? ""} approved`.trim());
      setDialog(null);
      setDriverName("");
      setDriverPhone("");
    } catch (err) {
      console.error(err);
      toast.error(
        apiErrorMessage(err, "Couldn't approve this request"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setSubmitting(true);
    try {
      await onReject(reason.trim());
      toast.success(`Request ${request.reference ?? ""} rejected`.trim());
      setDialog(null);
      setReason("");
    } catch (err) {
      console.log(err);
      toast.error("Couldn't reject this request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => setDialog("approve")}
        >
          <Check className="h-4 w-4" />
          Approve request
        </Button>

        <Button
          size="lg"
          variant="destructive"
          className="w-full sm:w-auto"
          onClick={() => setDialog("reject")}
        >
          <X className="h-4 w-4" />
          Reject request
        </Button>
      </div>

      <ConfirmDialog
        open={dialog === "approve"}
        title="Approve Trip"
        description={
          <>
            <span className="block">
              Approving creates the actual trip for {request.client.name} and
              notifies the client. This can&apos;t be undone.
            </span>

            <label className="mt-4 block text-sm font-medium text-foreground">
              Driver Name <span className="text-destructive">*</span>
              <input
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                className={modalInputClass}
              />
            </label>

            <label className="mt-3 block text-sm font-medium text-foreground">
              Driver Phone <span className="text-destructive">*</span>
              <input
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className={modalInputClass}
              />
            </label>
          </>
        }
        confirmLabel="Approve Trip"
        loadingLabel="Approving..."
        confirmVariant="primary"
        loading={submitting}
        onClose={close}
        onConfirm={handleApprove}
      />

      <ConfirmDialog
        open={dialog === "reject"}
        title="Reject trip request?"
        description={
          <>
            <span className="block">
              The client will be notified with your reason. No trip is created.
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection (required)"
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </>
        }
        confirmLabel="Reject request"
        loadingLabel="Rejecting..."
        loading={submitting}
        onClose={close}
        onConfirm={handleReject}
      />
    </>
  );
}
