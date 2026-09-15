"use client";

import { TripRequestStatus } from "@/types/trip-request";
import {
  STATUS_CHIP,
  StatusCue,
  type StatusTone,
} from "@/components/ui/status-chip";

// PENDING = waiting (amber), APPROVED = green, REJECTED = red — unchanged meanings,
// now drawn with the shared tones and a shape cue.
const TONE: Record<TripRequestStatus, StatusTone> = {
  [TripRequestStatus.PENDING]: "attn",
  [TripRequestStatus.APPROVED]: "ok",
  [TripRequestStatus.REJECTED]: "fault",
};

export default function TripRequestStatusBadge({
  status,
}: {
  status: TripRequestStatus;
}) {
  const tone = TONE[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${STATUS_CHIP[tone]}`}
    >
      <StatusCue tone={tone} />
      {status}
    </span>
  );
}
