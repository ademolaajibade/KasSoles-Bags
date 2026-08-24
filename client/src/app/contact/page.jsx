"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { siteInfo } from "@/lib/site";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/contact", { method: "POST", body: form });
      setStatus({
        type: "success",
        message: "Thanks for reaching out — we'll get back to you soon.",
      });
      setForm({ name: "", email: "", message: "" });
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
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Contact us</h1>
      <p className="mt-2 max-w-md text-sm text-black/60 dark:text-white/60">
        Questions about an order, a custom piece, or anything else — send us a
        message.
      </p>

      <div className="mt-10 grid gap-12 sm:grid-cols-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              value={form.message}
              onChange={handleChange}
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
            {submitting ? "Sending…" : "Send message"}
          </button>
        </form>

        <div className="text-sm text-black/60 dark:text-white/60">
          <p className="text-sm font-medium text-foreground">
            Reach us directly
          </p>
          <dl className="mt-4 flex flex-col gap-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-black/40 dark:text-white/40">
                Address
              </dt>
              <dd className="mt-1">{siteInfo.address}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-black/40 dark:text-white/40">
                Phone
              </dt>
              <dd className="mt-1">
                <a href={`tel:${siteInfo.phone}`} className="hover:text-gold">
                  {siteInfo.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-black/40 dark:text-white/40">
                Email
              </dt>
              <dd className="mt-1">
                <a
                  href={`mailto:${siteInfo.email}`}
                  className="hover:text-gold"
                >
                  {siteInfo.email}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
