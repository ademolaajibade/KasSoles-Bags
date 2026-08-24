import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/context/CartContext";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

let mockAuth = { user: null, loading: false };
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

import { apiFetch } from "@/lib/api";

function Harness() {
  const { cart, loading, addItem, updateItem, removeItem, clearCart } = useCart();
  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="count">{cart.itemCount}</p>
      <button onClick={() => addItem("p1", "SKU-1", 2)}>Add</button>
      <button onClick={() => updateItem("item1", 5)}>Update</button>
      <button onClick={() => removeItem("item1")}>Remove</button>
      <button onClick={() => clearCart()}>Clear</button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth = { user: null, loading: false };
});

describe("CartProvider", () => {
  it("fetches the cart once auth resolves", async () => {
    apiFetch.mockResolvedValueOnce({ cart: { items: [], subtotal: 0, itemCount: 0 } });

    render(
      <CartProvider>
        <Harness />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(apiFetch).toHaveBeenCalledWith("/cart");
  });

  it("does not fetch while auth is still resolving", () => {
    mockAuth = { user: null, loading: true };
    render(
      <CartProvider>
        <Harness />
      </CartProvider>
    );
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("re-fetches when the user identity changes (e.g. guest cart merged after login)", async () => {
    apiFetch.mockResolvedValueOnce({ cart: { items: [], subtotal: 0, itemCount: 0 } });
    const { rerender } = render(
      <CartProvider>
        <Harness />
      </CartProvider>
    );
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));

    apiFetch.mockResolvedValueOnce({ cart: { items: [{ id: "1" }], subtotal: 500000, itemCount: 3 } });
    mockAuth = { user: { email: "ada@example.com" }, loading: false };
    rerender(
      <CartProvider>
        <Harness />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("3"));
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it("addItem posts to /cart/items and updates cart state", async () => {
    apiFetch.mockResolvedValueOnce({ cart: { items: [], subtotal: 0, itemCount: 0 } });
    const user = userEvent.setup();
    render(
      <CartProvider>
        <Harness />
      </CartProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    apiFetch.mockResolvedValueOnce({ cart: { items: [{ id: "1" }], subtotal: 500000, itemCount: 2 } });
    await act(() => user.click(screen.getByText("Add")));

    expect(apiFetch).toHaveBeenCalledWith("/cart/items", {
      method: "POST",
      body: { productId: "p1", variantSku: "SKU-1", quantity: 2 },
    });
    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("updateItem, removeItem and clearCart call the expected endpoints", async () => {
    apiFetch.mockResolvedValueOnce({ cart: { items: [], subtotal: 0, itemCount: 0 } });
    const user = userEvent.setup();
    render(
      <CartProvider>
        <Harness />
      </CartProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    apiFetch.mockResolvedValueOnce({ cart: { items: [], subtotal: 0, itemCount: 5 } });
    await act(() => user.click(screen.getByText("Update")));
    expect(apiFetch).toHaveBeenCalledWith("/cart/items/item1", { method: "PUT", body: { quantity: 5 } });

    apiFetch.mockResolvedValueOnce({ cart: { items: [], subtotal: 0, itemCount: 0 } });
    await act(() => user.click(screen.getByText("Remove")));
    expect(apiFetch).toHaveBeenCalledWith("/cart/items/item1", { method: "DELETE" });

    apiFetch.mockResolvedValueOnce({ cart: { items: [], subtotal: 0, itemCount: 0 } });
    await act(() => user.click(screen.getByText("Clear")));
    expect(apiFetch).toHaveBeenCalledWith("/cart", { method: "DELETE" });
  });
});
