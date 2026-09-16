"use client";

import { TripStatus } from "@/types/trip";
import {
  STATUS_CHIP,
  StatusCue,
  type StatusTone,
} from "@/components/ui/status-chip";

/**
 * Trip lifecycle → status tone.
 *
 * COMPLETED is deliberately NOT green. A finished trip is terminal, not good news, and
 * green is reserved for "moving right now" — which is what makes a fleet list scannable.
 * STARTED and ONGOING are the in-progress states, so they carry the FleetTrack signal.
 * PLANNED and ASSIGNED are not under way yet, so they stay neutral rather than spending
 * a hue each (they previously used blue and indigo, both forbidden and both failing AA).
 *
 * `Record<TripStatus, …>` is kept so TypeScript fails the build if a status is ever
 * added to the enum without a tone.
 */
const TONE: Record<TripStatus, StatusTone> = {
  [TripStatus.PLANNED]: "neutral",
  [TripStatus.ASSIGNED]: "neutral",
  [TripStatus.STARTED]: "signal",
  [TripStatus.ONGOING]: "signal",
  [TripStatus.DELAYED]: "attn",
  [TripStatus.COMPLETED]: "neutral",
  [TripStatus.CANCELLED]: "fault",
};

export default function TripStatusBadge({ status }: { status: TripStatus }) {
  const tone = TONE[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${STATUS_CHIP[tone]}`}
    >
      <StatusCue tone={tone} />
      {status}
    </span>
  );
}
