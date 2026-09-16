"use client";

import {
  STATUS_CHIP,
  StatusCue,
  type StatusTone,
} from "@/components/ui/status-chip";

interface VehicleStatusBadgeProps {
  status: string;
}

export default function VehicleStatusBadge({
  status,
}: VehicleStatusBadgeProps) {
  // Branch order preserved exactly: MOVING, then IDLE, then everything else falls
  // through to fault. `status` is a plain string here, not an enum, so the else-branch
  // is the only thing covering OFFLINE and any value the provider has not sent before.
  const tone: StatusTone =
    status === "MOVING" ? "ok" : status === "IDLE" ? "attn" : "fault";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase border ${STATUS_CHIP[tone]}`}
    >
      <StatusCue tone={tone} />
      {status}
    </div>
  );
}
