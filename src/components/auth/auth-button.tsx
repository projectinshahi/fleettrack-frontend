import { Loader2 } from "lucide-react";

interface AuthButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
}

/** Shared primary submit button for auth forms, with a consistent loading state. */
export default function AuthButton({
  children,
  loading,
  disabled,
  type = "submit",
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
