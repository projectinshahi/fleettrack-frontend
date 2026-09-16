import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import AuthProvider from "@/providers/auth-provider";

/**
 * The three FleetTrack faces. `next/font/google` downloads these at BUILD time and
 * serves them from this origin — there is no runtime request to Google, no extra
 * dependency, and no external DNS on the critical path.
 *
 * Archivo and IBM Plex Sans both ship variable builds, so each is a single file across
 * every weight. Only Plex Mono is static, and it is pinned to the two weights the
 * identifier treatment actually uses. Four font files in total, against two before.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// Identifiers only (registrations, references, device IDs) — never body text, so it is
// deliberately not preloaded and is allowed to swap in.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "FleetTrack Dashboard",
  description: "Modern Fleet Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables live on <html>, not <body>. globals.css declares --font-sans,
    // --font-mono and --font-heading on :root, and a custom property resolves its var()
    // references on the element that DECLARES it. With the variables on <body> they were
    // undefined at :root, which voided all three stacks and left every face on the
    // browser default.
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="antialiased font-sans transition-colors duration-300">
        <AuthProvider>
          <ThemeProvider>
            {children}

            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}