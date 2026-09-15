import { Truck } from "lucide-react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Shared two-column frame for every auth page (login / forgot / reset), so they are
 * visually identical by construction. Left is the brand panel (hidden below `lg`);
 * right is a centered card holding the page's form. Fully tokenized + dark-mode aware.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Truck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">FleetTrack</h1>
            <p className="mt-1 text-primary-foreground/85">
              GPS Fleet Monitoring Platform
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight">
            Manage Your Fleet
            <br />
            Smarter &amp; Faster
          </h2>
          <p className="mt-6 text-lg leading-8 text-primary-foreground/85">
            Monitor vehicles, manage drivers, track live locations and optimize
            fleet operations from one unified dashboard.
          </p>
        </div>

        <p className="relative text-sm text-primary-foreground/85">
          © 2026 FleetTrack. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <div>
              <h2 className="page-title">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>

            {footer && (
              <div className="mt-6 border-t border-border pt-6">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
