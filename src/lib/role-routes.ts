import type { UserRole } from "@/types/user";

/**
 * Per-role allowed route prefixes (RBAC). ADMIN is the Fleet Owner — it owns the
 * fleet, so it keeps the company-wide operational views (dashboard, tracking,
 * vehicles) alongside platform management (clients, users, settings). The
 * client-only workflow modules (trips, delays, reports, notifications, customers)
 * stay CLIENT-scoped. Enforced client-side by RoleGuard and server-side by @Roles.
 */
export const roleRoutes: Record<UserRole, string[]> = {
  ADMIN: [
    "/dashboard",
    "/tracking",
    "/vehicles",
    "/trip-requests",
    "/clients",
    "/users",
    "/settings",
  ],

  CLIENT: [
    "/dashboard",
    "/tracking",
    "/vehicles",
    "/trips",
    "/trip-requests",
    "/delays",
    "/reports",
    "/notifications",
    "/customers",
  ],
};

/** Where to send a user who lands on a route their role can't access. */
export function roleLanding(): string {
  return "/dashboard";
}

/** True when `pathname` falls within one of the role's allowed route prefixes. */
export function isRouteAllowed(role: string, pathname: string): boolean {
  const allowed = roleRoutes[role as UserRole] ?? [];
  return allowed.some(
    (base) => pathname === base || pathname.startsWith(base + "/"),
  );
}
