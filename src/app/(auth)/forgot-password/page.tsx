"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { API_URL } from "@/lib/api";
import AuthShell from "@/components/auth/auth-shell";
import AuthInput from "@/components/auth/auth-input";
import AuthButton from "@/components/auth/auth-button";
import AuthMessage from "@/components/auth/auth-message";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    variant: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const value = email.trim();
    if (!value) {
      setError("Email is required");
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address");
      return;
    }
    setError(undefined);

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          variant: "error",
          text: data.message || "Something went wrong. Please try again.",
        });
        return;
      }

      setMessage({
        variant: "success",
        text:
          data.message ||
          "If an account exists for this email, a password reset link has been sent.",
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
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a link to reset your password"
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
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {message && (
          <AuthMessage variant={message.variant}>{message.text}</AuthMessage>
        )}

        <AuthInput
          id="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (error) setError(undefined);
          }}
          placeholder="Enter email address"
          autoComplete="email"
          error={error}
        />

        <AuthButton loading={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </AuthButton>
      </form>
    </AuthShell>
  );
}
