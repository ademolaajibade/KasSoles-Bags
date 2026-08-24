import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductGallery from "@/components/ProductGallery";
import ReviewsSection from "@/components/ReviewsSection";
import { API_URL } from "@/lib/api";

// Fetches the product from the API on every request instead of at build
// time — the API isn't reachable during `next build` (isolated Docker
// build, or client built before the API is deployed), so build-time
// fetching would crash the build.
export const dynamic = "force-dynamic";

async function getProduct(slug) {
  const res = await fetch(`${API_URL}/products/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load product");
  const data = await res.json();


  return data.product;

    
}

async function getRelatedProducts(categorySlug, excludeId) {
  if (!categorySlug) return [];
  try {
    const res = await fetch(
      `${API_URL}/products?category=${categorySlug}&limit=5`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.products
      .filter((product) => product._id !== excludeId)
      .slice(0, 4);
  } catch {
    return [];
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product.category?.slug, product._id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <p className="text-sm text-black/60 dark:text-white/60">
            {product.category?.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          {product.description && (
            <p className="mt-4 whitespace-pre-line text-black/70 dark:text-white/70">
              {product.description}
            </p>
          )}
          <div className="mt-6">
            <ProductDetailClient product={product} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-gold/25 pt-10">
          <h2 className="text-lg font-medium">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {related.map((relatedProduct) => (
              <ProductCard key={relatedProduct._id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}

      <ReviewsSection productId={product._id} />
    </div>
  );
}
