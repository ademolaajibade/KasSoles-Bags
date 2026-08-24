"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch("/wishlist");
      setProducts(data.products);
    } catch {
      // Transient error — keep the current wishlist state.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, user, refresh]);

  const productIds = useMemo(
    () => new Set(products.map((p) => p._id)),
    [products],
  );

  const toggle = useCallback(
    async (productId) => {
      if (productIds.has(productId)) {
        await apiFetch(`/wishlist/${productId}`, { method: "DELETE" });
        setProducts((prev) => prev.filter((p) => p._id !== productId));
      } else {
        await apiFetch(`/wishlist/${productId}`, { method: "POST" });
        await refresh();
      }
    },
    [productIds, refresh],
  );

  return (
    <WishlistContext.Provider
      value={{ products, loading, productIds, toggle, refresh }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
