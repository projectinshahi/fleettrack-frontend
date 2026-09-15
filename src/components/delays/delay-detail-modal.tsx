"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Delay } from "@/types/delay";
import DelayCategoryBadge from "./delay-category-badge";

interface Props {
  open: boolean;
  onClose: () => void;
  delay: Delay;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-none">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

/**
 * Delay detail modal (DLY-03.1) — shows the full record (reason, remarks,
 * timestamp, duration, …) for a single delay. Fed the already-loaded delay object
 * from the list, so it needs no additional fetch.
 */
export default function DelayDetailModal({ open, onClose, delay }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Delay details</DialogTitle>
          <DialogDescription>
            Trip {delay.trip?.reference ?? delay.tripId}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <Row label="Category">
            <DelayCategoryBadge category={delay.category} />
          </Row>
          <Row label="Reason">{delay.reason || "—"}</Row>
          <Row label="Remarks">{delay.remarks || "—"}</Row>
          <Row label="Duration">{delay.durationMinutes} min</Row>
          <Row label="Reported at">{formatDateTime(delay.reportedAt)}</Row>
          <Row label="Source">{delay.source}</Row>
          <Row label="Reported by">{delay.reportedBy || "—"}</Row>
        </div>
      </DialogContent>
    </Dialog>
  );
}
