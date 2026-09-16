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
      {/* Brand panel — a neutral card surface. The magenta is kept to the brand mark, as on
          the sidebar; the panel used to be a solid magenta slab. */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-card p-12 text-card-foreground lg:flex">
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-7 w-7" />
          </div>
          <div>
            <p className="font-heading text-3xl font-semibold tracking-tight">FleetTrack</p>
            <p className="mt-1 text-muted-foreground">
              GPS Fleet Monitoring Platform
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="font-heading text-4xl font-semibold leading-tight tracking-tight">
            Manage Your Fleet
            <br />
            Smarter &amp; Faster
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Monitor vehicles, manage drivers, track live locations and optimize
            fleet operations from one unified dashboard.
          </p>
        </div>

        <p className="relative text-sm text-muted-foreground">
          © 2026 FleetTrack. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
            {/* The form title is the page's one h1 at every width. The brand panel above is
                hidden below lg, so its wordmark and tagline are plain text, not headings. */}
            <div>
              <h1 className="page-title">
                {title}
              </h1>
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
