"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { X, Truck } from "lucide-react";
import {
  LayoutDashboard,
  Map,
  Users,
  Settings,
  UserCog,
  Route,
  Building2,
  Clock,
  FileBarChart,
  Bell,
  ChevronDown,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

/** A leaf navigation link. */
type NavChild = {
  title: string;
  icon: LucideIcon;
  href: string;
  roles: string[];
};

/**
 * A sidebar entry — either a leaf (has `href`) or a collapsible group (has
 * `children`). Reports is the only group today; every report keeps its own icon
 * and roles so role-based visibility is unchanged.
 */
type NavItem = {
  title: string;
  icon: LucideIcon;
  href?: string;
  roles?: string[];
  children?: NavChild[];
};

export const sidebarMenu: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["ADMIN", "CLIENT"],
  },
  {
    title: "Live Tracking",
    icon: Map,
    href: "/tracking",
    roles: ["ADMIN", "CLIENT"],
  },
  {
    title: "Vehicles",
    icon: Truck,
    href: "/vehicles",
    roles: ["ADMIN", "CLIENT"],
  },
  {
    title: "Trips",
    icon: Route,
    href: "/trips",
    roles: ["CLIENT"],
  },
  {
    title: "Trip Requests",
    icon: ClipboardList,
    href: "/trip-requests",
    roles: ["ADMIN", "CLIENT"],
  },
  {
    title: "Delays",
    icon: Clock,
    href: "/delays",
    roles: ["CLIENT"],
  },
  {
    title: "Notifications",
    icon: Bell,
    href: "/notifications",
    roles: ["CLIENT"],
  },
  {
    // Collapsible parent — groups the six report pages. Visibility is derived from
    // its children's roles, so it appears only when the role can see ≥1 report.
    title: "Reports",
    icon: FileBarChart,
    children: [
      {
        title: "Trip Report",
        icon: FileBarChart,
        href: "/reports/trips",
        roles: ["CLIENT"],
      },
      {
        title: "Delay Report",
        icon: FileBarChart,
        href: "/reports/delays",
        roles: ["CLIENT"],
      },
      {
        title: "Cost Report",
        icon: FileBarChart,
        href: "/reports/cost",
        roles: ["CLIENT"],
      },
      {
        title: "Driver Report",
        icon: UserCog,
        href: "/reports/drivers",
        roles: ["CLIENT"],
      },
      {
        title: "Vehicle Report",
        icon: Truck,
        href: "/reports/vehicles",
        roles: ["CLIENT"],
      },
      {
        title: "Customer Report",
        icon: Building2,
        href: "/reports/customers",
        roles: ["CLIENT"],
      },
    ],
  },
  {
    title: "Clients",
    icon: Users,
    href: "/clients",
    roles: ["ADMIN"],
  },
  {
    title: "Customers",
    icon: Building2,
    href: "/customers",
    roles: ["CLIENT"],
  },
  {
    title: "Users",
    icon: UserCog,
    href: "/users",
    roles: ["ADMIN"],
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["ADMIN"],
  },
];

interface SidebarProps {
  expanded: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  setExpanded: (value: boolean) => void;
}

/**
 * A single navigation row (icon + label + active pill). Shared by top-level leaves
 * and report children so the styling, hover, active state and collapse transitions
 * are defined once — `indent` nudges children in to read as a sub-item.
 */
function NavLink({
  href,
  title,
  Icon,
  active,
  expanded,
  indent,
  onNavigate,
}: {
  href: string;
  title: string;
  Icon: LucideIcon;
  active: boolean;
  expanded: boolean;
  indent?: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      // NOT purely visual — flagged in the Phase 2D report. The active row is already
      // identifiable without colour (the 4px rail plus font-medium), but only visually;
      // this is what announces it to a screen reader. Nothing reads this attribute, so
      // navigation behaviour is unaffected.
      aria-current={active ? "page" : undefined}
      className={`
        relative flex h-10 items-center gap-3.5 rounded-lg px-3.5
        transition-all duration-200 group/navlink
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring

        ${indent ? "lg:pl-11" : ""}

        ${
          active
            ? "bg-primary/10 text-primary-ink font-medium"
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        }
      `}
    >
      {/* Left border active indicator */}
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-primary" />
      )}

      <Icon className={`h-5 w-5 min-w-[20px] transition-transform duration-200 group-hover/navlink:scale-105 ${active ? "text-primary-ink" : "text-muted-foreground group-hover/navlink:text-foreground"}`} />

      <span
        className={`
          text-sm font-medium whitespace-nowrap transition-all duration-300

          ${expanded ? "opacity-100 translate-x-0 lg:block" : "opacity-0 -translate-x-2 lg:hidden"}

          block
        `}
      >
        {title}
      </span>
    </Link>
  );
}

export default function Sidebar({
  expanded,
  sidebarOpen,
  setSidebarOpen,
  setExpanded,
}: SidebarProps) {
  const pathname = usePathname();

  const { user } = useAuthStore();

  // No user yet (hydrating) → no role → no menu items render until the real role loads.
  const role = user?.role ?? "";

  // Accordion state for the Reports group. It auto-stays-open on any report route
  // (derived, not stored) so requirement 6 holds even on a hard refresh.
  const onReportsRoute = pathname.startsWith("/reports");
  const [reportsOpen, setReportsOpen] = useState(false);
  const reportsExpanded = reportsOpen || onReportsRoute;

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => {
          if (window.innerWidth >= 1024) {
            setExpanded(true);
          }
        }}
        onMouseLeave={() => {
          if (window.innerWidth >= 1024) {
            setExpanded(false);
          }
        }}
        className={`
          fixed left-0 top-0 z-[100] flex h-dvh flex-col
          border-r border-border
          bg-card
          text-card-foreground
          transition-all duration-300 ease-in-out

          ${expanded ? "lg:w-[250px]" : "lg:w-[88px]"}

          w-[280px] max-w-[85vw]

          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-5 h-16">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-300 hover:scale-105">
              <Truck className="h-5 w-5" />
            </div>

            <div
              className={`transition-all duration-300 ${
                expanded ? "opacity-100 translate-x-0 lg:block" : "opacity-0 -translate-x-4 lg:hidden"
              } block`}
            >
              <h1 className="text-base font-semibold tracking-tight leading-none text-foreground">FleetTrack</h1>

              <p className="text-xs text-muted-foreground mt-0.5 font-medium tracking-wider uppercase">GPS Portal</p>
            </div>
          </div>

          {/* Mobile Close */}
          <button
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar">
          <ul className="space-y-1">
            {sidebarMenu.map((item) => {
              const Icon = item.icon;

              // Collapsible group (Reports). Shown only when the role can see a child.
              if (item.children) {
                const visibleChildren = item.children.filter((child) =>
                  child.roles.includes(role),
                );

                if (visibleChildren.length === 0) return null;

                return (
                  <li key={item.title}>
                    <button
                      type="button"
                      onClick={() => setReportsOpen((open) => !open)}
                      aria-expanded={reportsExpanded}
                      className={`
                        relative flex h-10 w-full items-center gap-3.5 rounded-lg px-3.5
                        transition-all duration-200 group/navlink
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring

                        ${
                          onReportsRoute
                            ? "bg-primary/10 text-primary-ink font-medium"
                            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        }
                      `}
                    >
                      {/* Left border active indicator */}
                      {onReportsRoute && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-primary" />
                      )}

                      <Icon className={`h-5 w-5 min-w-[20px] transition-transform duration-200 group-hover/navlink:scale-105 ${onReportsRoute ? "text-primary-ink" : "text-muted-foreground group-hover/navlink:text-foreground"}`} />

                      <span
                        className={`
                          flex-1 text-left text-sm font-medium whitespace-nowrap transition-all duration-300

                          ${expanded ? "opacity-100 translate-x-0 lg:block" : "opacity-0 -translate-x-2 lg:hidden"}

                          block
                        `}
                      >
                        {item.title}
                      </span>

                      <ChevronDown
                        className={`
                          h-4 w-4 shrink-0 transition-transform duration-300

                          ${reportsExpanded ? "" : "-rotate-90"}

                          ${expanded ? "opacity-100 lg:block" : "opacity-0 lg:hidden"}

                          block
                        `}
                      />
                    </button>

                    {reportsExpanded && (
                      <ul className={`mt-1 space-y-1 ${expanded ? "" : "lg:hidden"}`}>
                        {visibleChildren.map((child) => (
                          <li key={child.title}>
                            <NavLink
                              href={child.href}
                              title={child.title}
                              Icon={child.icon}
                              active={pathname === child.href}
                              expanded={expanded}
                              indent
                              onNavigate={() => setSidebarOpen(false)}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              // Leaf link.
              if (!item.href || !item.roles?.includes(role)) return null;

              return (
                <li key={item.title}>
                  <NavLink
                    href={item.href}
                    title={item.title}
                    Icon={Icon}
                    active={pathname === item.href}
                    expanded={expanded}
                    onNavigate={() => setSidebarOpen(false)}
                  />
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-4 py-4 flex items-center justify-between">
          <p
            className={`
              text-xs text-muted-foreground font-semibold uppercase tracking-wider

              ${expanded ? "lg:block" : "lg:hidden"}

              block
            `}
          >
            v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}
