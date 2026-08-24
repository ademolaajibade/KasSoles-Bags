"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function ResetPasswordPage({ params }) {
  const { token } = use(params);
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch(`/auth/reset-password/${token}`, {
        method: "POST",
        body: { newPassword },
      });
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not reset password");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">
          Password reset
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Your password has been updated.{""}
          <Link
            href="/login"
            className="underline"
            onClick={() => router.push("/login")}
          >
            Log in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        Reset password
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="newPassword" className="text-sm font-medium">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </div>
  );
}
