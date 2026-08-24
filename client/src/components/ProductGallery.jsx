"use client";

import { useState } from "react";

export default function ProductGallery({ images, productName }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-black/5 text-black/40 dark:bg-white/5 dark:text-white/40">
        No image
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg bg-black/5 dark:bg-white/5"
        aria-label="Open full-size image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={productName}
          className="h-full w-full object-cover"
        />
      </button>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={image.publicId}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`aspect-square overflow-hidden rounded-lg ${
                index === activeIndex
                  ? "ring-2 ring-gold"
                  : "opacity-70 hover:opacity-100"
              }`}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === activeIndex}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} full-size image`}
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={productName}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute right-6 top-6 text-3xl leading-none text-white hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
