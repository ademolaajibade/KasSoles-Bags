"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatNaira } from "@/lib/money";

export default function ProductDetailClient({ product }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { productIds, toggle } = useWishlist();
  const router = useRouter();
  const [variantSku, setVariantSku] = useState(product.variants[0]?.sku || "");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState(null);
  const wishlisted = productIds.has(product._id);

  const variant = product.variants.find((v) => v.sku === variantSku);
  const onSale = product.compareAtPrice > product.basePrice;

  async function handleAddToCart(e) {
    e.preventDefault();
    setStatus(null);
    try {
      await addItem(product._id, variantSku, quantity);
      setStatus({ type: "success", message: "Added to cart" });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Could not add to cart",
      });
    }
  }

  function handleBuyNow(e) {
    handleAddToCart(e).then(() => router.push("/cart"));
  }

  return (
    <form onSubmit={handleAddToCart} className="flex flex-col gap-6">
      <p className="flex items-baseline gap-2 text-xl">
        <span>{formatNaira(variant?.price ?? product.basePrice)}</span>
        {onSale && (
          <span className="text-base text-black/40 line-through dark:text-white/40">
            {formatNaira(product.compareAtPrice)}
          </span>
        )}
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="variant" className="text-sm font-medium">
          Size / Color
        </label>
        <select
          id="variant"
          value={variantSku}
          onChange={(e) => setVariantSku(e.target.value)}
          className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
        >
          {product.variants.map((v) => (
            <option key={v.sku} value={v.sku} disabled={v.stockQuantity === 0}>
              {v.size} / {v.color}{" "}
              {v.stockQuantity === 0
                ? "(out of stock)"
                : `(${v.stockQuantity} left)`}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="quantity" className="text-sm font-medium">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min="1"
          max={variant?.stockQuantity || 1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-24 rounded-md border border-gold/40 bg-transparent px-3 py-2"
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

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!variant || variant.stockQuantity === 0}
          className="flex-1 rounded-full border border-gold px-6 py-3 text-sm font-medium hover:bg-gold/10 disabled:opacity-40"
        >
          Add to cart
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!variant || variant.stockQuantity === 0}
          className="flex-1 rounded-full bg-gold px-6 py-3 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
        >
          Buy now
        </button>
        {user && (
          <button
            type="button"
            onClick={() => toggle(product._id)}
            aria-pressed={wishlisted}
            className="rounded-full border border-gold/15 px-4 py-3 text-sm hover:bg-gold/10"
          >
            {wishlisted ? "♥ Saved" : "♡ Save"}
          </button>
        )}
      </div>
    </form>
  );
}
