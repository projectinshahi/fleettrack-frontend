import { OverlapConflict } from "@/types/trip";
import { STATUS_CHIP, StatusCue } from "@/components/ui/status-chip";

function formatWindow(startISO: string, endISO: string) {
  const opts: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };
  const start = new Date(startISO).toLocaleString(undefined, opts);
  const end = new Date(endISO).toLocaleString(undefined, opts);
  return `${start} → ${end}`;
}

interface Props {
  /** Resource name, e.g. "Vehicle" or "Driver". */
  label: string;
  /** Render only when the resource is selected and the schedule is valid. */
  show: boolean;
  checking: boolean;
  hasOverlap: boolean;
  conflicts: OverlapConflict[];
}

/**
 * Tri-state availability notice shared by vehicle and driver overlap validation:
 * checking → conflict list → available.
 */
export default function OverlapNotice({
  label,
  show,
  checking,
  hasOverlap,
  conflicts,
}: Props) {
  if (!show) return null;

  const resource = label.toLowerCase();

  // The check runs after the user picks a resource and dates, so each outcome is announced:
  // progress and "available" politely, a conflict as an alert.
  if (checking) {
    return (
      <p role="status" className="text-xs text-muted-foreground">
        Checking {resource} availability…
      </p>
    );
  }

  if (hasOverlap) {
    return (
      <div role="alert" className={`rounded-lg border p-3 ${STATUS_CHIP.fault}`}>
        <p className="text-sm font-medium">
          This {resource} is already booked for an overlapping schedule:
        </p>
        <ul className="mt-2 space-y-1">
          {conflicts.map((c) => (
            <li key={c.tripId} className="text-xs opacity-90">
              {c.reference} · {formatWindow(c.scheduledStart, c.scheduledEnd)} ·{" "}
              {c.status}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-status-ok-ink">
      <StatusCue tone="ok" className="text-status-ok" />
      {label} is available for this schedule.
    </p>
  );
}
