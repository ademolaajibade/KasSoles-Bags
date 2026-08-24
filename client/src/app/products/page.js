import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { API_URL } from "@/lib/api";

// Fetches products/categories from the API on every request instead of at
// build time — the API isn't reachable during `next build` (isolated
// Docker build, or client built before the API is deployed), so build-time
// fetching would crash the build.
export const dynamic = "force-dynamic";

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories;
  } catch {
    return [];
  }
}

async function getProducts(query) {
  const params = new URLSearchParams();
  if (query.gender) params.set("gender", query.gender);
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);
  if (query.sort) params.set("sort", query.sort);
  params.set("page", query.page || "1");

  try {
    const res = await fetch(`${API_URL}/products?${params.toString()}`);
    if (!res.ok) return { products: [], pagination: { page: 1, pages: 1 } };
    return res.json();
  } catch {
    return { products: [], pagination: { page: 1, pages: 1 } };
  }
}

function buildPageHref(query, page) {
  const params = new URLSearchParams();
  if (query.gender) params.set("gender", query.gender);
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);
  if (query.sort) params.set("sort", query.sort);
  params.set("page", String(page));
  return `/products?${params.toString()}`;
}

export default async function ProductsPage({ searchParams }) {
  const query = await searchParams;
  const [categories, { products, pagination }] = await Promise.all([
    getCategories(),
    getProducts(query),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Shop</h1>

      <form
        className="mb-10 flex flex-wrap items-end gap-4 text-sm"
        action="/products"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            name="search"
            defaultValue={query.search || ""}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
            placeholder="Search products"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            defaultValue={query.gender || ""}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          >
            <option value="">All</option>
            <option value="female">Women</option>
            <option value="male">Men</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            defaultValue={query.category || ""}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category._id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sort">Sort</label>
          <select
            id="sort"
            name="sort"
            defaultValue={query.sort || "newest"}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-md bg-gold px-4 py-2 text-black hover:opacity-90"
        >
          Apply
        </button>
      </form>

      {products.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4 text-sm">
          {pagination.page > 1 && (
            <Link
              href={buildPageHref(query, pagination.page - 1)}
              className="hover:opacity-70"
            >
              Previous
            </Link>
          )}
          <span className="text-black/60 dark:text-white/60">
            Page {pagination.page} of {pagination.pages}
          </span>
          {pagination.page < pagination.pages && (
            <Link
              href={buildPageHref(query, pagination.page + 1)}
              className="hover:opacity-70"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
