"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setStatus({
        type: "success",
        message: "If that email is registered, a reset link has been sent...",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        Forgot password
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          />
        </div>
        {status && (
          <p
            className={
              status.type === "error"
                ? "text-sm text-red-600"
                : "text-sm text-green-600"
            }
          >
            {status.message}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-sm text-black/60 dark:text-white/60">
        <Link href="/login" className="underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
