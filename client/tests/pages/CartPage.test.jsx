import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartPage from "@/app/cart/page";

const updateItem = vi.fn();
const removeItem = vi.fn();
let mockCart;

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({ cart: mockCart.cart, loading: mockCart.loading, updateItem, removeItem }),
}));

const item = {
  id: "item1",
  product: { name: "Tote Bag", slug: "tote-bag", image: "https://cdn.example.com/tote.jpg" },
  size: "M",
  color: "Brown",
  quantity: 2,
  priceAtAdd: 500000,
  lineTotal: 1000000,
  stockQuantity: 3,
  available: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCart = { loading: false, cart: { items: [item], subtotal: 1000000, itemCount: 2 } };
});

describe("CartPage", () => {
  it("shows a loading state", () => {
    mockCart = { loading: true, cart: { items: [], subtotal: 0, itemCount: 0 } };
    render(<CartPage />);
    expect(screen.getByText("Loading cart…")).toBeInTheDocument();
  });

  it("shows an empty-cart message with a link back to the shop", () => {
    mockCart = { loading: false, cart: { items: [], subtotal: 0, itemCount: 0 } };
    render(<CartPage />);
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute("href", "/products");
  });

  it("renders cart items with their formatted line total and subtotal", () => {
    render(<CartPage />);
    expect(screen.getByText("Tote Bag")).toBeInTheDocument();
    expect(screen.getByText("M / Brown")).toBeInTheDocument();
    // Line total and subtotal happen to match in this fixture, so both appear.
    expect(screen.getAllByText("₦10,000.00")).toHaveLength(2);
  });

  it("increments quantity and disables increment at the stock limit", async () => {
    const user = userEvent.setup();
    render(<CartPage />);

    await act(() => user.click(screen.getByLabelText("Increase quantity")));
    expect(updateItem).toHaveBeenCalledWith("item1", 3);
  });

  it("disables the increment button once quantity reaches stock", () => {
    mockCart = {
      loading: false,
      cart: { items: [{ ...item, quantity: 3 }], subtotal: 1500000, itemCount: 3 },
    };
    render(<CartPage />);
    expect(screen.getByLabelText("Increase quantity")).toBeDisabled();
  });

  it("disables the decrement button at quantity 1", () => {
    mockCart = {
      loading: false,
      cart: { items: [{ ...item, quantity: 1 }], subtotal: 500000, itemCount: 1 },
    };
    render(<CartPage />);
    expect(screen.getByLabelText("Decrease quantity")).toBeDisabled();
  });

  it("removes an item", async () => {
    const user = userEvent.setup();
    render(<CartPage />);
    await act(() => user.click(screen.getByText("Remove")));
    expect(removeItem).toHaveBeenCalledWith("item1");
  });

  it("shows a stock warning for unavailable items", () => {
    mockCart = {
      loading: false,
      cart: { items: [{ ...item, available: false, stockQuantity: 1 }], subtotal: 1000000, itemCount: 2 },
    };
    render(<CartPage />);
    expect(screen.getByText("Only 1 left in stock")).toBeInTheDocument();
  });

  it("shows an error message when updating quantity fails", async () => {
    updateItem.mockRejectedValueOnce(new Error("Only 2 in stock"));
    const user = userEvent.setup();
    render(<CartPage />);

    await act(() => user.click(screen.getByLabelText("Increase quantity")));
    expect(await screen.findByText("Only 2 in stock")).toBeInTheDocument();
  });
});
