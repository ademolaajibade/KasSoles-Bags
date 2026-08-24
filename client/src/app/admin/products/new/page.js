import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <AdminGuard>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/admin/products"
          className="mb-4 inline-block text-sm underline text-black/60 dark:text-white/60"
        >
          ← Back to Products
        </Link>
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">
          New product
        </h1>
        <ProductForm />
      </div>
    </AdminGuard>
  );
}
