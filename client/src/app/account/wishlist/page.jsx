"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { products, loading } = useWishlist();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user || loading) {
    return <div className="mx-auto max-w-6xl px-6 py-12">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        Your wishlist
      </h1>

      {products.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          You haven&apos;t saved any products yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
