import { cn } from "@/lib/utils";

/**
 * The five FleetTrack status tones. This is the whole vocabulary — there is no sixth,
 * and nominal categories (delay categories, customer types) deliberately collapse onto
 * `neutral` rather than earning hues of their own.
 *
 *   signal  (magenta) FleetTrack signal / selected / in-progress.  NEVER vehicle MOVING.
 *   ok      (green)   MOVING, APPROVED, client ACTIVE.
 *   attn    (amber)   IDLE, DELAYED, PENDING.
 *   fault   (red)     OFFLINE, CANCELLED, REJECTED.
 *   neutral (grey)    COMPLETED, and every nominal category.
 */
export type StatusTone = "signal" | "ok" | "attn" | "fault" | "neutral";

/**
 * Chip colours: tinted surface + its own ink + the full-strength hue as the edge.
 *
 * This replaces the previous `bg-X/10 text-X border-X/15` shape, which put text on a
 * tint of ITSELF — mathematically doomed, and measured at 2.31–4.49:1 across the app.
 * `-ink` is a separately tuned value, never a tint of the hue, so every pairing clears
 * 4.5:1 on its own surface in both themes.
 *
 * Written as full literal class strings on purpose: Tailwind scans source text, so a
 * class assembled at runtime (`bg-status-${tone}-surface`) is never generated.
 */
export const STATUS_CHIP: Record<StatusTone, string> = {
  signal: "bg-status-signal-surface text-status-signal-ink border-status-signal",
  ok: "bg-status-ok-surface text-status-ok-ink border-status-ok",
  attn: "bg-status-attn-surface text-status-attn-ink border-status-attn",
  fault: "bg-status-fault-surface text-status-fault-ink border-status-fault",
  neutral:
    "bg-status-neutral-surface text-status-neutral-ink border-status-neutral",
};

/** Solid tone fill, for dots and rails drawn OUTSIDE a chip (on a card, not a tint). */
export const STATUS_SOLID: Record<StatusTone, string> = {
  signal: "bg-status-signal",
  ok: "bg-status-ok",
  attn: "bg-status-attn",
  fault: "bg-status-fault",
  neutral: "bg-status-neutral",
};

/**
 * The non-colour cue — one distinct SHAPE per tone, so a status survives greyscale,
 * a monochrome printout and every form of colour-vision deficiency.
 *
 * This is not decoration. Measured across all five hues, the best achievable minimum
 * separation under a Viénot-1999 deuteranope simulation is 1.37:1 — and only with
 * colours too desaturated to read as status at all. No palette can carry status by
 * hue alone, so the shape is load-bearing.
 *
 * `currentColor` ties every cue to the chip's own ink, which is already verified
 * against the surface behind it, so a cue can never be less legible than its label.
 */
const CUE_SHAPE: Record<StatusTone, string> = {
  signal: "size-[7px] rotate-45 bg-current", // diamond — the selected / in-progress mark
  ok: "size-1.5 rounded-full bg-current", // disc — running
  attn: "size-2 rounded-full border-[1.5px] border-current", // ring — waiting
  fault: "h-[2px] w-2.5 rounded-full bg-current", // bar — stopped / blocked
  neutral: "size-1.5 rounded-[1px] bg-current", // square — terminal / nominal
};

/**
 * Renders the shape cue. `aria-hidden` because the status word itself is always present
 * next to it — the cue reinforces the label, it never replaces it.
 */
export function StatusCue({
  tone,
  className,
}: {
  tone: StatusTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0", CUE_SHAPE[tone], className)}
    />
  );
}
