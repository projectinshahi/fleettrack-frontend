import Link from "next/link";
import { Truck, Activity, AlertTriangle, type LucideIcon } from "lucide-react";

import { StatusCue, type StatusTone } from "@/components/ui/status-chip";

// StatusCue paints with `currentColor`, so the cue needs a text-colour class. Full literals on
// purpose: Tailwind scans source text, so a class assembled at runtime is never generated.
const CUE_COLOR: Record<StatusTone, string> = {
  signal: "text-status-signal",
  ok: "text-status-ok",
  attn: "text-status-attn",
  fault: "text-status-fault",
  neutral: "text-status-neutral",
};

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  /**
   * Status tone of the metric. Drawn as a shape cue beside the label (colour + shape), never
   * as a coloured card or a coloured number: the value always stays in ink.
   */
  tone?: StatusTone;
  /** Overrides the tone-derived icon (e.g. a trip icon on the dashboard). */
  icon?: LucideIcon;
  /** When set, the whole tile links here: used for dashboard drill-down. */
  href?: string;
}

/**
 * One tile of a KPI strip. It deliberately has no border, radius or shadow of its own: the
 * dashboard seats tiles in a single bordered strip whose 1px gaps draw the dividers, so a
 * group reads as one ledger row instead of a wall of separately coloured cards.
 */
export default function StatsCard({
  title,
  value,
  description,
  tone,
  icon,
  href,
}: StatsCardProps) {
  const Icon =
    icon ??
    (tone === "ok" ? Activity : tone === "fault" ? AlertTriangle : Truck);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] font-medium leading-tight text-muted-foreground">
          {tone && <StatusCue tone={tone} className={CUE_COLOR[tone]} />}
          {title}
        </p>

        <Icon aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      {/* Proportional figures: a standalone value is read, not column-aligned, and these load
          once rather than ticking live, so there is no width jitter for tabular figures to
          prevent. */}
      <p className="mt-3 text-2xl font-semibold leading-none tracking-tight text-foreground">
        {value}
      </p>

      <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
    </>
  );

  return href ? (
    // ring-inset: the strip clips its children to the 6px radius, so an outset ring would be
    // cut off at the strip's edge for exactly the keyboard users who need it.
    <Link
      href={href}
      className="block h-full bg-card p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {body}
    </Link>
  ) : (
    <div className="h-full bg-card p-4">{body}</div>
  );
}
