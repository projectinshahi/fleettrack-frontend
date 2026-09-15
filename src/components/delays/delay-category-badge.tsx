"use client";

import { DelayCategory } from "@/types/delay";
import { STATUS_CHIP, StatusCue } from "@/components/ui/status-chip";


/**
 * Delay category is a NOMINAL label, not a severity — TRAFFIC is not more urgent than
 * WEATHER, and neither is an error. The previous map spent seven distinct hues here
 * (orange, sky, red, amber, violet, blue plus destructive), every one of which failed
 * AA at this text size in at least one theme, and together they were the single largest
 * source of colour noise in the product.
 *
 * The category word is what carries the meaning; the delay's SEVERITY is expressed
 * elsewhere by the trip's own status. One neutral treatment for all eight.
 */
export default function DelayCategoryBadge({
  category,
}: {
  category: DelayCategory;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_CHIP.neutral}`}
    >
      <StatusCue tone="neutral" />
      {category}
    </span>
  );
}
