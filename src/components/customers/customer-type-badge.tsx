import { CustomerType } from "@/types/customer";
import { STATUS_CHIP, StatusCue } from "@/components/ui/status-chip";

/**
 * Customer type is a NOMINAL label, not a state — SHIPPER is not "better" than
 * RECEIVER, and neither is a warning. Spending a hue on each is what made the app read
 * as a rainbow, so all three share the neutral treatment and are told apart by the word
 * itself, which is the only thing that actually carries the meaning.
 */
export default function CustomerTypeBadge({ type }: { type: CustomerType }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_CHIP.neutral}`}
    >
      <StatusCue tone="neutral" />
      {type}
    </div>
  );
}
