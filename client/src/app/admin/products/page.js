"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { apiFetch } from "@/lib/api";
import { formatNaira } from "@/lib/money";

function ProductsAdmin() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    apiFetch("/products?includeInactive=true&limit=50")
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleDelete(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await apiFetch(`/products/${id}`, { method: "DELETE" });
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
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-gold px-4 py-2 text-sm text-black hover:opacity-90"
        >
          New product
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {products === null ? (
        <p>Loading…</p>
      ) : (
        <ul className="divide-y divide-gold/25">
          {products.map((product) => (
            <li
              key={product._id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <p className="font-medium">
                  {product.name}{" "}
                  {!product.isActive && (
                    <span className="text-red-600">(inactive)</span>
                  )}
                </p>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {product.category?.name} — {formatNaira(product.basePrice)}
                  {product.compareAtPrice > product.basePrice && " (on sale)"}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <Link
                  href={`/admin/products/${product._id}/edit`}
                  className="underline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="text-red-600 underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminGuard>
      <ProductsAdmin />
    </AdminGuard>
  );
}
