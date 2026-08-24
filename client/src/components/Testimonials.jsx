"use client";

import { useEffect, useState } from "react";

function Stars({ rating = 5 }) {
  return (
    <div className="flex justify-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${
            i < rating ? "fill-gold" : "fill-black/10 dark:fill-white/10"
          }`}
        >
          <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials({ reviews = [] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reviews.length < 2) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % reviews.length);
    }, 6000);
    return () => clearInterval(id);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  const review = reviews[active];

  return (
    <section className="mt-24 border-t border-gold/25 pt-16">
      <p className="text-center text-sm font-medium text-gold">
        Loved, worn, repeated
      </p>
      <h2 className="mt-2 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
        What customers are saying
      </h2>

      <div className="mx-auto mt-12 max-w-2xl text-center">
        <span aria-hidden className="font-serif text-5xl leading-none text-gold/40">
          &ldquo;
        </span>

        <blockquote
          key={review._id}
          className="animate-[fadeIn_0.5s_ease] font-serif text-xl leading-relaxed tracking-tight text-black/80 sm:text-2xl dark:text-white/80"
        >
          {review.comment}
        </blockquote>

        <div className="mt-6 flex flex-col items-center gap-2">
          <Stars rating={review.rating} />
          <p className="text-sm font-medium">
            {review.user?.name || "Verified buyer"}
            {review.product?.name && (
              <span className="font-normal text-black/45 dark:text-white/45">
                {" "}
                &middot; {review.product.name}
              </span>
            )}
          </p>
        </div>
      </div>

      {reviews.length > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {reviews.map((r, i) => (
            <button
              key={r._id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show testimonial ${i + 1}`}
              aria-current={i === active}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-gold" : "w-2 bg-gold/25 hover:bg-gold/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
