import { Truck } from "lucide-react";

interface FullScreenLoaderProps {
  /** Primary line (e.g. "Signing you in..."). */
  title?: string;
  /** Secondary line (e.g. "Preparing your dashboard..."). */
  subtitle?: string;
}

/**
 * Branded full-screen loading overlay. Reusable across pages (login transition, route
 * hydration, etc.). Fixed and centered, tokenized for light/dark, and fades in with
 * tw-animate utilities — no animation library. Announced to assistive tech via role/aria.
 */
export default function FullScreenLoader({
  title = "Signing you in...",
  subtitle = "Preparing your dashboard...",
}: FullScreenLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-background px-6 text-center animate-in fade-in duration-300"
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Truck className="h-6 w-6" />
        </div>
        <span className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          FleetTrack
        </span>
      </div>

      {/* Circular spinner */}
      <div
        className="h-9 w-9 animate-spin rounded-full border-[3px] border-muted border-t-primary"
        aria-hidden="true"
      />

      {/* Status text */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
