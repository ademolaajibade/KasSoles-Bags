"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formatNaira } from "@/lib/money";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    apiFetch("/orders")
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message));
  }, [authLoading, user, router]);

  if (authLoading || (!error && orders === null)) {
    return <div className="mx-auto max-w-3xl px-6 py-12">Loading…</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 text-red-600">{error}</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        Your orders
      </h1>

      {orders.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          You haven&apos;t placed any orders yet.
        </p>
      ) : (
        <ul className="divide-y divide-gold/25">
          {orders.map((order) => (
            <li key={order._id} className="py-4">
              <Link
                href={`/account/orders/${order._id}`}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    {new Date(order.createdAt).toLocaleDateString()} —{" "}
                    {order.status}
                  </p>
                </div>
                <p className="font-medium">{formatNaira(order.total)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
