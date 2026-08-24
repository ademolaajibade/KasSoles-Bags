"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api";
import { formatNaira } from "@/lib/money";

const initialAddress = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  landmark: "",
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loading: cartLoading } = useCart();
  const router = useRouter();

  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState(initialAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [shippingFee, setShippingFee] = useState(null);

  function updateAddress(field, value) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  // Live delivery-fee estimate as the customer picks a state, so the total
  // they see here matches what they're actually charged at payment.
  useEffect(() => {
    const state = address.state.trim();
    if (!state) {
      setShippingFee(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const quote = await apiFetch(
          `/shipping/quote?state=${encodeURIComponent(state)}`,
        );
        if (!cancelled) setShippingFee(quote.shippingFee);
      } catch {
        if (!cancelled) setShippingFee(null);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const orderData = await apiFetch("/orders", {
        method: "POST",
        body: { email, shippingAddress: address },
      });

      const paymentData = await apiFetch("/payments/init", {
        method: "POST",
        body: { orderId: orderData.order._id, email },
      });

      sessionStorage.setItem("checkoutEmail", email);
      window.location.href = paymentData.authorizationUrl;
    } catch (err) {
      setError(err.message || "Checkout failed");
      setSubmitting(false);
    }
  }

  if (cartLoading) {
    return <div className="mx-auto max-w-2xl px-6 py-12">Loading…</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center text-black/60 dark:text-white/60">
        Your cart is empty.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Checkout</h1>

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

        <div className="flex flex-col gap-1">
          <label htmlFor="fullName" className="text-sm font-medium">
            Full name
          </label>
          <input
            id="fullName"
            required
            value={address.fullName}
            onChange={(e) => updateAddress("fullName", e.target.value)}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone
          </label>
          <input
            id="phone"
            required
            value={address.phone}
            onChange={(e) => updateAddress("phone", e.target.value)}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="street" className="text-sm font-medium">
            Street address
          </label>
          <input
            id="street"
            required
            value={address.street}
            onChange={(e) => updateAddress("street", e.target.value)}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="city" className="text-sm font-medium">
              City
            </label>
            <input
              id="city"
              required
              value={address.city}
              onChange={(e) => updateAddress("city", e.target.value)}
              className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="state" className="text-sm font-medium">
              State
            </label>
            <input
              id="state"
              required
              value={address.state}
              onChange={(e) => updateAddress("state", e.target.value)}
              className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="landmark" className="text-sm font-medium">
            Landmark (optional)
          </label>
          <input
            id="landmark"
            value={address.landmark}
            onChange={(e) => updateAddress("landmark", e.target.value)}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          />
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-gold/25 pt-4">
          <div className="flex items-center justify-between">
            <p>Subtotal</p>
            <p>{formatNaira(cart.subtotal)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p>Delivery fee</p>
            <p>
              {shippingFee === null
                ? "Enter state to estimate"
                : formatNaira(shippingFee)}
            </p>
          </div>
          <div className="flex items-center justify-between font-medium">
            <p>Total</p>
            <p>{formatNaira(cart.subtotal + (shippingFee ?? 0))}</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-xs text-black/50 dark:text-white/50">
          By placing this order, you agree to our{" "}
          <a href="/terms" target="_blank" className="text-gold hover:underline">
            Terms of Service
          </a>
          ,{" "}
          <a href="/privacy" target="_blank" className="text-gold hover:underline">
            Privacy Policy
          </a>
          , and{" "}
          <a href="/returns" target="_blank" className="text-gold hover:underline">
            Returns &amp; Refund Policy
          </a>
          .
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? "Redirecting to payment…" : "Pay with Paystack"}
        </button>
      </form>
    </div>
  );
}
