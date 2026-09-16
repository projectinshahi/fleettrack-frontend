"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

/**
 * The app Toaster: the root layout's props, plus the resolved app theme and the app's own
 * surfaces. Sonner otherwise renders light in dark mode, and its rich colours bring their own
 * palette (including a blue). Its colour variables are pointed at our tokens instead, which
 * already flip with the theme; richColors is kept so success and error stay distinct.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      richColors
      closeButton
      duration={3000}
      style={
        {
          fontFamily: "var(--font-sans)",
          "--border-radius": "var(--radius)",
          "--normal-bg": "var(--popover)",
          "--normal-bg-hover": "var(--muted)",
          "--normal-border": "var(--border)",
          "--normal-border-hover": "var(--border-strong)",
          "--normal-text": "var(--popover-foreground)",
          "--success-bg": "var(--status-ok-surface)",
          "--success-border": "var(--status-ok)",
          "--success-text": "var(--status-ok-ink)",
          "--error-bg": "var(--status-fault-surface)",
          "--error-border": "var(--status-fault)",
          "--error-text": "var(--status-fault-ink)",
          "--warning-bg": "var(--status-attn-surface)",
          "--warning-border": "var(--status-attn)",
          "--warning-text": "var(--status-attn-ink)",
          "--info-bg": "var(--status-neutral-surface)",
          "--info-border": "var(--status-neutral)",
          "--info-text": "var(--status-neutral-ink)",
        } as React.CSSProperties
      }
    />
  );
}
