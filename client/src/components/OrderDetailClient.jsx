"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formatNaira } from "@/lib/money";

export default function OrderDetailClient({ orderId }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    apiFetch(`/orders/${orderId}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err.message));
  }, [authLoading, user, router, orderId]);

  if (authLoading || (!error && !order)) {
    return <p>Loading…</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Order #{order._id.slice(-8).toUpperCase()}
      </h1>
      <p className="mt-1 text-black/60 dark:text-white/60">
        {new Date(order.createdAt).toLocaleString()} — {order.status}
      </p>

      <ul className="mt-6 divide-y divide-gold/25">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-black/60 dark:text-white/60">
                {item.size} / {item.color} × {item.quantity}
              </p>
            </div>
            <p>{formatNaira(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-1 border-t border-gold/25 pt-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatNaira(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatNaira(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatNaira(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 text-sm">
        <p className="font-medium">Shipping address</p>
        <p className="text-black/60 dark:text-white/60">
          {order.shippingAddress.fullName}, {order.shippingAddress.phone}
          <br />
          {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
          {order.shippingAddress.state}
          {order.shippingAddress.landmark
            ? ` (${order.shippingAddress.landmark})`
            : ""}
        </p>
      </div>
    </div>
  );
}
