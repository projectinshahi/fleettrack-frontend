"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";
import AuthShell from "@/components/auth/auth-shell";
import AuthInput from "@/components/auth/auth-input";
import AuthButton from "@/components/auth/auth-button";
import FullScreenLoader from "@/components/ui/full-screen-loader";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const { setAuth } = useAuthStore();

  // Busy = request in flight OR the post-success transition is playing.
  const busy = loading || signingIn;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard against double submission (Enter key, rapid clicks).
    if (busy) return;

    // Client-side validation (UI only) — the authentication flow below is unchanged.
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = "Email is required";
    else if (!EMAIL_RE.test(email.trim()))
      nextErrors.email = "Enter a valid email address";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Login failed");
        return;
      }

      if (data.success) {
        // Auth is complete and the user/role are resolved here — persist, then show the
        // full-screen transition loader and hand off to the dashboard (unchanged nav).
        setAuth(data.user, data.token);

        document.cookie = `token=${data.token}; path=/`;

        setSigningIn(true);

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 700);
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      // On success the loader stays up via `signingIn`; this only restores the button
      // on the failure paths.
      setLoading(false);
    }
  };

  return (
    <>
      <AuthShell
        title="Welcome Back"
        subtitle="Login to continue to your FleetTrack dashboard"
        footer={
          <p className="text-center text-sm text-muted-foreground">
            FleetTrack Admin Dashboard
          </p>
        }
      >
        <form onSubmit={handleLogin} className="space-y-5" noValidate aria-busy={busy}>
          <fieldset disabled={busy} className="space-y-5 border-0 p-0">
            <AuthInput
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="Enter email address"
              autoComplete="email"
              error={errors.email}
            />

            <AuthInput
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Enter password"
              autoComplete="current-password"
              error={errors.password}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
                />
                Remember me
              </label>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <AuthButton loading={loading} disabled={busy}>
              {loading ? "Logging in..." : "Login"}
            </AuthButton>
          </fieldset>
        </form>
      </AuthShell>

      {signingIn && <FullScreenLoader />}
    </>
  );
}
