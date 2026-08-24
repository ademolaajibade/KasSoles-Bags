import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductDetailClient from "@/components/ProductDetailClient";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const addItem = vi.fn();
vi.mock("@/context/CartContext", () => ({
  useCart: () => ({ addItem }),
}));

let mockUser = null;
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const wishlistToggle = vi.fn();
let mockProductIds = new Set();
vi.mock("@/context/WishlistContext", () => ({
  useWishlist: () => ({ productIds: mockProductIds, toggle: wishlistToggle }),
}));

const product = {
  _id: "p1",
  name: "Tote Bag",
  basePrice: 500000,
  variants: [
    { sku: "SKU-1", size: "M", color: "Brown", price: 500000, stockQuantity: 3 },
    { sku: "SKU-2", size: "L", color: "Black", price: 550000, stockQuantity: 0 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = null;
  mockProductIds = new Set();
});

describe("ProductDetailClient", () => {
  it("adds the selected variant and quantity to the cart", async () => {
    addItem.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<ProductDetailClient product={product} />);

    await act(() => user.click(screen.getByRole("button", { name: "Add to cart" })));

    expect(addItem).toHaveBeenCalledWith("p1", "SKU-1", 1);
    expect(await screen.findByText("Added to cart")).toBeInTheDocument();
  });

  it("shows an error message when adding to cart fails", async () => {
    addItem.mockRejectedValueOnce(new Error("Only 2 in stock"));
    const user = userEvent.setup();
    render(<ProductDetailClient product={product} />);

    await act(() => user.click(screen.getByRole("button", { name: "Add to cart" })));

    expect(await screen.findByText("Only 2 in stock")).toBeInTheDocument();
  });

  it("disables the out-of-stock variant option so it can't be selected", () => {
    render(<ProductDetailClient product={product} />);
    const outOfStockOption = screen.getByRole("option", { name: /L \/ Black/ });
    expect(outOfStockOption).toBeDisabled();
  });

  it("disables add-to-cart/buy-now when the only variant is out of stock", () => {
    const outOfStockProduct = {
      ...product,
      variants: [{ sku: "SKU-2", size: "L", color: "Black", price: 550000, stockQuantity: 0 }],
    };
    render(<ProductDetailClient product={outOfStockProduct} />);

    expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Buy now" })).toBeDisabled();
  });

  it("buy now adds to cart and navigates to /cart", async () => {
    addItem.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<ProductDetailClient product={product} />);

    await act(() => user.click(screen.getByRole("button", { name: "Buy now" })));

    expect(addItem).toHaveBeenCalledWith("p1", "SKU-1", 1);
    expect(push).toHaveBeenCalledWith("/cart");
  });

  it("hides the save/wishlist button when logged out", () => {
    render(<ProductDetailClient product={product} />);
    expect(screen.queryByText("♡ Save")).not.toBeInTheDocument();
  });

  it("toggles the wishlist when logged in", async () => {
    mockUser = { email: "ada@example.com" };
    const user = userEvent.setup();
    render(<ProductDetailClient product={product} />);

    await act(() => user.click(screen.getByText("♡ Save")));
    expect(wishlistToggle).toHaveBeenCalledWith("p1");
  });

  it("shows the saved state when the product is already wishlisted", () => {
    mockUser = { email: "ada@example.com" };
    mockProductIds = new Set(["p1"]);
    render(<ProductDetailClient product={product} />);
    expect(screen.getByText("♥ Saved")).toBeInTheDocument();
  });
});
