import { AlertTriangle } from "lucide-react";

import { ROUTE_DEVIATION_THRESHOLD_M, TripProgress } from "@/types/trip";
import { STATUS_CHIP } from "@/components/ui/status-chip";

interface Props {
  progress: TripProgress | null;
}

function km(meters: number) {
  return (meters / 1000).toFixed(1);
}

/**
 * Route deviation alert (TM-20.2). Shown to both admin and client (read-only)
 * when the live position strays beyond the threshold from the planned route.
 * Renders nothing while the vehicle is on route or has no live position.
 */
export default function TripDeviationAlert({ progress }: Props) {
  if (!progress?.isDeviating) return null;

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${STATUS_CHIP.attn}`}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">
          Route deviation detected
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          The vehicle is {km(progress.deviationMeters)} km off the planned route
          (alert threshold {km(ROUTE_DEVIATION_THRESHOLD_M)} km).
        </p>
      </div>
    </div>
  );
}
