import { STATUS_CHIP, StatusCue } from "@/components/ui/status-chip";

interface ClientStatusBadgeProps {
  status: string;
}

export default function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  // The client directory only ever renders ACTIVE today, which is an "ok" state.
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${STATUS_CHIP.ok}`}
    >
      <StatusCue tone="ok" />
      {status}
    </div>
  );
}
