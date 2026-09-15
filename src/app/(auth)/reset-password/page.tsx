"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { API_URL } from "@/lib/api";
import AuthShell from "@/components/auth/auth-shell";
import AuthInput from "@/components/auth/auth-input";
import AuthButton from "@/components/auth/auth-button";
import AuthMessage from "@/components/auth/auth-message";

type Status = "verifying" | "valid" | "invalid";

export default function ResetPasswordPage() {
  // The token drives the API calls only (not rendering), so a ref avoids a
  // synchronous setState inside the effect.
  const tokenRef = useRef<string | null>(null);
  const [status, setStatus] = useState<Status>("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<{
    variant: "success" | "error";
    text: string;
  } | null>(null);

  // Read the token from the URL (client-only) and verify it before showing the form.
  // The only setState (setStatus) runs after the fetch awaits, never synchronously.
  useEffect(() => {
    let active = true;
    const value = new URLSearchParams(window.location.search).get("token");
    tokenRef.current = value;

    async function verify() {
      try {
        const res = await fetch(
          `${API_URL}/auth/verify-reset-token?token=${encodeURIComponent(
            value ?? "",
          )}`,
        );
        const data = await res.json();
        if (!active) return;
        setStatus(res.ok && data.valid ? "valid" : "invalid");
      } catch (err) {
        console.error(err);
        if (active) setStatus("invalid");
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const next: { password?: string; confirm?: string } = {};
    if (password.length < 8)
      next.password = "Password must be at least 8 characters";
    if (confirm !== password) next.confirm = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const token = tokenRef.current;
    if (!token) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          variant: "error",
          text:
            data.message ||
            "Unable to reset your password. The link may have expired.",
        });
        return;
      }

      setDone(true);
      setMessage({
        variant: "success",
        text: data.message || "Your password has been reset. You can now log in.",
      });
    } catch (err) {
      console.error(err);
      setMessage({
        variant: "error",
        text: "Unable to reach the server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Choose a new password for your account"
      footer={
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      }
    >
      {status === "verifying" && (
        <p className="text-sm text-muted-foreground">
          Verifying your reset link…
        </p>
      )}

      {status === "invalid" && (
        <AuthMessage variant="error">
          This password reset link is invalid or has expired. Please request a
          new one.
        </AuthMessage>
      )}

      {status === "valid" && !done && (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {message && (
            <AuthMessage variant={message.variant}>{message.text}</AuthMessage>
          )}

          <AuthInput
            id="password"
            label="New Password"
            type="password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (errors.password)
                setErrors((p) => ({ ...p, password: undefined }));
            }}
            placeholder="Enter new password"
            autoComplete="new-password"
            error={errors.password}
          />

          <AuthInput
            id="confirm"
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              if (errors.confirm)
                setErrors((p) => ({ ...p, confirm: undefined }));
            }}
            placeholder="Re-enter new password"
            autoComplete="new-password"
            error={errors.confirm}
          />

          <AuthButton loading={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </AuthButton>
        </form>
      )}

      {done && message && (
        <AuthMessage variant={message.variant}>{message.text}</AuthMessage>
      )}
    </AuthShell>
  );
}
