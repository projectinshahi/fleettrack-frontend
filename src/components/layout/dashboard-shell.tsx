"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import Sidebar from "./sidebar";
import Navbar from "./navbar";
import RoleGuard from "./role-guard";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  const [expanded, setExpanded] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tracking is a full-bleed, fixed-height workspace: it owns its own height and must
  // reach every edge below the navbar, so the shell drops its content padding there.
  // Every other page supplies its own padding (`p-6`), so nothing else changes.
  const pathname = usePathname();
  const fullBleed = pathname?.startsWith("/tracking");

  return (
    // Lock the shell to the viewport so the BODY never scrolls; the content region
    // below becomes the scroll container.
    //
    // `h-screen` (100vh) FIRST, with `dvh` layered on only where the browser supports it.
    // `h-dvh` alone was a silent single point of failure on TV browsers: dvh needs
    // Chromium 108+/Safari 15.4+, and smart-TV browsers are routinely older, where the
    // declaration is simply dropped. Height then falls back to `auto`, and because every
    // layer below (main → content → tracking page → sidebar → vehicle list) sizes itself
    // with height:100%, ONE unsupported unit collapsed the whole chain: the list grew to
    // its content height and the page scrolled instead of the list. vh is universally
    // supported, so the chain always has a definite height to resolve against; dvh still
    // handles mobile browser chrome wherever it is available.
    <div className="h-screen supports-[height:100dvh]:h-dvh overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        expanded={expanded}
        setExpanded={setExpanded}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Navbar */}
      <Navbar
        expanded={expanded}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content — full viewport height, offset below the fixed 64px navbar. */}
      <main
        // Same vh-first / dvh-enhanced pair as the shell above. border-box means the
        // 64px pt-16 is subtracted from this height, so the inner region below is exactly
        // viewport-minus-navbar — which is what the tracking page measures itself against.
        className={`h-screen supports-[height:100dvh]:h-dvh pt-16 transition-all duration-300 ${
          expanded ? "lg:ml-[250px]" : "lg:ml-[88px]"
        }`}
      >
        <div className="h-full overflow-y-auto">
          {fullBleed ? (
            <RoleGuard>{children}</RoleGuard>
          ) : (
            // Single source of horizontal padding (pages no longer pad themselves)
            // plus a readable max-width so content doesn't stretch on 2560/4K screens.
            <div className="mx-auto w-full max-w-[1920px] p-4 sm:p-6 lg:p-8">
              <RoleGuard>{children}</RoleGuard>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
