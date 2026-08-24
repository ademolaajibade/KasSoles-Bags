"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatNaira } from "@/lib/money";

export default function ProductCard({ product }) {
  const image = product.images?.[0]?.url;
  const secondImage = product.images?.[1]?.url;
  const { user } = useAuth();
  const { productIds, toggle } = useWishlist();
  const wishlisted = productIds.has(product._id);
  const onSale = product.compareAtPrice > product.basePrice;

  function handleWishlistClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggle(product._id);
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
        {user && (
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg leading-none shadow hover:scale-105 dark:bg-black/70"
          >
            {wishlisted ? "♥" : "♡"}
          </button>
        )}
        {onSale && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-gold px-2 py-0.5 text-xs font-medium text-black">
            Sale
          </span>
        )}
        {image ? (
          // Product images come from Cloudinary (arbitrary remote host), so a
          // plain <img> avoids configuring next/image's remote-patterns allowlist.
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {secondImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={secondImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-black/40 dark:text-white/40">
            No image
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{product.name}</h3>
        <p className="flex items-baseline gap-1.5 text-sm">
          <span className="text-black/60 dark:text-white/60">
            {formatNaira(product.basePrice)}
          </span>
          {onSale && (
            <span className="text-black/40 line-through dark:text-white/40">
              {formatNaira(product.compareAtPrice)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
