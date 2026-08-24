import ProductCard from "@/components/ProductCard";
import Hero from "@/components/Hero";
import Testimonials from "@/components/Testimonials";
import { API_URL } from "@/lib/api";

// Fetches products/reviews from the API on every request instead of at
// build time — the API isn't reachable during `next build` (isolated
// Docker build, or client built before the API is deployed), so build-time
// fetching would crash the build.
export const dynamic = "force-dynamic";

async function getNewestProducts() {
  try {
    const res = await fetch(`${API_URL}/products?sort=newest&limit=8`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.products;
  } catch {
    return [];
  }
}

async function getTestimonials() {
  try {
    const res = await fetch(`${API_URL}/reviews/featured?limit=6`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.reviews;
  } catch {
    return [];
  }
}

export default async function Home() {
  const [products, testimonials] = await Promise.all([
    getNewestProducts(),
    getTestimonials(),
  ]);
  const heroImage = products[0]?.images?.[0]?.url;

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <Hero image={heroImage} />

      {products.length > 0 && (
        <section>
          <h2 className="mb-6 text-lg font-medium">New arrivals</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      <Testimonials reviews={testimonials} />
    </div>
  );
}
