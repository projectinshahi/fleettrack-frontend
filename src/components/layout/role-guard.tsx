"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth-store";
import { isRouteAllowed, roleLanding } from "@/lib/role-routes";

/**
 * Client-side RBAC route guard for the dashboard. Once auth is hydrated, a logged-in
 * user who opens a route outside their role's allowed set is redirected to their role
 * landing (ADMIN → /clients, others → /dashboard). The backend @Roles guards are the
 * real enforcement; this just keeps forbidden screens from ever rendering.
 */
export default function RoleGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hydrated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const role = user?.role;
  const blocked = hydrated && !!role && !isRouteAllowed(role, pathname);

  useEffect(() => {
    if (blocked && role) {
      router.replace(roleLanding());
    }
  }, [blocked, role, router]);

  // Don't flash forbidden content while the redirect is in flight.
  if (blocked) return null;

  return <>{children}</>;
}
