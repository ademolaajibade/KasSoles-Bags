"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/money";

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const [pendingId, setPendingId] = useState(null);
  const [errors, setErrors] = useState({});

  async function changeQuantity(item, nextQuantity) {
    if (nextQuantity < 1 || nextQuantity === item.quantity) return;
    setPendingId(item.id);
    setErrors((prev) => ({ ...prev, [item.id]: null }));
    try {
      await updateItem(item.id, nextQuantity);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [item.id]: err.message || "Could not update quantity",
      }));
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-6 py-12">Loading cart…</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 text-center">
        <p className="text-black/60 dark:text-white/60">Your cart is empty.</p>
        <Link href="/products" className="mt-4 inline-block underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Your cart</h1>

      <ul className="divide-y divide-gold/25">
        {cart.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.product?.image}
              alt={item.product?.name || "Product"}
              className="h-20 w-20 rounded-md object-cover bg-black/5 dark:bg-white/5"
            />
            <div className="flex-1">
              <Link
                href={`/products/${item.product?.slug}`}
                className="font-medium hover:underline"
              >
                {item.product?.name || "Unavailable product"}
              </Link>
              <p className="text-sm text-black/60 dark:text-white/60">
                {item.size} / {item.color}
              </p>
              {!item.available && (
                <p className="text-sm text-red-600">
                  Only {item.stockQuantity} left in stock
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 text-sm">
                <div className="flex items-center rounded-md border border-gold/40">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={pendingId === item.id || item.quantity <= 1}
                    onClick={() => changeQuantity(item, item.quantity - 1)}
                    className="px-3 py-1 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={
                      pendingId === item.id ||
                      item.quantity >= item.stockQuantity
                    }
                    onClick={() => changeQuantity(item, item.quantity + 1)}
                    className="px-3 py-1 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              {errors[item.id] && (
                <p className="mt-1 text-sm text-red-600">{errors[item.id]}</p>
              )}
            </div>
            <p className="font-medium">{formatNaira(item.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between border-t border-gold/25 pt-6">
        <p className="text-lg font-medium">Subtotal</p>
        <p className="text-lg font-medium">{formatNaira(cart.subtotal)}</p>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block rounded-full bg-gold px-6 py-3 text-center text-sm font-medium text-black hover:opacity-90"
      >
        Checkout
      </Link>
    </div>
  );
}
