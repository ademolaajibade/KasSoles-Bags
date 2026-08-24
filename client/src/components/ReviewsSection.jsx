"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

function Stars({ value }) {
  const rounded = Math.round(value);
  return (
    <span aria-label={`${value} out of 5 stars`}>
      <span>{"★".repeat(rounded)}</span>
      <span className="text-black/20 dark:text-white/20">
        {"★".repeat(5 - rounded)}
      </span>
    </span>
  );
}

export default function ReviewsSection({ productId }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    apiFetch(`/reviews/product/${productId}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [productId]);

  const myReview = data?.reviews?.find((r) => r.user?._id === user?.id);

  // Prefill the form with the signed-in user's existing review, if any.
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || "");
    }
  }, [myReview]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (myReview) {
        await apiFetch(`/reviews/${myReview._id}`, {
          method: "PUT",
          body: { rating, comment },
        });
      } else {
        await apiFetch(`/reviews/product/${productId}`, {
          method: "POST",
          body: { rating, comment },
        });
      }
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/reviews/${id}`, { method: "DELETE" });
      setRating(5);
      setComment("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) return null;

  return (
    <div className="mt-16 border-t border-gold/25 pt-10">
      <h2 className="text-lg font-medium">Reviews</h2>

      {data.count > 0 ? (
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          <Stars value={data.average} /> {data.average.toFixed(1)} out of 5 (
          {data.count} review
          {data.count === 1 ? "" : "s"})
        </p>
      ) : (
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          No reviews yet.
        </p>
      )}

      {data.reviews.length > 0 && (
        <ul className="mt-6 divide-y divide-gold/25">
          {data.reviews.map((review) => (
            <li key={review._id} className="py-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {review.user?.name || "Anonymous"}
                </p>
                <Stars value={review.rating} />
              </div>
              {review.comment && (
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  {review.comment}
                </p>
              )}
              <p className="mt-1 text-xs text-black/40 dark:text-white/40">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
              {user && review.user?._id === user.id && (
                <button
                  onClick={() => handleDelete(review._id)}
                  className="mt-1 text-xs text-red-600 underline"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <h3 className="text-sm font-medium">
            {myReview ? "Edit your review" : "Leave a review"}
          </h3>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-32 rounded-md border border-gold/40 bg-transparent px-3 py-2"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts (optional)"
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
          >
            {submitting
              ? "Saving…"
              : myReview
                ? "Update review"
                : "Submit review"}
          </button>
        </form>
      ) : (
        <p className="mt-8 text-sm text-black/60 dark:text-white/60">
          <Link href="/login" className="underline">
            Log in
          </Link>
          {""}
          to leave a review.
        </p>
      )}
    </div>
  );
}
