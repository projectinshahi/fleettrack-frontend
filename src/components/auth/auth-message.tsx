import { AlertCircle, CheckCircle2 } from "lucide-react";

import { STATUS_CHIP } from "@/components/ui/status-chip";

interface AuthMessageProps {
  variant: "success" | "error";
  children: React.ReactNode;
}

/** Shared inline success/error banner for auth forms (tokenized, dark-mode aware). */
export default function AuthMessage({ variant, children }: AuthMessageProps) {
  const success = variant === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
        success ? STATUS_CHIP.ok : STATUS_CHIP.fault
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
