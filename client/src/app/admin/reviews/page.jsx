"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { apiFetch } from "@/lib/api";

function ReviewsAdmin() {
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  function load() {
    apiFetch("/reviews?limit=50")
      .then((data) => setReviews(data.reviews))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleDelete(id) {
    setBusyId(id);
    try {
      await apiFetch(`/reviews/${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/admin"
        className="mb-4 inline-block text-sm underline text-black/60 dark:text-white/60"
      >
        ← Back to Admin
      </Link>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Reviews</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {reviews === null ? (
        <p>Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">No reviews yet.</p>
      ) : (
        <ul className="divide-y divide-gold/25">
          {reviews.map((review) => (
            <li
              key={review._id}
              className="flex items-start justify-between gap-4 py-4"
            >
              <div>
                <p className="font-medium">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                  {""}
                  <span className="font-normal text-black/60 dark:text-white/60">
                    {review.user?.name || "Unknown user"} on{""}
                    {review.product ? (
                      <Link
                        href={`/products/${review.product.slug}`}
                        className="underline"
                      >
                        {review.product.name}
                      </Link>
                    ) : (
                      "a deleted product"
                    )}
                  </span>
                </p>
                {review.comment && (
                  <p className="mt-1 text-sm">{review.comment}</p>
                )}
                <p className="mt-1 text-xs text-black/40 dark:text-white/40">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(review._id)}
                disabled={busyId === review._id}
                className="shrink-0 text-sm text-red-600 underline hover:opacity-70 disabled:opacity-40"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <AdminGuard>
      <ReviewsAdmin />
    </AdminGuard>
  );
}
