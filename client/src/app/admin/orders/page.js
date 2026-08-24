"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { apiFetch } from "@/lib/api";
import { formatNaira } from "@/lib/money";

const STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

function OrdersAdmin() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    apiFetch("/orders?all=true&limit=50")
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleStatusChange(id, status) {
    try {
      await apiFetch(`/orders/${id}/status`, {
        method: "PUT",
        body: { status },
      });
      load();
    } catch (err) {
      setError(err.message);
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
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Orders</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {orders === null ? (
        <p>Loading…</p>
      ) : (
        <ul className="divide-y divide-gold/25">
          {orders.map((order) => (
            <li
              key={order._id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <Link
                  href={`/account/orders/${order._id}`}
                  className="font-medium hover:underline"
                >
                  #{order._id.slice(-8).toUpperCase()}
                </Link>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {order.email} — {formatNaira(order.total)}
                </p>
              </div>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                className="rounded-md border border-gold/40 bg-transparent px-2 py-1.5 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      <OrdersAdmin />
    </AdminGuard>
  );
}
