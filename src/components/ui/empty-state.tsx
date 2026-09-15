import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Shared empty-state for standalone panels/lists (not table-cell rows — those stay
 * inline because a div can't live inside a <tbody>). Centered, muted, using the existing
 * theme tokens; optional icon/description/action.
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 py-10 text-center",
        className,
      )}
    >
      {icon && <div className="text-muted-foreground">{icon}</div>}

      <p className="text-sm font-medium text-foreground">{title}</p>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
