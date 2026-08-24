"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const EMPTY_CART = { items: [], subtotal: 0, itemCount: 0 };

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch("/cart");
      setCart(data.cart);
    } catch {
      // Guest with no cart yet, or a transient error — keep the current cart state.
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch once auth resolves (and again on login/logout) so a guest cart
  // merged server-side into the user's cart is reflected here.
  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, user, refresh]);

  const addItem = useCallback(async (productId, variantSku, quantity) => {
    const data = await apiFetch("/cart/items", {
      method: "POST",
      body: { productId, variantSku, quantity },
    });
    setCart(data.cart);
  }, []);

  const updateItem = useCallback(async (itemId, quantity) => {
    const data = await apiFetch(`/cart/items/${itemId}`, {
      method: "PUT",
      body: { quantity },
    });
    setCart(data.cart);
  }, []);

  const removeItem = useCallback(async (itemId) => {
    const data = await apiFetch(`/cart/items/${itemId}`, { method: "DELETE" });
    setCart(data.cart);
  }, []);

  const clearCart = useCallback(async () => {
    const data = await apiFetch("/cart", { method: "DELETE" });
    setCart(data.cart);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
