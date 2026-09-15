"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
      // next-themes otherwise writes `document.documentElement.style.colorScheme` as an
      // INLINE style on every theme change (and in its pre-paint bootstrap script). An
      // inline style outranks any stylesheet rule, so it silently replaced our
      // `color-scheme: only light` in globals.css with a plain `light` — dropping the
      // `only` keyword that tells a browser "do not apply your own dark transformation".
      // That is why the TV's Auto Dark Theme kept force-darkening Light mode even though
      // the deployed CSS was correct: the CSS was being overridden at runtime.
      // globals.css already declares color-scheme per theme, so turning this off loses
      // nothing — native inputs/scrollbars still follow the active theme from there.
      enableColorScheme={false}
    >
      {children}
    </NextThemesProvider>
  );
}
