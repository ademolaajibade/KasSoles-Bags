import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductCard from "@/components/ProductCard";

let mockUser = null;
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const toggle = vi.fn();
let mockProductIds = new Set();
vi.mock("@/context/WishlistContext", () => ({
  useWishlist: () => ({ productIds: mockProductIds, toggle }),
}));

const product = {
  _id: "p1",
  slug: "tote-bag",
  name: "Tote Bag",
  basePrice: 500000,
  images: [{ url: "https://cdn.example.com/tote.jpg" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = null;
  mockProductIds = new Set();
});

describe("ProductCard", () => {
  it("renders the product name, formatted price and a link to the product page", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByText("Tote Bag")).toBeInTheDocument();
    expect(screen.getByText("₦5,000.00")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/tote-bag");
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://cdn.example.com/tote.jpg");
  });

  it("shows a placeholder when there is no image", () => {
    render(<ProductCard product={{ ...product, images: [] }} />);
    expect(screen.getByText("No image")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "" })).not.toBeInTheDocument();
  });

  it("hides the wishlist button when logged out", () => {
    render(<ProductCard product={product} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows an outlined heart when logged in and not wishlisted, and toggles on click", async () => {
    mockUser = { email: "ada@example.com" };
    const user = userEvent.setup();
    render(<ProductCard product={product} />);

    const button = screen.getByRole("button", { name: "Add to wishlist" });
    expect(button).toHaveTextContent("♡");

    await user.click(button);
    expect(toggle).toHaveBeenCalledWith("p1");
  });

  it("shows a filled heart when the product is already wishlisted", () => {
    mockUser = { email: "ada@example.com" };
    mockProductIds = new Set(["p1"]);
    render(<ProductCard product={product} />);
    expect(screen.getByRole("button", { name: "Remove from wishlist" })).toHaveTextContent("♥");
  });
});
